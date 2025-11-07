import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Lock, Upload, Trash2, Edit, LogOut, FileText } from "lucide-react";
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
      const response = await axios.post(`${API}/auth/login`, { password });
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
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/notes`);
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
      await axios.post(`${API}/notes/upload`, formData, {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md glass-effect border-0 shadow-2xl fade-in">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl">Admin Login</CardTitle>
            <p className="text-gray-600 mt-2">Enter your password to access the admin dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  data-testid="admin-password-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="admin-login-submit">
                Login
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/')}
                data-testid="back-to-home-btn"
              >
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')} data-testid="view-public-btn">
                View Public Site
              </Button>
              <Button variant="outline" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <Card className="glass-effect border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Upload New Note</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowUploadDialog(true)} className="gap-2" data-testid="open-upload-dialog">
                <Upload className="w-4 h-4" />
                Upload PDF
              </Button>
            </CardContent>
          </Card>

          {/* Notes List */}
          <div className="space-y-4" data-testid="admin-notes-list">
            {notes.map((note) => (
              <Card key={note.id} className="glass-effect border-0 shadow-md hover-lift" data-testid={`admin-note-${note.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-semibold" data-testid={`admin-note-title-${note.id}`}>{note.title}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                          {note.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{note.description}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(note.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNote(note);
                          setShowEditDialog(true);
                        }}
                        data-testid={`edit-note-${note.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(note.id)}
                        data-testid={`delete-note-${note.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent data-testid="upload-dialog">
          <DialogHeader>
            <DialogTitle>Upload New Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                required
                data-testid="upload-title-input"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={3}
                data-testid="upload-description-input"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={uploadForm.category} onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}>
                <SelectTrigger data-testid="upload-category-select">
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                required
                data-testid="upload-file-input"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1" data-testid="upload-submit-btn">
                {loading ? "Uploading..." : "Upload"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)} data-testid="upload-cancel-btn">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingNote && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent data-testid="edit-dialog">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  required
                  data-testid="edit-title-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingNote.description}
                  onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                  rows={3}
                  data-testid="edit-description-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingNote.category} onValueChange={(value) => setEditingNote({ ...editingNote, category: value })}>
                  <SelectTrigger data-testid="edit-category-select">
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" data-testid="edit-submit-btn">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} data-testid="edit-cancel-btn">
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
