"use client";

import { useState, useCallback, memo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import Toast, { ToastMessage } from "@/components/Toast";
import { useFolders } from "@/hooks/useFolders";
import { useImages } from "@/hooks/useImages";

const SIDEBAR_PREF_KEY = "dk_sidebar_open";

// ── Lazy-load heavy components — they're not needed for first paint ───────────
const ImageGrid = dynamic(() => import("@/components/ImageGrid"), {
  // Show nothing while the chunk loads (it's fast on cache hit)
  loading: () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-square skeleton" />
      ))}
    </div>
  ),
  ssr: false, // ImageGrid uses browser APIs (file inputs, object URLs)
});

const ConfirmDialog = dynamic(() => import("@/components/ConfirmDialog"), {
  ssr: false,
});

// ── Memoised empty-state so it never re-renders ───────────────────────────────
const EmptyState = memo(function EmptyState({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 border border-gray-200 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-7 h-7 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div className="divider-gold w-16 mx-auto mb-6" />
        <h2 className="font-display text-xl font-light text-black mb-2 tracking-wide">
          Select a Collection
        </h2>
        <p className="text-gray-400 text-sm font-light leading-relaxed">
          Choose a collection from the sidebar to view and manage your images,
          or create a new one to begin.
        </p>
        <button
          onClick={onOpen}
          className="mt-6 lg:hidden px-6 py-2.5 bg-black text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
        >
          Open Collections
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Default: open (true). After mount, read the user's saved preference.
  // Initializing to `true` means the sidebar is visible on first paint —
  // no flash, no hydration mismatch (server and client both start as true).
  // If the user previously closed it, we correct to false after mount.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_PREF_KEY);
      // Only override if user explicitly set it to "false"
      if (saved === "false") setSidebarOpen(false);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep default open
    }
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
    try { localStorage.setItem(SIDEBAR_PREF_KEY, "true"); } catch {}
  }, []);

  // Persists "closed" — used by the X button only
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    try { localStorage.setItem(SIDEBAR_PREF_KEY, "false"); } catch {}
  }, []);

  // Selecting a folder — sidebar stays open
  const handleSelectFolder = useCallback((id: string) => {
    setSelectedFolderId(id);
  }, []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const {
    folders,
    loading: foldersLoading,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useFolders();

  const {
    images,
    loading: imagesLoading,
    uploading,
    uploadProgress,
    uploadImages,
    deleteImage,
    updateImage,
  } = useImages(selectedFolderId);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Folder handlers ───────────────────────────────────────────────────────
  const handleCreateFolder = useCallback(
    async (name: string) => {
      try {
        await createFolder(name);
        addToast("success", `"${name}" collection created`);
      } catch (err) {
        addToast("error", err instanceof Error ? err.message : "Failed to create collection");
        throw err;
      }
    },
    [createFolder, addToast]
  );

  const handleRenameFolder = useCallback(
    async (id: string, name: string) => {
      try {
        await renameFolder(id, name);
        addToast("success", "Collection renamed");
      } catch (err) {
        addToast("error", err instanceof Error ? err.message : "Failed to rename");
        throw err;
      }
    },
    [renameFolder, addToast]
  );

  const handleDeleteFolder = useCallback(
    (id: string) => {
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
    },
    [folders, deleteFolder, selectedFolderId, addToast]
  );

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleUpload = useCallback(
    async (files: File[], productName?: string, productPrice?: number | null) => {
      try {
        await uploadImages(files, productName, productPrice);
        addToast("success", `${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      } catch (err) {
        addToast("error", err instanceof Error ? err.message : "Upload failed");
      }
    },
    [uploadImages, addToast]
  );

  const handleUpdateImage = useCallback(
    async (
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
    },
    [updateImage, addToast]
  );

  const handleDeleteImage = useCallback(
    (id: string) => {
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
    },
    [deleteImage, addToast]
  );

  const closeConfirm = useCallback(
    () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
    []
  );

  const selectedFolder = folders.find((f) => f._id === selectedFolderId);

  return (
    <div className="flex h-screen bg-[#fafaf8] overflow-hidden">

      {/* Sidebar — always rendered so folders are visible immediately */}
      <Sidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        loading={foldersLoading}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={openSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-black transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:block text-gray-400 hover:text-[#D4AF37] transition-colors text-xs tracking-widest uppercase font-medium"
            >
              D.K Collection
            </Link>
            {selectedFolder ? (
              <>
                <span className="hidden sm:block text-gray-300 text-xs">/</span>
                <div>
                  <h1 className="text-sm font-semibold text-black tracking-wide truncate">
                    {selectedFolder.name}
                  </h1>
                  <p className="text-xs text-gray-400 font-light">
                    {images.length} item{images.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-sm font-semibold text-black tracking-wide">Collections</h1>
                <p className="text-xs text-gray-400 font-light">Select a collection to view</p>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-gray-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400 font-light tracking-widest uppercase">Live</span>
          </div>
        </header>

        {/* Gold accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent flex-shrink-0" />

        {/* Content */}
        {!selectedFolderId ? (
          <EmptyState onOpen={openSidebar} />
        ) : (
          <ImageGrid
            images={images}
            loading={imagesLoading}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={handleUpload}
            onDelete={handleDeleteImage}
            onUpdate={handleUpdateImage}
          />
        )}
      </div>

      {/* Confirm dialog — lazy loaded, only rendered when open */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel="Delete"
          danger={confirmDialog.danger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
