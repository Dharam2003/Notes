import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import Masonry from "react-masonry-css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BookOpen, Search, Share2, Download, Lock, Eye, Menu } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    (note.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyShareLink = (note) => {
    // use category_slug and slug returned from backend
    const categorySlug = note.category_slug || (note.category || "").toLowerCase().replace(/\s+/g, '-');
    const slug = note.slug || note.id;
    const link = `${window.location.origin}/${categorySlug}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
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

  const getCategoryClass = (category) => {
    return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  };

  // Masonry breakpoint configuration
  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pinterest-style Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 pinterest-red rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Study Vault</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-4xl">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pinterest-search h-12 bg-gray-100 border-0"
                  data-testid="search-input"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 h-12 border-0 bg-gray-100" data-testid="category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category} data-testid={`category-${category.toLowerCase()}`}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-12 border-0 bg-gray-100" data-testid="sort-filter">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc" data-testid="sort-date-desc">Newest</SelectItem>
                  <SelectItem value="date_asc" data-testid="sort-date-asc">Oldest</SelectItem>
                  <SelectItem value="name_asc" data-testid="sort-name-asc">A-Z</SelectItem>
                  <SelectItem value="name_desc" data-testid="sort-name-desc">Z-A</SelectItem>
                  <SelectItem value="category" data-testid="sort-category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Admin Button */}
            <Button 
              onClick={() => navigate('/admin')} 
              className="pinterest-red flex-shrink-0"
              size="sm"
              data-testid="admin-login-btn"
            >
              <Lock className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Admin</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Search & Filters */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-3 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pinterest-search h-12 bg-gray-100 border-0"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1 h-12 border-0 bg-gray-100">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1 h-12 border-0 bg-gray-100">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Newest</SelectItem>
                    <SelectItem value="date_asc">Oldest</SelectItem>
                    <SelectItem value="name_asc">A-Z</SelectItem>
                    <SelectItem value="name_desc">Z-A</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 pinterest-red rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No notes found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {filteredNotes.map((note, index) => (
              <div
                key={note.id}
                className="pinterest-card bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl group"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`note-card-${note.id}`}
              >
                {/* Category Header with Gradient */}
                <div className={`h-32 ${getCategoryClass(note.category)} p-4 flex items-center justify-center relative`}>
                  <div className="text-center text-white">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-90" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {note.category}
                    </span>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="card-overlay absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
                      onClick={() => navigate(`/note/${note.id}`)}
                      data-testid={`view-note-${note.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyShareLink(note);
                      }}
                      data-testid={`share-note-${note.id}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
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

                {/* Card Content */}
                <div className="p-4">
                  <h3 
                    className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => navigate(`/note/${note.id}`)}
                    data-testid={`note-title-${note.id}`}
                  >
                    {note.title}
                  </h3>
                  <p 
                    className="text-sm text-gray-600 line-clamp-3 mb-3" 
                    data-testid={`note-description-${note.id}`}
                  >
                    {note.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(note.upload_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="font-medium">{note.pdf_filename.replace('.pdf', '')}</span>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Bipul Sir notes • Your organized study companion • Designed by Dharam
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
