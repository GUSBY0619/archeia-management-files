import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Folder } from "lucide-react";

const CreateFolderModal = ({ open, onOpenChange, onCreate }) => {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(folderName);
      setFolderName("");
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0B14] border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
            <Folder size={20} className="text-indigo-400" />
            Crear nueva carpeta
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ingresá el nombre para la nueva carpeta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Nombre de la carpeta
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="mi-carpeta"
              className="w-full bg-[#05050A] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              autoFocus
              data-testid="create-folder-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-md px-4 py-2 text-sm transition-colors border border-white/5"
              data-testid="cancel-create-folder"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!folderName.trim() || isCreating}
              className="bg-indigo-600 hover:bg-purple-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-create-folder"
            >
              {isCreating ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderModal;
