import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { ArrowLeft, Share2, Download, BookOpen, Home } from "lucide-react";
import { toast } from "sonner";

const NotePage = () => {
  // support either /note/:noteId OR /:category/:slug
  const params = useParams();
  const { noteId } = params;
  // category and slug from pretty URL
  const categoryParam = params.category;
  const slugParam = params.slug;

  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    fetchNote();
  }, [noteId, categoryParam, slugParam]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      let response;
      if (noteId) {
        // FIX: Prepend /api/ to the endpoint
        response = await axios.get(`${API}/api/notes/${noteId}`);
      } else if (categoryParam && slugParam) {
        // FIX: Prepend /api/ to the endpoint
        response = await axios.get(`${API}/api/notes/by-link/${categoryParam}/${slugParam}`);
      } else {
        throw new Error("Invalid route");
      }
      setNote(response.data);
      // FIX: Prepend /api/ to the endpoint
      setPdfUrl(`${API}/api/pdf/${response.data.pdf_file_id}`);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Note not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!note) return;
    const categorySlug = note.category_slug || (note.category || "").toLowerCase().replace(/\s+/g, '-');
    const slug = note.slug || note.id;
    const link = `${window.location.origin}/${categorySlug}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get(pdfUrl, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', note.pdf_filename);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pinterest-style Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="gap-2 hover:bg-gray-100"
              data-testid="back-to-home"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 pinterest-red rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 hidden sm:block">Study Vault</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={copyShareLink} 
                className="gap-2 hidden sm:flex"
                data-testid="share-note-btn"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button 
                onClick={copyShareLink} 
                variant="ghost"
                className="sm:hidden"
                data-testid="share-note-btn-mobile"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                onClick={downloadPDF} 
                className="pinterest-red gap-2 hidden sm:flex"
                data-testid="download-pdf-btn"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button 
                onClick={downloadPDF} 
                className="pinterest-red sm:hidden"
                data-testid="download-pdf-btn-mobile"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Note Info Card */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden animate-fadeInUp">
          {/* Category Banner */}
          <div className={`${getCategoryClass(note.category)} h-24 flex items-center justify-center`}>
            <div className="text-center text-white">
              <BookOpen className="w-10 h-10 mx-auto mb-1 opacity-90" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {note.category}
              </span>
            </div>
          </div>

          {/* Note Details */}
          <div className="p-6 sm:p-8">
            <h1 
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" 
              data-testid="note-page-title"
            >
              {note.title}
            </h1>
            <p 
              className="text-gray-600 text-lg mb-4" 
              data-testid="note-page-description"
            >
              {note.description || "No description provided"}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div>
                <span className="font-semibold">Uploaded:</span>{" "}
                {new Date(note.upload_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div>
                <span className="font-semibold">File:</span> {note.pdf_filename}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">PDF Viewer</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={downloadPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          <div className="p-2 sm:p-4">
            <div 
              className="bg-gray-50 rounded-lg overflow-hidden" 
              style={{ height: '80vh', minHeight: '500px' }}
            >
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
                data-testid="pdf-viewer"
              />
            </div>
          </div>
        </div>

        {/* Back to Notes Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Back to All Notes
          </Button>
        </div>
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

export default NotePage;