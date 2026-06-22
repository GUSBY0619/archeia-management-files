import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Upload } from "lucide-react";

const CreateFileModal = ({ open, onOpenChange, onCreate, onUpload, currentPath }) => {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setFileName("");
      setSelectedFile(null);
      setIsCreating(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (selectedFile) {
      // Upload file
      setIsCreating(true);
      try {
        await onUpload(selectedFile, currentPath);
        setSelectedFile(null);
      } catch (error) {
        // Error handled in parent
      } finally {
        setIsCreating(false);
      }
      return;
    }

    if (!fileName.trim()) return;

    // Create empty text file
    setIsCreating(true);
    try {
      await onCreate(fileName, "");
      setFileName("");
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    // Clear the text name when a file is selected
    if (file) setFileName("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasInput = fileName.trim() || selectedFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0B14] border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
            <FileText size={20} className="text-indigo-400" />
            Crear o subir archivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* ── Upload file section ── */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Subir archivo desde tu computadora
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Upload size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm text-indigo-300 truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelectedFile();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 ml-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload size={20} className="text-slate-600" />
                  <span className="text-sm text-slate-500">
                    Hacé clic o arrastrá un archivo
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-2">
            <span className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">o crear vacío</span>
            <span className="flex-1 h-px bg-white/5" />
          </div>

          {/* ── Empty file name ── */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Nombre del archivo
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                if (e.target.value.trim()) clearSelectedFile();
              }}
              onKeyDown={handleKeyDown}
              placeholder="ejemplo.txt"
              className="w-full bg-[#05050A] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              autoFocus
              data-testid="create-file-input"
            />
            <p className="text-xs text-slate-600 mt-1">
              Podés incluir carpetas: carpeta/archivo.txt
            </p>
            {currentPath && (
              <p className="text-xs text-slate-600">
                Se creará en: <span className="text-slate-400 font-mono">{currentPath || "raíz"}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-md px-4 py-2 text-sm transition-colors border border-white/5"
              data-testid="cancel-create-file"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!hasInput || isCreating}
              className="bg-indigo-600 hover:bg-purple-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-create-file"
            >
              {isCreating
                ? "Subiendo..."
                : selectedFile
                  ? "Subir archivo"
                  : "Crear"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFileModal;
