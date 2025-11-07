import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Share2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/notes/${noteId}`);
      setNote(response.data);
      setPdfUrl(`${API}/pdf/${response.data.pdf_file_id}`);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Note not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied to clipboard!");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2" data-testid="back-to-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Notes
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyShareLink} className="gap-2" data-testid="share-note-btn">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button onClick={downloadPDF} className="gap-2" data-testid="download-pdf-btn">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Note Info */}
          <Card className="glass-effect border-0 shadow-lg mb-6 fade-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                      {note.category}
                    </span>
                  </div>
                  <CardTitle className="text-3xl mb-3" data-testid="note-page-title">{note.title}</CardTitle>
                  <p className="text-gray-600 mb-2" data-testid="note-page-description">{note.description || "No description provided"}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded: {new Date(note.upload_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* PDF Viewer */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-white rounded-lg shadow-inner" style={{ height: '800px' }}>
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg"
                  title="PDF Viewer"
                  data-testid="pdf-viewer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotePage;
