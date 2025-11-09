import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import NotePage from "./pages/NotePage";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Pretty slug route (category/slug) */}
          <Route path="/:category/:slug" element={<NotePage />} />

          {/* Backwards-compatible route by id */}
          <Route path="/note/:noteId" element={<NotePage />} />

          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
