"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/lib/api";
import {
  BookOpen, Upload, Trash2, Edit3, X, Plus, FileText, DollarSign,
  ToggleLeft, ToggleRight, Loader2,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  fileUrl: string;
  fileType: string;
  price: number;
  currency: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { purchases: number };
}

export default function AdminBooksPage() {
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", author: "", description: "", price: "0", category: "", isActive: true });
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({ title: "", author: "", description: "", price: "0", category: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBooks = () => {
    api.get("/admin/books").then(({ data }) => setBooks(data.books || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.author || !uploadFile) {
      setError("Title, author, and book file are required");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("author", uploadForm.author);
      formData.append("description", uploadForm.description);
      formData.append("price", uploadForm.price);
      formData.append("category", uploadForm.category);
      formData.append("file", uploadFile);

      await api.post("/admin/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUpload(false);
      setUploadForm({ title: "", author: "", description: "", price: "0", category: "" });
      setUploadFile(null);
      fetchBooks();
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to upload book");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await api.delete(`/admin/books/${id}`);
      fetchBooks();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete book");
    }
  };

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setEditForm({
      title: book.title,
      author: book.author,
      description: book.description || "",
      price: String(book.price),
      category: book.category || "",
      isActive: book.isActive,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.put(`/admin/books/${id}`, editForm);
      setEditingId(null);
      fetchBooks();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to update book");
    }
  };

  const toggleActive = async (book: Book) => {
    try {
      await api.put(`/admin/books/${book.id}`, { isActive: !book.isActive });
      fetchBooks();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to toggle book");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Books Library</h1>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Upload and manage books for users to read</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
        >{showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showUpload ? "Cancel" : "Upload Book"}</button>
      </div>

      {showUpload && (
        <div className="mb-6 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload New Book</h3>
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Title *</label>
              <input value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Author *</label>
              <input value={uploadForm.author} onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Price (Birr) — 0 for free</label>
              <input type="number" min="0" value={uploadForm.price} onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Category</label>
              <input value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                placeholder="e.g. Marriage, Quran, Hadith"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Description</label>
              <textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Book File (PDF, EPUB, TXT, DOC, DOCX) *</label>
              <input ref={fileRef} type="file" accept=".pdf,.epub,.txt,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 dark:text-white file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1a1a2e] file:text-white file:dark:bg-white file:dark:text-[#1a1a2e] file:text-sm file:font-medium file:cursor-pointer" />
              {uploadFile && <p className="mt-1 text-xs text-gray-500">Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
            >{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading ? "Uploading..." : "Upload Book"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-white">No books uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(book)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" title={book.isActive ? "Active" : "Inactive"}>
                      {book.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button onClick={() => startEdit(book)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => handleDelete(book.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {editingId === book.id ? (
                  <div className="space-y-2">
                    <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                    <input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                    <div className="flex gap-2">
                      <input type="number" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                      <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        placeholder="Category"
                        className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs text-gray-600 dark:text-white">Cancel</button>
                      <button onClick={() => saveEdit(book.id)} className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1">{book.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-white mb-2">by {book.author}</p>
                    {book.description && <p className="text-xs text-gray-400 dark:text-gray-400 line-clamp-2 mb-2">{book.description}</p>}
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${book.price === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {book.price === 0 ? "Free" : `${book.price} ${book.currency}`}
                      </span>
                      {book.category && <span className="text-gray-400 dark:text-gray-500">{book.category}</span>}
                      <span className="text-gray-400 dark:text-gray-500 uppercase">{book.fileType}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>{book._count?.purchases || 0} purchases</span>
                      {!book.isActive && <span className="text-red-400">Inactive</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
