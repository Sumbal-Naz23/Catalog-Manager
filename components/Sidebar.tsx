"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Folder } from "@/hooks/useFolders";

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (id: string) => void;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  loading,
  isOpen,
  onClose,
}: SidebarProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) newFolderRef.current?.focus();
  }, [isCreating]);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setCreatingLoading(true);
    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await onRenameFolder(id, renameValue.trim());
    } finally {
      setRenamingId(null);
      setRenameValue("");
    }
  };

  const startRename = (folder: Folder) => {
    setRenamingId(folder._id);
    setRenameValue(folder.name);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-black z-30 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Link href="/" className="group">
            <span className="font-script text-xl text-white group-hover:text-[#D4AF37] transition-colors duration-200">
              D.K Collection
            </span>
            <p className="text-[#D4AF37] text-[9px] tracking-[0.25em] uppercase font-medium mt-0.5">
              Luxury Catalog
            </p>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Gold divider */}
        <div className="divider-gold mx-6" />

        {/* Folders section */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {/* Section label + add button */}
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-[10px] font-medium text-white tracking-[0.25em] uppercase">
              Collections
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="w-6 h-6 border border-white/20 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] flex items-center justify-center transition-all duration-200 cursor-pointer"
              aria-label="New folder"
              title="New collection"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* New folder input */}
          {isCreating && (
            <div className="mb-3 px-1">
              <div className="flex items-center gap-2 border border-[#D4AF37]/50 bg-white/5 px-3 py-2.5">
                <svg className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <input
                  ref={newFolderRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setIsCreating(false); setNewFolderName(""); }
                  }}
                  placeholder="Collection name..."
                  className="flex-1 bg-transparent text-sm text-white outline-none font-light"
                />
                <button
                  onClick={handleCreate}
                  disabled={creatingLoading || !newFolderName.trim()}
                  className="text-[#D4AF37] hover:text-white disabled:opacity-30 transition-colors"
                >
                  {creatingLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Folder list */}
          {loading ? (
            <div className="space-y-2 px-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 skeleton rounded-none opacity-20" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-10 h-10 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-white text-xs font-light tracking-wide">No collections yet</p>
              <p className="text-white text-xs mt-1">Click + to create one</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {folders.map((folder) => (
                <li key={folder._id}>
                  {renamingId === folder._id ? (
                    <div className="flex items-center gap-2 border border-[#D4AF37]/50 bg-white/5 px-3 py-2.5 mx-1">
                      <svg className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <input
                        ref={renameRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(folder._id);
                          if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                        }}
                        className="flex-1 bg-transparent text-sm text-white outline-none font-light"
                      />
                      <button onClick={() => handleRename(folder._id)} className="text-[#D4AF37]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { onSelectFolder(folder._id); onClose(); }}
                      onContextMenu={(e) => handleContextMenu(e, folder._id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 group${
                        selectedFolderId === folder._id
                          ? "sidebar-active bg-white/5 text-white"
                          : "text-white hover:bg-white/5"
                      }`}
             
                    >
                      {/* Gold left bar for active */}
                      {selectedFolderId === folder._id && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#D4AF37]" />
                      )}

                      <svg
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                          selectedFolderId === folder._id ? "text-[#D4AF37]" : "text-white group-hover:text-[#D4AF37]"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>

                      {/* <span className="flex-1 text-sm font-light truncate tracking-wide text-white">
                        {folder.name}
                      </span> */}
                      <span className="flex-1 text-sm font-light truncate tracking-wide text-gray-300 group-hover:text-gray-100">
  {folder.name}
</span>

                      <div
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-[#D4AF37]"
                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e, folder._id); }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </div>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-white text-xs font-light tracking-widest uppercase text-center">
            {folders.length} Collection{folders.length !== 1 ? "s" : ""}
          </p>
        </div>
      </aside>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-black border border-white/10 py-1 w-44 shadow-2xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const folder = folders.find((f) => f._id === contextMenu.id);
              if (folder) startRename(folder);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <div className="border-t border-white/5 my-1" />
          <button
            onClick={() => { onDeleteFolder(contextMenu.id); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </>
  );
}