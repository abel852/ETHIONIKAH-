"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import api from "@/lib/api";
import { paymentService } from "@/services/payment";
import { mediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  BookOpen, FileText, CheckCircle, Lock, Download,
  Loader2, Library, Search, ChevronLeft, Copy, Upload,
  Clock, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  price: number;
  currency: string;
  category?: string;
  fileType: string;
  createdAt: string;
  isPurchased?: boolean;
  isPending?: boolean;
  purchasedAt?: string;
}

type Step = "library" | "payment" | "confirm" | "done";

export default function UserBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"library" | "my-books">("library");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Payment flow state
  const [step, setStep] = useState<Step>("library");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBooks = useCallback(() => {
    Promise.all([
      api.get("/books").then(({ data }) => data.books || []),
      api.get("/books/my").then(({ data }) => data.books || []),
      paymentService.getMyPayments({ status: "pending" }).then(({ data }) => {
        const payments = data.data || data.payments || [];
        return payments.filter((p: any) => p.planType?.startsWith("book:"));
      }).catch(() => []),
    ]).then(([available, mine, pendingBookPayments]) => {
      const pendingBookIds = new Set(pendingBookPayments.map((p: any) => {
        const match = p.planType?.match(/^book:(.+)$/);
        return match ? match[1] : null;
      }).filter(Boolean));
      setBooks(available.map((b: Book) => ({ ...b, isPending: pendingBookIds.has(b.id) })));
      setMyBooks(mine);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBooks();
    paymentService.getPaymentMethods().then(({ data }) => {
      setPaymentMethods(data.data || []);
    }).catch(() => {});
  }, [fetchBooks]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handlePurchase = (book: Book) => {
    if (book.price === 0) {
      api.post(`/books/${book.id}/purchase`).then(() => {
        fetchBooks();
        toast.success("Book unlocked!");
      }).catch((e: any) => {
        toast.error(e.response?.data?.error || "Failed to unlock book");
      });
      return;
    }
    setSelectedBook(book);
    setStep("payment");
    setSelectedMethod(null);
    setReferenceNumber("");
    setTransactionId("");
    setReceiptUrl("");
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await paymentService.uploadReceipt(file);
      setReceiptUrl(data.receiptUrl || "");
      toast.success("Receipt uploaded");
    } catch {
      toast.error("Failed to upload receipt");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedBook || !selectedMethod) return;
    if (!referenceNumber.trim()) {
      toast.error("Reference number is required");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.createRequest({
        planType: `book:${selectedBook.id}`,
        amount: selectedBook.price,
        paymentMethod: selectedMethod.key,
        transactionId: transactionId.trim() || undefined,
        referenceNumber: referenceNumber.trim(),
        receiptUrl: receiptUrl || undefined,
      });
      setStep("done");
      fetchBooks();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep("library");
    setSelectedBook(null);
    setSelectedMethod(null);
    setReferenceNumber("");
    setTransactionId("");
    setReceiptUrl("");
  };

  const handleDownload = async (book: Book) => {
    try {
      const { data } = await api.get(`/books/${book.id}/read`);
      const baseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");
      const fileUrl = `${baseUrl}${data.book.fileUrl}`;
      const token = typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : null;
      const response = await fetch(fileUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title}.${data.book.fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to download book");
    }
  };

  const filteredBooks = (tab === "library" ? books : myBooks).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.category || "").toLowerCase().includes(q);
  });

  // === Payment flow views ===
  if (step !== "library" && selectedBook) {
    return (
      <>
        <DashboardSidebar />
        <main className="lg:ml-64 pt-14 lg:pt-0 pb-8 px-4 lg:px-8 max-w-3xl mx-auto">
          <div className="py-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            {/* STEP: PAYMENT METHOD */}
            {step === "payment" && (
              <div>
                <button onClick={resetFlow} className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white mb-4">
                  <ChevronLeft className="w-4 h-4" /> Back to Books
                </button>

                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-charcoal-900 dark:text-white">{selectedBook.title}</p>
                        <p className="text-xs text-charcoal-400">by {selectedBook.author}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{selectedBook.currency} {selectedBook.price.toLocaleString()}</p>
                  </div>
                </div>

                <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-1">Choose Payment Method</h2>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">Send <span className="font-semibold">{selectedBook.currency} {selectedBook.price.toLocaleString()}</span> to one of the accounts below, then continue.</p>

                <div className="space-y-3">
                  {paymentMethods.length === 0 ? (
                    <p className="text-sm text-charcoal-400 text-center py-4">No payment methods available. Please contact support.</p>
                  ) : paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn("rounded-2xl border p-4 transition-all cursor-pointer bg-white dark:bg-charcoal-800 border-charcoal-200 dark:border-charcoal-700",
                        selectedMethod?.id === method.id ? "ring-2 ring-accent" : "")}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedMethod?.id === method.id ? "border-accent" : "border-charcoal-300")}>
                            {selectedMethod?.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal-900 dark:text-white">{method.name}</p>
                            {method.instructions && <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{method.instructions}</p>}
                          </div>
                        </div>
                        {method.accountInfo && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-charcoal-900 dark:text-white tracking-wider text-sm">{method.accountInfo}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(method.accountInfo); }}
                              className="w-8 h-8 rounded-lg bg-charcoal-50 dark:bg-charcoal-700 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-600 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-charcoal-600 dark:text-charcoal-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!selectedMethod}
                  onClick={() => setStep("confirm")}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  I've Made the Payment
                </button>
              </div>
            )}

            {/* STEP: CONFIRM / TRANSACTION DETAILS */}
            {step === "confirm" && selectedMethod && (
              <div>
                <button onClick={() => setStep("payment")} className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white mb-4">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-6">
                  <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-1">Confirm Your Payment</h2>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-5">
                    Paid <span className="font-semibold">{selectedBook.currency} {selectedBook.price.toLocaleString()}</span> for <span className="font-semibold">{selectedBook.title}</span> via {selectedMethod.name}. Enter your transaction details for verification.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Transaction / Reference Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TB1234567890"
                        className="w-full px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Transaction ID <span className="text-charcoal-400 font-normal">(optional)</span>
                      </label>
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Additional transaction ID if any"
                        className="w-full px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Upload Receipt <span className="text-charcoal-400 font-normal">(recommended)</span>
                      </label>
                      {receiptUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-600">
                          <img src={mediaUrl(receiptUrl)} alt="Receipt" className="w-full max-h-48 object-contain bg-charcoal-50 dark:bg-charcoal-700" />
                          <button
                            onClick={() => setReceiptUrl("")}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                          >
                            <XCircle className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-charcoal-200 dark:border-charcoal-600 cursor-pointer hover:border-accent transition-colors">
                          {uploading ? (
                            <Loader2 className="w-6 h-6 text-accent animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-charcoal-400" />
                              <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Tap to upload receipt screenshot</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={submitting}
                    onClick={handleSubmitPayment}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit for Verification
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === "done" && (
              <div className="max-w-md mx-auto text-center py-10">
                <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Payment Submitted!</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400 mb-6">
                  Your payment for <span className="font-semibold">{selectedBook.title}</span> is now <span className="font-semibold text-amber-500">pending review</span>. Our admins will verify your transaction and unlock the book shortly. You'll be notified once approved.
                </p>
                <button onClick={resetFlow} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Back to Books
                </button>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  // === Library view ===
  return (
    <>
      <DashboardSidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-24 lg:pb-8 px-4 lg:px-8 max-w-5xl mx-auto">
        <div className="py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-accent" />
              Books Library
            </h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 mt-1">Read Islamic books on marriage, relationships, and spirituality</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setTab("library")}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tab === "library" ? "bg-accent text-white shadow-md" : "bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-200 dark:hover:bg-charcoal-700"
              )}
            >
              <Library className="w-4 h-4" /> Library ({books.length})
            </button>
            <button onClick={() => setTab("my-books")}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tab === "my-books" ? "bg-accent text-white shadow-md" : "bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-200 dark:hover:bg-charcoal-700"
              )}
            >
              <BookOpen className="w-4 h-4" /> My Books ({myBooks.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
              <p className="text-charcoal-400 dark:text-charcoal-500">
                {tab === "library" ? "No books available yet" : "You haven't unlocked any books yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div key={book.id} className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-charcoal-800 overflow-hidden transition-all duration-300 hover:shadow-lg">
                  {/* Cover */}
                  <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-charcoal-800 flex items-center justify-center relative">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-10 h-10 text-amber-400" />
                    )}
                    {book.isPurchased && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-charcoal-900 dark:text-white text-sm leading-tight mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-2">by {book.author}</p>
                    {book.description && <p className="text-xs text-charcoal-400 dark:text-charcoal-500 line-clamp-2 mb-3">{book.description}</p>}

                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                        book.price === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {book.price === 0 ? "Free" : `${book.price} ${book.currency}`}
                      </span>
                      {book.category && <span className="text-xs text-charcoal-400 dark:text-charcoal-500">{book.category}</span>}
                      <span className="text-xs text-charcoal-400 dark:text-charcoal-500 uppercase ml-auto">{book.fileType}</span>
                    </div>

                    {/* Action */}
                    {tab === "library" ? (
                      book.isPurchased ? (
                        <button onClick={() => handleDownload(book)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                      ) : book.isPending ? (
                        <button disabled
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm font-medium cursor-not-allowed"
                        >
                          <Clock className="w-4 h-4" /> Pending Review
                        </button>
                      ) : book.price === 0 ? (
                        <button onClick={() => handlePurchase(book)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <CheckCircle className="w-4 h-4" /> Unlock Free
                        </button>
                      ) : (
                        <button onClick={() => handlePurchase(book)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <Lock className="w-4 h-4" /> Unlock for {book.price} {book.currency}
                        </button>
                      )
                    ) : (
                      <button onClick={() => handleDownload(book)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
