"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Upload, CheckCircle, Clock, AlertCircle, Camera, FileText, X, RefreshCw } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge } from "@/components/common";
import { verificationService } from "@/services/verification";
import { toast } from "sonner";

export default function VerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<any>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const idFileRef = useRef<File | null>(null);
  const selfieFileRef = useRef<File | null>(null);

  const setBothIdFile = (f: File | null) => { idFileRef.current = f; setIdFile(f); };
  const setBothSelfieFile = (f: File | null) => { selfieFileRef.current = f; setSelfieFile(f); };

  const fetchStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await verificationService.getStatus();
      setVerification(data.verification);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setVerification(null);
      } else {
        setError(err?.response?.data?.error || "Failed to load verification status");
        setVerification(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const vStatus = verification?.status || null;
  const isPending = vStatus === "pending";
  const isApproved = vStatus === "approved";
  const isRejected = vStatus === "rejected";

  const clearFiles = () => {
    stopCamera();
    if (idPreview) URL.revokeObjectURL(idPreview);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setBothIdFile(null);
    setBothSelfieFile(null);
    setIdPreview(null);
    setSelfiePreview(null);
  };

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      setShowCamera(false);
      const msg = err?.message || "";
      if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
        toast.error("Camera permission denied. Select a file instead.");
      }
      fallbackFilePicker();
    }
  };

  const fallbackFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) { setBothSelfieFile(f); setSelfiePreview(URL.createObjectURL(f)); }
    };
    input.click();
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setBothSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      stopCamera();
    }, "image/jpeg", 0.8);
  };

  const handleSubmit = async () => {
    const id = idFileRef.current;
    const selfie = selfieFileRef.current;
    if (!id || !selfie) return toast.error("Please select both ID and selfie photos");
    setSubmitting(true);
    setError("");
    const formData = new FormData();
    formData.append("idPhoto", id);
    formData.append("selfiePhoto", selfie);
    try {
      await verificationService.submitVerification(formData);
      toast.success("Verification submitted for review");
      clearFiles();
      await fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit");
      setError(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-8 animate-pulse">
              <div className="h-6 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg w-1/3 mb-4" />
              <div className="h-32 bg-charcoal-100 dark:bg-charcoal-700 rounded-xl mb-3" />
              <div className="h-32 bg-charcoal-100 dark:bg-charcoal-700 rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-green-200 dark:border-green-500/20 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">You're Verified!</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">Your identity has been approved by the admin team.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const showUploadForm = !verification || isRejected;

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Verification</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
                {showUploadForm ? "Upload your ID and selfie for admin review" : "Your verification status"}
              </p>
            </div>
          </div>

          {/* Status banners */}
          {isPending && (
            <div className="mb-6 p-4 rounded-2xl border bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Review</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Your documents are being reviewed by the admin team.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Verification Rejected</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  {verification?.adminNote || "Please re-upload your documents with clear photos."}
                </p>
              </div>
            </div>
          )}

          {error && !isPending && !isRejected && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {showUploadForm && (
            <>
              <div className="space-y-4">
                {/* National ID */}
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-charcoal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal-900 dark:text-white">National ID</p>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {idFile ? idFile.name : "Upload a clear photo of your government-issued ID"}
                      </p>
                    </div>
                    {idFile && <Badge variant="success" size="sm">Selected</Badge>}
                    {verification?.idDocumentPath && !idFile && (
                      <Badge variant="default" size="sm">Uploaded</Badge>
                    )}
                  </div>
                  {idPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-600 mb-2">
                      <img src={idPreview} alt="ID preview" className="w-full h-44 object-contain bg-charcoal-50 dark:bg-charcoal-900" />
                      <button onClick={() => { setIdFile(null); setIdPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-28 rounded-xl border-2 border-dashed border-charcoal-300 dark:border-charcoal-600 flex flex-col items-center justify-center gap-1.5 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer">
                      <input ref={idInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBothIdFile(f); setIdPreview(URL.createObjectURL(f)); } }} />
                      <Upload className="w-6 h-6 text-charcoal-400" />
                      <span className="text-sm font-medium text-charcoal-500">Tap to upload ID photo</span>
                      <span className="text-xs text-charcoal-400">JPEG, PNG or WebP (max 5MB)</span>
                    </label>
                  )}
                </div>

                {/* Selfie */}
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-charcoal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal-900 dark:text-white">Selfie with ID</p>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {selfieFile ? selfieFile.name : "Take a clear selfie holding your ID next to your face"}
                      </p>
                    </div>
                    {selfieFile && <Badge variant="success" size="sm">Selected</Badge>}
                    {verification?.selfiePath && !selfieFile && (
                      <Badge variant="default" size="sm">Uploaded</Badge>
                    )}
                  </div>
                  {selfiePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-600 mb-2">
                      <img src={selfiePreview} alt="Selfie preview" className="w-full h-44 object-contain bg-charcoal-50 dark:bg-charcoal-900" />
                      <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-28 rounded-xl border-2 border-dashed border-charcoal-300 dark:border-charcoal-600 flex flex-col items-center justify-center gap-1.5 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer" onClick={(e) => { e.preventDefault(); openCamera(); }}>
                      <Camera className="w-6 h-6 text-charcoal-400" />
                      <span className="text-sm font-medium text-charcoal-500">Open camera</span>
                      <span className="text-xs text-charcoal-400">Take a selfie photo</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit */}
              {idFile && selfieFile && (
                <div className="mt-6 space-y-3">
                  <Button variant="primary" className="w-full" size="lg" onClick={handleSubmit} loading={submitting}>
                    <Shield className="w-4 h-4 mr-2" /> Submit for Review
                  </Button>
                  <button onClick={clearFiles} className="w-full text-sm text-charcoal-400 hover:text-charcoal-600 text-center">
                    Clear selected files
                  </button>
                </div>
              )}

              {/* Info */}
              {!verification && (
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white">Why Get Verified?</h4>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1 leading-relaxed">
                        Verified profiles receive a badge, appear higher in search results, and get more match requests.
                        Your documents are encrypted and only visible to the admin team.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isPending && (
            <div className="mt-4">
              <button onClick={fetchStatus} className="flex items-center gap-2 text-sm text-accent hover:text-accent-dark mx-auto">
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-md max-h-[70vh] object-cover rounded-2xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4 mt-6">
            <button onClick={captureSelfie} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-full border-2 border-charcoal-600 flex items-center justify-center">
                <Camera className="w-6 h-6 text-charcoal-800" />
              </div>
            </button>
            <button onClick={stopCamera} className="px-6 py-3 rounded-full bg-red-500/80 text-white text-sm font-medium hover:bg-red-600 transition-colors">
              Cancel
            </button>
          </div>
          <p className="text-white/60 text-xs mt-4">Tap the circle to capture</p>
        </div>
      )}
    </div>
  );
}
