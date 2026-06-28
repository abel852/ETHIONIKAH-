"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Camera, ZoomIn, X, Loader2, ImageIcon } from "lucide-react";

interface ProfileImageEditorProps {
  isOpen: boolean;
  onSave: (croppedBlob: Blob) => void;
  onCancel: () => void;
  currentImage?: string;
}

export function ProfileImageEditor({ isOpen, onSave, onCancel, currentImage }: ProfileImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentImage) {
      setImageSrc(currentImage);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    }
    if (!isOpen) {
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    }
  }, [isOpen, currentImage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageSrc(url);
      setImageLoading(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setImageLoading(false);
    };
    img.src = url;
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      image,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0,
      croppedAreaPixels.width, croppedAreaPixels.height,
    );
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }, [imageSrc, croppedAreaPixels]);

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await createCroppedBlob();
      if (blob) onSave(blob);
    } catch (err) {
      console.error("ProfileImageEditor crop error:", err);
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, createCroppedBlob, onSave]);

  const handleClose = useCallback(() => {
    if (imageSrc && !currentImage && imageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }
    onCancel();
  }, [imageSrc, currentImage, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-lg font-display font-semibold text-charcoal-900 dark:text-white">
            Profile Photo
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {!imageSrc && !imageLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-24 h-24 rounded-full bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-charcoal-400 dark:text-charcoal-500" />
              </div>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 text-center">
                Select a photo to use as your profile picture
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                <Camera className="w-4 h-4" />
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : imageLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Cropper */}
              <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden bg-charcoal-900 mb-4">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 mb-4">
                <ZoomIn className="w-4 h-4 text-charcoal-500 dark:text-charcoal-400 shrink-0" />
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent h-1.5 rounded-full appearance-none bg-charcoal-200 dark:bg-charcoal-700 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md"
                />
                <span className="text-xs text-charcoal-500 dark:text-charcoal-400 w-8 text-right tabular-nums">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              {/* Hint */}
              <p className="text-xs text-charcoal-400 dark:text-charcoal-500 text-center mb-4">
                Drag to reposition your photo
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-accent hover:bg-accent/5 transition-colors"
                >
                  Change
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-charcoal-700 dark:text-charcoal-300 border border-charcoal-200 dark:border-charcoal-600 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={processing || !croppedAreaPixels}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {processing ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Change photo */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-accent hover:text-accent-dark font-medium underline underline-offset-2"
                >
                  Choose a different photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
