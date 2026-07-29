"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft, ZoomIn, ZoomOut, Maximize, Minimize,
  ChevronLeft, ChevronRight, Highlighter, Loader2,
  Copy, Check,
} from "lucide-react";

// Load pdfjs types
let pdfjsLib: any = null;

export default function BookReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [highlightPos, setHighlightPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load book data
  useEffect(() => {
    api.get(`/books/${id}/read`).then(({ data }) => {
      setBook(data.book);
    }).catch((e) => {
      setError(e.response?.data?.error || "Failed to load book");
      setLoading(false);
    });
  }, [id]);

  // Load PDF
  useEffect(() => {
    if (!book) return;
    if (book.fileType !== "pdf") {
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

        const baseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");
        const fileUrl = `${baseUrl}${book.fileUrl}`;

        // Fetch with auth token since /uploads may require it
        const token = typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : null;
        const response = await fetch(fileUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (e) {
        console.error("PDF load error:", e);
        setError("Failed to load PDF: " + (e as Error).message);
        setLoading(false);
      }
    };
    loadPdf();
  }, [book]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    setRendering(true);
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      // Render text layer for selection
      if (textLayerRef.current && pdfjsLib) {
        textLayerRef.current.innerHTML = "";
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        textContent.items.forEach((item: any) => {
          if (!item.str) return;
          const tx = pdfjsLib.Util.transform(
            pdfjsLib.Util.transform(item.transform, [scale, 0, 0, scale, 0, 0]),
            [1, 0, 0, -1, 0, viewport.height]
          );

          const span = document.createElement("span");
          span.textContent = item.str;
          span.style.position = "absolute";
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - (item.height || item.transform[3]) * scale}px`;
          span.style.fontSize = `${(item.height || Math.abs(item.transform[3])) * scale}px`;
          span.style.fontFamily = "sans-serif";
          span.style.color = "transparent";
          span.style.userSelect = "text";
          span.style.cursor = "text";
          span.style.whiteSpace = "pre";
          span.style.transformOrigin = "0 0";
          textLayerRef.current!.appendChild(span);
        });
      }
    } catch (e) {
      console.error("Render error:", e);
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (pdfDoc && !loading) renderPage();
  }, [renderPage, pdfDoc, loading]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Text selection → highlight
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0 && textLayerRef.current && selection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setHighlightPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 10,
        });
        setShowHighlightPopup(true);
      }
    } else {
      setShowHighlightPopup(false);
    }
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      setHighlights([...highlights, { page: currentPage, text }]);
      setShowHighlightPopup(false);
      selection?.removeAllRanges();
    }
  };

  const handleCopy = () => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrevPage();
      if (e.key === "ArrowRight") goNextPage();
      if (e.key === "Escape" && !isFullscreen) router.back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, numPages, isFullscreen]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-sm">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Non-PDF fallback
  if (book && book.fileType !== "pdf") {
    const fullUrl = `${api.defaults.baseURL}${book.fileUrl}`;
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center max-w-md">
          <p className="text-white/70 mb-4">This file type ({book.fileType}) is not supported for inline reading.</p>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
            Open File
          </a>
          <button onClick={() => router.back()} className="ml-3 px-4 py-2 rounded-xl bg-white/10 text-white text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-800 z-50 flex flex-col" onMouseUp={handleMouseUp}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Back">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-white/80 text-sm hidden sm:block">
            <span className="font-medium">{book?.title}</span>
            <span className="text-white/40 ml-2">by {book?.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Page navigation */}
          <button onClick={goPrevPage} disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" title="Previous page">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/60 text-xs px-2 min-w-[60px] text-center">
            {currentPage} / {numPages}
          </span>
          <button onClick={goNextPage} disabled={currentPage >= numPages}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" title="Next page">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Zoom */}
          <button onClick={() => setScale(Math.max(0.5, scale - 0.2))} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Zoom out">
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/60 text-xs px-1 min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(3, scale + 0.2))} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Zoom in">
            <ZoomIn className="w-5 h-5 text-white" />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Fullscreen">
            {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Highlight popup */}
      {showHighlightPopup && (
        <div
          className="absolute z-[60] flex items-center gap-1 bg-gray-900 rounded-lg shadow-xl border border-gray-700 px-1 py-1"
          style={{ left: `${highlightPos.x - 60}px`, top: `${highlightPos.y - 45}px` }}
        >
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Copy text">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
          </button>
          <button onClick={handleHighlight} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Highlight">
            <Highlighter className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-4 px-4">
        <div className="relative shadow-2xl" style={{ background: "white" }}>
          <canvas ref={canvasRef} className="block" />
          <div
            ref={textLayerRef}
            className="absolute top-0 left-0 pointer-events-auto"
            style={{ mixBlendMode: "multiply" }}
          />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Highlights panel (bottom) */}
      {highlights.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 max-h-32 overflow-y-auto shrink-0">
          <p className="text-amber-400 text-xs font-semibold mb-1 flex items-center gap-1">
            <Highlighter className="w-3 h-3" /> Highlights ({highlights.length})
          </p>
          <div className="space-y-1">
            {highlights.map((h, i) => (
              <div key={i} className="text-white/60 text-xs bg-white/5 rounded px-2 py-1">
                <span className="text-white/40">Page {h.page}:</span> {h.text.slice(0, 80)}{h.text.length > 80 ? "..." : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
