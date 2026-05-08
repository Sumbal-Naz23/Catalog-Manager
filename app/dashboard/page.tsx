"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ImageGrid from "@/components/ImageGrid";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast, { ToastMessage } from "@/components/Toast";
import { useFolders } from "@/hooks/useFolders";
import { useImages } from "@/hooks/useImages";

export default function DashboardPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const { folders, loading: foldersLoading, createFolder, renameFolder, deleteFolder } = useFolders();
  const { images, loading: imagesLoading, uploading, uploadImages, deleteImage, updateImage } = useImages(selectedFolderId);

  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name);
      addToast("success", `"${name}" collection created`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to create collection");
      throw err;
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      await renameFolder(id, name);
      addToast("success", "Collection renamed");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to rename");
      throw err;
    }
  };

  const handleDeleteFolder = (id: string) => {
    const folder = folders.find((f) => f._id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Collection",
      message: `Delete "${folder?.name}"? All images inside will be permanently removed.`,
      danger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteFolder(id);
          if (selectedFolderId === id) setSelectedFolderId(null);
          addToast("success", "Collection deleted");
        } catch (err) {
          addToast("error", err instanceof Error ? err.message : "Failed to delete");
        }
      },
    });
  };

  const handleUpload = async (files: File[], productName?: string, productPrice?: number | null) => {
    try {
      await uploadImages(files, productName, productPrice);
      addToast("success", `${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleUpdateImage = async (
    id: string,
    updates: { productName?: string; productPrice?: number | null; file?: File }
  ) => {
    try {
      await updateImage(id, updates);
      addToast("success", "Image updated");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to update image");
      throw err;
    }
  };

  const handleDeleteImage = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Image",
      message: "This image will be permanently removed from your collection.",
      danger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteImage(id);
          addToast("success", "Image removed");
        } catch (err) {
          addToast("error", err instanceof Error ? err.message : "Failed to delete");
        }
      },
    });
  };

  const selectedFolder = folders.find((f) => f._id === selectedFolderId);

  return (
    <div className="flex h-screen bg-[#fafaf8] overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        loading={foldersLoading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-black transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>

          {/* Breadcrumb / Title */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:block text-gray-400 hover:text-[#D4AF37] transition-colors text-xs tracking-widest uppercase font-medium"
            >
              D.K Collection
            </Link>
            {selectedFolder && (
              <>
                <span className="hidden sm:block text-white text-xs">/</span>
                <div>
                  <h1 className="text-sm font-semibold text-black tracking-wide truncate">
                    {selectedFolder.name}
                  </h1>
                  <p className="text-xs text-gray-400 font-light">
                    {images.length} item{images.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
            {!selectedFolder && (
              <div>
                <h1 className="text-sm font-semibold text-black tracking-wide">Collections</h1>
                <p className="text-xs text-gray-400 font-light">Select a collection to view</p>
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-gray-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400 font-light tracking-widest uppercase">Live</span>
          </div>
        </header>

        {/* Gold accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent flex-shrink-0" />

        {/* Content area */}
        {!selectedFolderId ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm animate-fade-in">
              {/* Icon */}
              <div className="w-16 h-16 border border-gray-200 flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>

              {/* Gold divider */}
              <div className="divider-gold w-16 mx-auto mb-6" />

              <h2 className="font-display text-xl font-light text-black mb-2 tracking-wide">
                Select a Collection
              </h2>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Choose a collection from the sidebar to view and manage your images, or create a new one to begin.
              </p>

              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-6 lg:hidden px-6 py-2.5 bg-black text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300 cursor-pointer"
              >
                Open Collections
              </button>
            </div>
          </div>
        ) : (
          <ImageGrid
            images={images}
            loading={imagesLoading}
            uploading={uploading}
            onUpload={handleUpload}
            onDelete={handleDeleteImage}
            onUpdate={handleUpdateImage}
          />
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
