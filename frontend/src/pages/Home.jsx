import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { BookOpen, Search, Filter, Share2, Download, Lock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchNotes();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(["All", ...response.data.categories]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        sort_by: sortBy
      };
      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      const response = await axios.get(`${API}/notes`, { params });
      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyShareLink = (noteId) => {
    const link = `${window.location.origin}/note/${noteId}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied to clipboard!");
  };

  const downloadPDF = async (fileId, filename) => {
    try {
      const response = await axios.get(`${API}/pdf/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-200">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center fade-in">
            <div className="inline-flex items-center justify-center p-2 bg-white rounded-full shadow-md mb-6">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Study Vault
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Access organized study notes anytime, anywhere. Browse, search, and download PDF resources with ease.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={() => navigate('/admin')} 
                variant="outline" 
                className="gap-2"
                data-testid="admin-login-btn"
              >
                <Lock className="w-4 h-4" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass-effect rounded-2xl p-6 mb-8 slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>

              {/* Category Filter */}
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} data-testid={`category-${category.toLowerCase()}`}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="sort-filter">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc" data-testid="sort-date-desc">Newest First</SelectItem>
                    <SelectItem value="date_asc" data-testid="sort-date-asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc" data-testid="sort-name-asc">A to Z</SelectItem>
                    <SelectItem value="name_desc" data-testid="sort-name-desc">Z to A</SelectItem>
                    <SelectItem value="category" data-testid="sort-category">By Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No notes found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="notes-grid">
              {filteredNotes.map((note, index) => (
                <Card 
                  key={note.id} 
                  className="hover-lift cursor-pointer fade-in border-0 shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  data-testid={`note-card-${note.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        {note.category}
                      </span>
                    </div>
                    <CardTitle className="text-xl" data-testid={`note-title-${note.id}`}>{note.title}</CardTitle>
                    <CardDescription className="line-clamp-2" data-testid={`note-description-${note.id}`}>
                      {note.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        {new Date(note.upload_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => navigate(`/note/${note.id}`)}
                          data-testid={`view-note-${note.id}`}
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyShareLink(note.id);
                          }}
                          data-testid={`share-note-${note.id}`}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPDF(note.pdf_file_id, note.pdf_filename);
                          }}
                          data-testid={`download-note-${note.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Study Vault. Organize, Share, Learn.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
