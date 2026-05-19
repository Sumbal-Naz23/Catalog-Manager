"use client";

import { useEffect, useRef } from "react";

interface ImageSourceModalProps {
  onFilesSelected: (files: File[]) => void;
  onClose: () => void;
}

export default function ImageSourceModal({ onFilesSelected, onClose }: ImageSourceModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // ── Inject two real <input> elements directly into document.body.
  //    This is the only approach that reliably triggers `capture="environment"`
  //    on Android Chrome and iOS Safari — React-rendered inputs inside a modal
  //    tree can have the attribute stripped or ignored during reconciliation.
  useEffect(() => {
    // Gallery input — multiple files, no capture
    const gallery = document.createElement("input");
    gallery.type = "file";
    gallery.accept = "image/*";
    gallery.multiple = true;
    gallery.id = "__gallery_input__";
    gallery.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

    // Camera input — single file, capture rear camera
    const camera = document.createElement("input");
    camera.type = "file";
    camera.accept = "image/*";
    camera.id = "__camera_input__";
    camera.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
    // setAttribute is required — assigning .capture as a JS property is ignored
    camera.setAttribute("capture", "environment");

    const handleGallery = () => {
      const files = gallery.files ? Array.from(gallery.files) : [];
      if (files.length > 0) onFilesSelected(files);
      gallery.value = "";
    };
    const handleCamera = () => {
      const files = camera.files ? Array.from(camera.files) : [];
      if (files.length > 0) onFilesSelected(files);
      camera.value = "";
    };

    gallery.addEventListener("change", handleGallery);
    camera.addEventListener("change", handleCamera);

    document.body.appendChild(gallery);
    document.body.appendChild(camera);

    return () => {
      gallery.removeEventListener("change", handleGallery);
      camera.removeEventListener("change", handleCamera);
      gallery.remove();
      camera.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount/unmount only — onFilesSelected is stable (useCallback in parent)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const triggerGallery = () => {
    const el = document.getElementById("__gallery_input__") as HTMLInputElement | null;
    if (el) el.click();
    onClose();
  };

  const triggerCamera = () => {
    const el = document.getElementById("__camera_input__") as HTMLInputElement | null;
    if (el) el.click();
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Select image source"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Sheet */}
      <div className="relative w-full sm:w-auto sm:min-w-[340px] sm:max-w-sm animate-slide-up">
        {/* Gold top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="bg-[#0a0a0a] border border-white/10 px-6 pt-6 pb-8 sm:pb-6">
          {/* Handle bar (mobile) */}
          <div className="w-10 h-0.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Select Image</h2>
              <p className="text-[11px] text-white/40 font-light mt-0.5 tracking-wide">
                Choose how to add your image
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all duration-200"
              aria-label="Close"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Gold divider */}
          <div className="divider-gold mb-6" />

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">

            {/* Gallery */}
            <button
              onClick={triggerGallery}
              className="group relative flex flex-col items-center gap-3 p-5 border border-white/10 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all duration-200 active:scale-[0.97]"
            >
              <div className="w-12 h-12 border border-white/15 group-hover:border-[#D4AF37]/50 flex items-center justify-center transition-all duration-200 group-hover:bg-[#D4AF37]/10">
                <svg className="w-6 h-6 text-white/50 group-hover:text-[#D4AF37] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80 group-hover:text-white tracking-wide transition-colors duration-200">Gallery</p>
                <p className="text-[10px] text-white/30 group-hover:text-white/50 font-light mt-0.5 tracking-wide transition-colors duration-200">Photos &amp; folders</p>
              </div>
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[14px] border-l-[14px] border-t-[#D4AF37] border-l-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

            {/* Camera */}
            <button
              onClick={triggerCamera}
              className="group relative flex flex-col items-center gap-3 p-5 border border-white/10 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all duration-200 active:scale-[0.97]"
            >
              <div className="w-12 h-12 border border-white/15 group-hover:border-[#D4AF37]/50 flex items-center justify-center transition-all duration-200 group-hover:bg-[#D4AF37]/10">
                <svg className="w-6 h-6 text-white/50 group-hover:text-[#D4AF37] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80 group-hover:text-white tracking-wide transition-colors duration-200">Camera</p>
                <p className="text-[10px] text-white/30 group-hover:text-white/50 font-light mt-0.5 tracking-wide transition-colors duration-200">Capture now</p>
              </div>
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[14px] border-l-[14px] border-t-[#D4AF37] border-l-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

          </div>

          {/* Permission note */}
          <p className="text-center text-[10px] text-white/20 font-light mt-5 tracking-wide">
            Camera &amp; gallery access may be requested
          </p>
        </div>
      </div>
    </div>
  );
}
