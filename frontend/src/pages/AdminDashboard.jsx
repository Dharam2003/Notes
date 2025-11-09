import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import Masonry from "react-masonry-css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Lock, Upload, Trash2, Edit, LogOut, BookOpen, Home, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "",
    file: null
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      setIsAuthenticated(true);
      fetchCategories();
      fetchNotes();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/api/auth/login`, { password });
      localStorage.setItem("admin_token", response.data.access_token);
      setIsAuthenticated(true);
      toast.success("Login successful!");
      fetchCategories();
      fetchNotes();
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setPassword("");
    navigate("/");
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/api/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/api/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("category", uploadForm.category);
      formData.append("file", uploadForm.file);

      const token = localStorage.getItem("admin_token");
      await axios.post(`${API}/api/notes/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });

      toast.success("Note uploaded successfully!");
      setShowUploadDialog(false);
      setUploadForm({ title: "", description: "", category: "", file: null });
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload note");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `${API}/notes/${editingNote.id}`,
        {
          title: editingNote.title,
          description: editingNote.description,
          category: editingNote.category
        },
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      );
      toast.success("Note updated successfully!");
      setShowEditDialog(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API}/notes/${noteId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      toast.success("Note deleted successfully!");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const getCategoryClass = (category) => {
    return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const breakpointColumnsObj = {
    default: 4,
    1536: 3,
    1024: 2,
    768: 2,
    640: 1
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-fadeInUp">
          <div className="text-center mb-8">
            <div className="w-20 h-20 pinterest-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Enter your password to access the dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="mt-2 h-12 border-2"
                data-testid="admin-password-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 pinterest-red text-lg font-semibold" 
              data-testid="admin-login-submit"
            >
              Login
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12" 
              onClick={() => navigate('/')}
              data-testid="back-to-home-btn"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pinterest-style Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 pinterest-red rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your study notes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                className="hidden sm:flex"
                data-testid="view-public-btn"
              >
                <Home className="w-4 h-4 mr-2" />
                View Public
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="ghost"
                className="sm:hidden"
                data-testid="view-public-btn-mobile"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="hidden sm:flex"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="ghost"
                className="sm:hidden"
                data-testid="logout-btn-mobile"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Upload Button */}
        <div className="mb-8 text-center">
          <Button 
            onClick={() => setShowUploadDialog(true)} 
            className="pinterest-red h-14 px-8 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            data-testid="open-upload-dialog"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload New Note
          </Button>
          <p className="text-gray-500 text-sm mt-3">Total Notes: {notes.length}</p>
        </div>

        {/* Notes Masonry Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-6">Upload your first study note to get started</p>
            <Button 
              onClick={() => setShowUploadDialog(true)} 
              className="pinterest-red"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Note
            </Button>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {notes.map((note) => (
              <div
                key={note.id}
                className="pinterest-card bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl group"
                data-testid={`admin-note-${note.id}`}
              >
                {/* Category Header */}
                <div className={`h-28 ${getCategoryClass(note.category)} p-4 flex items-center justify-center`}>
                  <div className="text-center text-white">
                    <BookOpen className="w-10 h-10 mx-auto mb-1 opacity-90" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {note.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 
                    className="text-lg font-bold text-gray-900 mb-2 line-clamp-2" 
                    data-testid={`admin-note-title-${note.id}`}
                  >
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {note.description || "No description"}
                  </p>
                  <div className="text-xs text-gray-500 mb-4">
                    <p>Uploaded: {new Date(note.upload_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                    <p className="mt-1 font-medium">{note.pdf_filename}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingNote(note);
                        setShowEditDialog(true);
                      }}
                      data-testid={`edit-note-${note.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleDelete(note.id)}
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-xl" data-testid="upload-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upload New Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <Label htmlFor="title" className="font-semibold">Title *</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                required
                className="mt-2 h-11"
                placeholder="Enter note title"
                data-testid="upload-title-input"
              />
            </div>
            <div>
              <Label htmlFor="description" className="font-semibold">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={4}
                className="mt-2"
                placeholder="Describe your note..."
                data-testid="upload-description-input"
              />
            </div>
            <div>
              <Label htmlFor="category" className="font-semibold">Category *</Label>
              <Select 
                value={uploadForm.category} 
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger className="mt-2 h-11" data-testid="upload-category-select">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category} data-testid={`upload-category-${category.toLowerCase()}`}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file" className="font-semibold">PDF File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                required
                className="mt-2 h-11"
                data-testid="upload-file-input"
              />
              {uploadForm.file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {uploadForm.file.name}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 h-11 pinterest-red font-semibold" 
                data-testid="upload-submit-btn"
              >
                {loading ? "Uploading..." : "Upload Note"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUploadDialog(false)} 
                className="h-11"
                data-testid="upload-cancel-btn"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingNote && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-xl" data-testid="edit-dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-5">
              <div>
                <Label htmlFor="edit-title" className="font-semibold">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  required
                  className="mt-2 h-11"
                  data-testid="edit-title-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="font-semibold">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingNote.description}
                  onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                  rows={4}
                  className="mt-2"
                  data-testid="edit-description-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="font-semibold">Category *</Label>
                <Select 
                  value={editingNote.category} 
                  onValueChange={(value) => setEditingNote({ ...editingNote, category: value })}
                >
                  <SelectTrigger className="mt-2 h-11" data-testid="edit-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} data-testid={`edit-category-${category.toLowerCase()}`}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  className="flex-1 h-11 pinterest-red font-semibold" 
                  data-testid="edit-submit-btn"
                >
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)} 
                  className="h-11"
                  data-testid="edit-cancel-btn"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;
