"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { CatalogImage } from "@/hooks/useImages";

interface ImageGridProps {
  images: CatalogImage[];
  loading: boolean;
  uploading: boolean;
  onUpload: (files: File[], productName?: string, productPrice?: number | null) => Promise<void>;
  onDelete: (id: string) => void;
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

interface UploadModalProps {
  files: File[];
  onConfirm: (productName: string, productPrice: number | null) => void;
  onCancel: () => void;
}

function UploadModal({ files, onConfirm, onCancel }: UploadModalProps) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = productPrice.trim() ? parseFloat(productPrice) : null;
    onConfirm(productName.trim(), price);
  };

  const previews = files.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in-scale">
      <div
        className="bg-white w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-black tracking-wide">Upload Images</h2>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-400 transition-all duration-200"
            aria-label="Cancel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image previews */}
        <div className="px-6 pt-5">
          <div className="flex gap-2">
            {previews.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={i} className="relative w-16 h-16 bg-gray-100 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                </div>
              );
            })}
            {files.length > 4 && (
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-500 font-medium">+{files.length - 4}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gold divider */}
        <div className="divider-gold mx-6 mt-5" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">
              Product Name <span className="text-gray-300 font-light normal-case tracking-normal">(optional)</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Silk Evening Gown"
              className="w-full border border-gray-200 px-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 tracking-[0.15em] uppercase mb-2">
              Product Price <span className="text-gray-300 font-light normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-light">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 pl-8 pr-4 py-2.5 text-sm text-black placeholder-gray-300 outline-none focus:border-[#D4AF37] transition-colors duration-200 font-light"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-xs font-medium tracking-[0.1em] uppercase text-gray-500 hover:border-gray-400 hover:text-black transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-black text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carousel Lightbox ───────────────────────────────────────────────────────

interface LightboxProps {
  images: CatalogImage[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const current = images[currentIndex];

  const navigate = useCallback(
    (dir: "prev" | "next") => {
      if (animating || images.length <= 1) return;
      setDirection(dir === "next" ? "left" : "right");
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) =>
          dir === "next" ? (i + 1) % images.length : (i - 1 + images.length) % images.length
        );
        setDirection(null);
        setAnimating(false);
      }, 280);
    },
    [animating, images.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") navigate("next");
      if (e.key === "ArrowLeft") navigate("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, onClose]);

  // Touch / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      navigate(dx < 0 ? "next" : "prev");
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slideClass = animating
    ? direction === "left"
      ? "translate-x-[-6%] opacity-0"
      : "translate-x-[6%] opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center animate-fade-in"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/60 transition-all duration-200 z-10"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-[0.2em] font-light z-10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Gold corner accents */}
      <div className="absolute top-5 left-5 w-8 h-8 border-t border-l border-[#D4AF37]/40 pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-8 h-8 border-b border-r border-[#D4AF37]/40 pointer-events-none" />

      {/* Prev button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate("prev"); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all duration-200 z-10"
          aria-label="Previous image"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate("next"); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all duration-200 z-10"
          aria-label="Next image"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Main image */}
      <div
        className="relative w-full h-full flex items-center justify-center px-16 py-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative max-w-4xl max-h-full w-full h-full transition-all duration-[280ms] ease-in-out ${slideClass}`}
        >
          <Image
            src={current.url}
            alt={current.productName || "Catalog item"}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </div>
      </div>

      {/* Product info bar */}
      {(current.productName || current.productPrice != null) && (
        <div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/70 border border-white/10 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {current.productName && (
            <span className="text-white text-sm font-light tracking-wide">{current.productName}</span>
          )}
          {current.productName && current.productPrice != null && (
            <span className="w-px h-4 bg-white/20" />
          )}
          {current.productPrice != null && (
            <span className="text-[#D4AF37] text-sm font-medium tracking-wide">
              ${current.productPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img._id}
              onClick={() => {
                if (i === currentIndex || animating) return;
                setDirection(i > currentIndex ? "left" : "right");
                setAnimating(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setDirection(null);
                  setAnimating(false);
                }, 280);
              }}
              className={`relative w-10 h-10 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                i === currentIndex
                  ? "ring-1 ring-[#D4AF37] opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              aria-label={`Go to image ${i + 1}`}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="40px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ImageGrid ──────────────────────────────────────────────────────────

export default function ImageGrid({
  images,
  loading,
  uploading,
  onUpload,
  onDelete,
}: ImageGridProps) {
  const [dragActive, setDragActive] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) setPendingFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setPendingFiles(files);
      e.target.value = "";
    }
  };

  const handleUploadConfirm = async (productName: string, productPrice: number | null) => {
    if (!pendingFiles) return;
    const files = pendingFiles;
    setPendingFiles(null);
    await onUpload(files, productName, productPrice);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="aspect-square skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf8]">
      {/* Upload area */}
      <div className="p-6 pb-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border border-dashed p-10 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? "border-[#D4AF37] bg-[#D4AF37]/5"
              : "border-gray-300 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/3 bg-white"
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 border flex items-center justify-center transition-all duration-300 ${
              dragActive ? "border-[#D4AF37] text-[#D4AF37]" : "border-gray-300 text-gray-400"
            }`}>
              {uploading ? (
                <svg className="w-5 h-5 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 tracking-wide">
                {uploading ? "Uploading your images..." : dragActive ? "Release to upload" : "Drop images here"}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-light">
                {uploading ? "Please wait" : "or click to browse · PNG, JPG, WEBP up to 10MB"}
              </p>
            </div>

            {!uploading && (
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-6 py-2 bg-black text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
              >
                Select Images
              </button>
            )}
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
              className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={img.url}
                alt={img.productName || "Catalog item"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                className="object-cover img-zoom"
              />

              {/* Product info overlay at bottom */}
              {(img.productName || img.productPrice != null) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {img.productName && (
                    <p className="text-white text-[11px] font-medium truncate leading-tight">{img.productName}</p>
                  )}
                  {img.productPrice != null && (
                    <p className="text-[#D4AF37] text-[11px] font-medium leading-tight">
                      ${img.productPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 overlay-fade flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                {/* View icon */}
                <div className="w-8 h-8 border border-white/60 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                {/* Delete icon */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(img._id); }}
                  className="w-8 h-8 border border-red-400/60 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                  aria-label="Delete image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>

              {/* Gold corner accent on hover */}
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-[#D4AF37] border-l-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {pendingFiles && (
        <UploadModal
          files={pendingFiles}
          onConfirm={handleUploadConfirm}
          onCancel={() => setPendingFiles(null)}
        />
      )}

      {/* Carousel lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
