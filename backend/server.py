from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
fs = AsyncIOMotorGridFSBucket(db)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "study-vault-secret-key-2024"
ALGORITHM = "HS256"
ADMIN_PASSWORD = "Dharam@2003"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Predefined categories
PREDEFINED_CATEGORIES = [
    "Mathematics",
    "Science",
    "Computer Science",
    "Engineering",
    "Business",
    "Literature",
    "History",
    "Languages",
    "Arts",
    "Other"
]

# Models
class AdminLogin(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    category: str
    pdf_file_id: str
    pdf_filename: str
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    share_link: str
    order: int = 0

class NoteResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    pdf_file_id: str
    pdf_filename: str
    upload_date: str
    share_link: str
    order: int

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@api_router.post("/auth/login", response_model=Token)
async def login(credentials: AdminLogin):
    if credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    access_token = create_access_token({"role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": PREDEFINED_CATEGORIES}

@api_router.post("/notes/upload")
async def upload_note(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(...),
    file: UploadFile = File(...),
    admin: dict = Depends(verify_admin)
):
    # Validate category
    if category not in PREDEFINED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Upload file to GridFS
    contents = await file.read()
    file_id = await fs.upload_from_stream(
        file.filename,
        io.BytesIO(contents),
        metadata={"content_type": "application/pdf"}
    )
    
    # Create note document
    note_id = str(uuid.uuid4())
    note = Note(
        id=note_id,
        title=title,
        description=description,
        category=category,
        pdf_file_id=str(file_id),
        pdf_filename=file.filename,
        share_link=note_id
    )
    
    # Save to database
    doc = note.model_dump()
    doc['upload_date'] = doc['upload_date'].isoformat()
    await db.notes.insert_one(doc)
    
    return {"message": "Note uploaded successfully", "note_id": note_id}

@api_router.get("/notes", response_model=List[NoteResponse])
async def get_notes(
    category: Optional[str] = None,
    sort_by: Optional[str] = "date_desc"
):
    # Build query
    query = {}
    if category and category != "All":
        query["category"] = category
    
    # Fetch notes
    notes = await db.notes.find(query, {"_id": 0}).to_list(1000)
    
    # Convert datetime
    for note in notes:
        if isinstance(note['upload_date'], str):
            note['upload_date'] = datetime.fromisoformat(note['upload_date'])
    
    # Sort notes
    if sort_by == "date_desc":
        notes.sort(key=lambda x: x['upload_date'], reverse=True)
    elif sort_by == "date_asc":
        notes.sort(key=lambda x: x['upload_date'])
    elif sort_by == "name_asc":
        notes.sort(key=lambda x: x['title'].lower())
    elif sort_by == "name_desc":
        notes.sort(key=lambda x: x['title'].lower(), reverse=True)
    elif sort_by == "category":
        notes.sort(key=lambda x: x['category'])
    elif sort_by == "custom":
        notes.sort(key=lambda x: x.get('order', 0))
    
    # Format response
    response = []
    for note in notes:
        response.append(NoteResponse(
            id=note['id'],
            title=note['title'],
            description=note['description'],
            category=note['category'],
            pdf_file_id=note['pdf_file_id'],
            pdf_filename=note['pdf_filename'],
            upload_date=note['upload_date'].isoformat(),
            share_link=note['share_link'],
            order=note.get('order', 0)
        ))
    
    return response

@api_router.get("/notes/{note_id}")
async def get_note(note_id: str):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if isinstance(note['upload_date'], str):
        note['upload_date'] = datetime.fromisoformat(note['upload_date'])
    
    return NoteResponse(
        id=note['id'],
        title=note['title'],
        description=note['description'],
        category=note['category'],
        pdf_file_id=note['pdf_file_id'],
        pdf_filename=note['pdf_filename'],
        upload_date=note['upload_date'].isoformat(),
        share_link=note['share_link'],
        order=note.get('order', 0)
    )

@api_router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    note_update: NoteUpdate,
    admin: dict = Depends(verify_admin)
):
    # Check if note exists
    existing_note = await db.notes.find_one({"id": note_id})
    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Build update data
    update_data = {}
    if note_update.title is not None:
        update_data["title"] = note_update.title
    if note_update.description is not None:
        update_data["description"] = note_update.description
    if note_update.category is not None:
        if note_update.category not in PREDEFINED_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        update_data["category"] = note_update.category
    if note_update.order is not None:
        update_data["order"] = note_update.order
    
    if update_data:
        await db.notes.update_one({"id": note_id}, {"$set": update_data})
    
    return {"message": "Note updated successfully"}

@api_router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    admin: dict = Depends(verify_admin)
):
    # Get note to find file_id
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Delete file from GridFS
    try:
        await fs.delete(ObjectId(note['pdf_file_id']))
    except:
        pass
    
    # Delete note document
    await db.notes.delete_one({"id": note_id})
    
    return {"message": "Note deleted successfully"}

@api_router.get("/pdf/{file_id}")
async def get_pdf(file_id: str):
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        contents = await grid_out.read()
        
        return StreamingResponse(
            io.BytesIO(contents),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={grid_out.filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="PDF not found")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
