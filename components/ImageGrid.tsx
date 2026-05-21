"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { CatalogImage, UploadProgress } from "@/hooks/useImages";
import ImageSourceModal from "@/components/ImageSourceModal";

interface ImageGridProps {
  images: CatalogImage[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: UploadProgress[];
  onUpload: (files: File[], productName?: string, productPrice?: number | null) => Promise<void>;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { productName?: string; productPrice?: number | null; file?: File }) => Promise<void>;
}

// ─── Shared price formatter ───────────────────────────────────────────────────
function formatPrice(price: number) {
  return "Rs = " + price.toLocaleString("en-IN");
}

// ─── Upload Modal (with per-file progress) ───────────────────────────────────
interface UploadModalProps {
  files: File[];
  uploading: boolean;
  progress: UploadProgress[];
  onConfirm: (productName: string, productPrice: number | null) => void;
  onCancel: () => void;
}

function UploadModal({ files, uploading, progress, onConfirm, onCancel }: UploadModalProps) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(productName.trim(), productPrice.trim() ? parseFloat(productPrice) : null);
  };

  // Instant object-URL previews — revoked after render
  const previews = files.slice(0, 5).map((f) => ({ file: f, url: URL.createObjectURL(f) }));

  const doneCount = progress.filter((p) => p.status === "done").length;
  const errorCount = progress.filter((p) => p.status === "error").length;
  const isActive = uploading;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in-scale">
      <div className="bg-white w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black tracking-wide">Upload Images</h2>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {isActive
                ? `Uploading ${doneCount} of ${files.length}…`
                : `${files.length} file${files.length !== 1 ? "s" : ""} selected`}
            </p>
          </div>
          {!isActive && (
            <button onClick={onCancel} className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-400 transition-all duration-200" aria-label="Cancel">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Image previews */}
          <div className="px-6 pt-5">
            <div className="flex gap-2 flex-wrap">
              {previews.map(({ file, url }, i) => {
                const prog = progress[i];
                return (
                  <div key={i} className="relative w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                    {/* Status overlay */}
                    {prog && (
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                        prog.status === "uploading" ? "bg-black/40" :
                        prog.status === "done" ? "bg-emerald-500/60" :
                        prog.status === "error" ? "bg-red-500/60" : ""
                      }`}>
                        {prog.status === "uploading" && (
                          <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        )}
                        {prog.status === "done" && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                        {prog.status === "error" && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {files.length > 5 && (
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-500 font-medium">+{files.length - 5}</span>
                </div>
              )}
            </div>

            {/* Per-file error list */}
            {errorCount > 0 && (
              <div className="mt-3 space-y-1">
                {progress.filter((p) => p.status === "error").map((p, i) => (
                  <p key={i} className="text-[11px] text-red-500 font-light">{p.error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="divider-gold mx-6 mt-5" />

          {/* Form — hidden while uploading */}
          {!isActive && (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">
                  Product Name <span className="text-gray-300 font-light normal-case tracking-normal">(optional)</span>
                </label>
                <input ref={nameRef} type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Silk Evening Gown"
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">
                  Product Price <span className="text-gray-300 font-light normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-light">Rs =</span>
                  <input type="number" min="0" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 pl-14 pr-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-200 text-xs font-medium tracking-[0.1em] uppercase text-gray-500 hover:border-gray-400 hover:text-black transition-all duration-200">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-black text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300">
                  Upload {files.length > 1 ? `${files.length} Images` : "Image"}
                </button>
              </div>
            </form>
          )}

          {/* Upload in-progress state */}
          {isActive && (
            <div className="px-6 py-6 flex flex-col items-center gap-3">
              <svg className="w-6 h-6 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-sm text-gray-600 font-light">
                Uploading {doneCount + 1} of {files.length}…
              </p>
              {/* Progress bar */}
              <div className="w-full h-1 bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] transition-all duration-500"
                  style={{ width: `${Math.round((doneCount / files.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
  image: CatalogImage;
  onConfirm: (updates: { productName: string; productPrice: number | null; file?: File }) => Promise<void>;
  onCancel: () => void;
}

function EditModal({ image, onConfirm, onCancel }: EditModalProps) {
  const [productName, setProductName] = useState(image.productName ?? "");
  const [productPrice, setProductPrice] = useState(
    image.productPrice != null ? String(image.productPrice) : ""
  );
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    if (!newFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(newFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewFile(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirm({
        productName: productName.trim(),
        productPrice: productPrice.trim() ? parseFloat(productPrice) : null,
        file: newFile ?? undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in-scale">
      <div className="bg-white w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-black tracking-wide">Edit Image</h2>
            <p className="text-xs text-gray-400 font-light mt-0.5">Update details or replace the image</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-400 transition-all duration-200" aria-label="Cancel">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Image preview + replace */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl ?? image.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-light mb-2">Replace image (optional)</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-200 text-xs font-medium tracking-[0.08em] uppercase text-gray-600 hover:border-[#D4AF37] hover:text-black transition-all duration-200">
                {newFile ? "Change File" : "Choose File"}
              </button>
              {newFile && <p className="text-[10px] text-[#D4AF37] mt-1.5 font-light truncate max-w-[160px]">{newFile.name}</p>}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </div>

        <div className="divider-gold mx-6 mt-5" />

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">Product Name</label>
            <input ref={nameRef} type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Silk Evening Gown"
              className="w-full border border-gray-200 px-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">Product Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-light">Rs =</span>
              <input type="number" min="0" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 pl-14 pr-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 text-xs font-medium tracking-[0.1em] uppercase text-gray-500 hover:border-gray-400 hover:text-black transition-all duration-200 disabled:opacity-40">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-black text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carousel Lightbox with Zoom ─────────────────────────────────────────────
interface LightboxProps {
  images: CatalogImage[];
  initialIndex: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // Pinch-to-zoom
  const lastPinchDist = useRef<number | null>(null);

  const current = images[currentIndex];

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const navigate = useCallback((dir: "prev" | "next") => {
    if (animating || images.length <= 1) return;
    resetZoom();
    setDirection(dir === "next" ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((i) => dir === "next" ? (i + 1) % images.length : (i - 1 + images.length) % images.length);
      setDirection(null);
      setAnimating(false);
    }, 260);
  }, [animating, images.length, resetZoom]);

  const jumpTo = useCallback((i: number) => {
    if (i === currentIndex || animating) return;
    resetZoom();
    setDirection(i > currentIndex ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setDirection(null);
      setAnimating(false);
    }, 260);
  }, [animating, currentIndex, resetZoom]);

  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, MIN_ZOOM);
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && zoom === 1) navigate("next");
      if (e.key === "ArrowLeft" && zoom === 1) navigate("prev");
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, onClose, zoom]);

  // Mouse pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: panStart.current.px + e.clientX - panStart.current.x, y: panStart.current.py + e.clientY - panStart.current.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  // Touch: swipe (zoom=1) or pan (zoom>1) + pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    if (zoom > 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pan.x, py: pan.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist - lastPinchDist.current;
      lastPinchDist.current = dist;
      setZoom((z) => {
        const next = Math.min(Math.max(z + delta * 0.01, MIN_ZOOM), MAX_ZOOM);
        if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
        return next;
      });
      return;
    }
    if (isPanning && zoom > 1) {
      setPan({ x: panStart.current.px + e.touches[0].clientX - panStart.current.x, y: panStart.current.py + e.touches[0].clientY - panStart.current.y });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    lastPinchDist.current = null;
    setIsPanning(false);
    if (zoom > 1) return; // don't swipe when zoomed
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) navigate(dx < 0 ? "next" : "prev");
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slideClass = animating
    ? direction === "left" ? "translate-x-[-5%] opacity-0" : "translate-x-[5%] opacity-0"
    : "translate-x-0 opacity-100";

  const hasProductInfo = current.productName || current.productPrice != null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top bar (compact, always on top) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-5 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        {/* Gold corner accent */}
        <div className="w-5 h-5 border-t border-l border-[#D4AF37]/50 pointer-events-none" />

        {/* Counter */}
        <span className="text-white/50 text-xs tracking-[0.2em] font-light pointer-events-auto">
          {currentIndex + 1} / {images.length}
        </span>

        {/* Right controls — pointer-events re-enabled */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed bg-black/40 backdrop-blur-sm"
            aria-label="Zoom out">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" /></svg>
          </button>
          <span className="text-white/30 text-[10px] tracking-widest w-9 text-center font-light">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed bg-black/40 backdrop-blur-sm"
            aria-label="Zoom in">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
          </button>
          <div className="w-px h-4 bg-white/15 mx-0.5" />
          <button onClick={onClose}
            className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 bg-black/40 backdrop-blur-sm"
            aria-label="Close">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* ── Full-screen image canvas ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Image slide wrapper */}
        <div
          className={`absolute inset-0 transition-all duration-[260ms] ease-in-out ${slideClass}`}
          style={{ cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
          >
            <Image
              src={current.url}
              alt={current.productName || "Catalog item"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* ── Prev / Next buttons (float over image, vertically centred) ── */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => navigate("prev")}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/60 hover:bg-white/10 transition-all duration-200 bg-black/30 backdrop-blur-sm"
            aria-label="Previous image">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button
            onClick={() => navigate("next")}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/60 hover:bg-white/10 transition-all duration-200 bg-black/30 backdrop-blur-sm"
            aria-label="Next image">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </>
      )}

      {/* ── Bottom overlay: product info + thumbnails ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-2 pb-3 pt-8 bg-gradient-to-t from-black/75 to-transparent pointer-events-none">
        {/* Product info pill */}
        {hasProductInfo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-black/50 border border-white/10 backdrop-blur-sm pointer-events-auto">
            {current.productName && (
              <span className="text-white text-sm font-light tracking-wide">{current.productName}</span>
            )}
            {current.productName && current.productPrice != null && (
              <span className="w-px h-3.5 bg-white/20" />
            )}
            {current.productPrice != null && (
              <span className="text-[#D4AF37] text-sm font-medium tracking-wide">{formatPrice(current.productPrice)}</span>
            )}
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-1.5 max-w-[90vw] overflow-x-auto px-2 pointer-events-auto">
            {images.map((img, i) => (
              <button key={img._id} onClick={() => jumpTo(i)}
                className={`relative w-11 h-11 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                  i === currentIndex ? "ring-1 ring-[#D4AF37] opacity-100" : "opacity-40 hover:opacity-70"
                }`}
                aria-label={`Go to image ${i + 1}`}>
                <Image src={img.url} alt="" fill className="object-cover" sizes="44px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ImageGrid ───────────────────────────────────────────────────────────
export default function ImageGrid({ images, loading, uploading, uploadProgress, onUpload, onDelete, onUpdate }: ImageGridProps) {
  const [dragActive, setDragActive] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [editingImage, setEditingImage] = useState<CatalogImage | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  // Long-press context menu
  const [contextMenu, setContextMenu] = useState<{ image: CatalogImage; index: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  // Files come back from ImageSourceModal
  const handleFilesSelected = useCallback((files: File[]) => {
    setPendingFiles(files);
  }, []);

  // Dismiss context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu]);

  // ── Long-press handlers ──
  const startLongPress = (img: CatalogImage, index: number) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setContextMenu({ image: img, index });
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // ── Drag & drop ──
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) setPendingFiles(files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) { setPendingFiles(files); e.target.value = ""; }
  };

  const handleUploadConfirm = async (productName: string, productPrice: number | null) => {
    if (!pendingFiles) return;
    const files = pendingFiles;
    // Don't clear pendingFiles yet — keep modal open to show progress
    await onUpload(files, productName, productPrice);
    // Close modal after upload finishes (success or partial failure)
    setPendingFiles(null);
  };

  const handleEditConfirm = async (updates: { productName: string; productPrice: number | null; file?: File }) => {
    if (!editingImage) return;
    await onUpdate(editingImage._id, updates);
    setEditingImage(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-6">
        {[1,2,3,4,5,6,7,8,9,10].map((i) => (
          <div key={i} className="aspect-square skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf8]">
      {/* Upload area — click opens source picker modal */}
      <div className="p-6 pb-4">
        <div
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          className={`relative border border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
            dragActive ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/3 bg-white"
          }`}
          onClick={() => { if (!uploading) setShowSourceModal(true); }}
        >
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={`w-11 h-11 border flex items-center justify-center transition-all duration-300 ${
              dragActive ? "border-[#D4AF37] text-[#D4AF37]" : "border-gray-300 text-gray-400"
            }`}>
              {uploading ? (
                <svg className="w-5 h-5 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 tracking-wide">
                {uploading ? "Uploading…" : dragActive ? "Release to upload" : "Select Image"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 font-light">
                {uploading ? "Please wait" : "Camera · Gallery · or drag & drop"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image count */}
      {images.length > 0 && (
        <div className="px-6 pb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 font-light tracking-widest uppercase">
            {images.length} item{images.length !== 1 ? "s" : ""}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Image grid */}
      {images.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 border border-gray-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-light tracking-wide">No images in this collection</p>
          <p className="text-gray-300 text-xs mt-1 font-light">Upload your first image above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-6 pb-8">
          {images.map((img, index) => (
            <div
              key={img._id}
              className="group relative bg-white border border-gray-100 overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            >
              {/* Image square */}
              <div
                className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                onClick={() => { if (!longPressTriggered.current) setLightboxIndex(index); }}
                onMouseDown={() => startLongPress(img, index)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(img, index)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ image: img, index }); }}
              >
                <Image
                  src={img.url}
                  alt={img.productName || "Catalog item"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover img-zoom"
                  draggable={false}
                  // Eagerly load the first 6 images — they're above the fold
                  priority={index < 6}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 overlay-fade opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <div className="w-9 h-9 border border-white/70 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                {/* Gold corner accent */}
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[18px] border-l-[18px] border-t-[#D4AF37] border-l-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Product info below image — always visible */}
              <div className="px-2.5 py-2 min-h-[2.5rem] flex flex-col justify-center">
                {img.productName ? (
                  <p className="text-[11px] font-medium text-gray-800 truncate leading-tight">{img.productName}</p>
                ) : (
                  <p className="text-[11px] text-gray-300 font-light italic leading-tight">No name</p>
                )}
                {img.productPrice != null ? (
                  <p className="text-[11px] font-semibold text-[#D4AF37] leading-tight mt-0.5">{formatPrice(img.productPrice)}</p>
                ) : (
                  <p className="text-[11px] text-gray-300 font-light leading-tight mt-0.5">—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Long-press context menu */}
      {contextMenu && (
        <div
          className="fixed z-40 bg-white border border-gray-100 shadow-xl py-1 w-40 animate-fade-in-scale"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium tracking-[0.15em] uppercase truncate">
              {contextMenu.image.productName || "Image"}
            </p>
          </div>
          <button
            onClick={() => { setEditingImage(contextMenu.image); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => { onDelete(contextMenu.image._id); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Upload modal */}
      {pendingFiles && (
        <UploadModal
          files={pendingFiles}
          uploading={uploading}
          progress={uploadProgress}
          onConfirm={handleUploadConfirm}
          onCancel={() => { if (!uploading) setPendingFiles(null); }}
        />
      )}

      {/* Edit modal */}
      {editingImage && (
        <EditModal image={editingImage} onConfirm={handleEditConfirm} onCancel={() => setEditingImage(null)} />
      )}

      {/* Carousel lightbox */}
      {lightboxIndex !== null && (
        <Lightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* Image source picker modal */}
      {showSourceModal && (
        <ImageSourceModal
          onFilesSelected={handleFilesSelected}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  );
}
