## 📚 Study Vault: Pinterest-Style Document Organizer

A full-stack web application designed for efficiently organizing, browsing, and managing study notes (PDFs). It features a modern, responsive **Pinterest-style frontend** with a dynamic masonry layout, backed by a robust **FastAPI backend** for secure document storage and API management.

### ✨ Key Features

  * **Pinterest-Style UI & Masonry Layout:** A visually engaging, responsive design utilizing a dynamic masonry grid for browsing notes.
  * **Secure Admin Dashboard:** A dedicated and password-protected interface for administrators to perform CRUD (Create, Read, Update, Delete) operations on notes and manage categories.
  * **Document Management:** PDFs are securely stored in MongoDB's GridFS.
  * **Public Access:** Users can view, filter, sort, and download categorized notes.
  * **Unique Shareable Links:** Each note has a unique, clean URL (`/:category/:slug`) for easy sharing.

-----

### 💻 Tech Stack

| Component | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | **React** (CRACO) | `react-router-dom`, `react-masonry-css`, `tailwindcss`, `@radix-ui/react-*`, `sonner` |
| **Backend** | **FastAPI** (Python) | `motor` (MongoDB async driver), `python-dotenv`, `pyjwt`, `passlib` |
| **Database** | **MongoDB** | GridFS for binary PDF storage |

-----

### 🚀 Getting Started

Follow these steps to set up and run the project locally.

#### Prerequisites

  * **Python 3.10+** (for the Backend)
  * **Node.js / Yarn** (for the Frontend)
  * **MongoDB Instance** (Local or Atlas)

#### 1\. Setup Backend

1.  **Navigate** to the backend directory:

    ```bash
    cd backend
    ```

2.  **Create** a `.env` file for configuration and replace the placeholders:

    ```
    # .env file in backend/
    MONGO_URL="mongodb://localhost:27017" # Replace with your MongoDB connection string
    DB_NAME="study_vault_db"
    CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
    ```

3.  **Install** dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Run** the FastAPI server:

    ```bash
    uvicorn server:app --reload
    ```

    The backend API will run at `http://127.0.0.1:8000/api`.

#### 2\. Setup Frontend

1.  **Navigate** to the frontend directory:

    ```bash
    cd frontend
    ```

2.  **Create** a `.env.local` file to point to the backend:

    ```
    # .env.local file in frontend/
    REACT_APP_BACKEND_URL="http://127.0.0.1:8000"
    ```

3.  **Install** dependencies using Yarn (as specified in `packageManager` in `package.json`):

    ```bash
    yarn install
    ```

4.  **Run** the React application:

    ```bash
    yarn start
    ```

    The application will open in your browser at `http://localhost:3000`.

### 🔑 Admin Access

The Admin Dashboard for uploading and managing notes is located at `/admin`.

  * **Default Admin Password (for local setup):** `Dharam@2003`
    *Note: This password is set in the `backend/server.py` file and should be changed in a production environment.*

-----

### 📜 Available Frontend Scripts

From the `/frontend` directory, you can run the following scripts:

  * `yarn start`: Runs the app in development mode using CRACO.
  * `yarn build`: Builds the app for production to the `build` folder using CRACO.
  * `yarn test`: Launches the test runner.
