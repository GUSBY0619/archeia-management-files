import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

const RenameModal = ({ open, onOpenChange, onRename, item }) => {
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (item) {
      setNewName(item.name);
    }
  }, [item]);

  const handleRename = async () => {
    if (!newName.trim() || !item) return;

    setIsRenaming(true);
    try {
      await onRename(newName);
      setNewName("");
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0B14] border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
            <Edit size={20} className="text-indigo-400" />
            Renombrar {item.type === "folder" ? "carpeta" : "archivo"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {item.type === "folder" ? "Ingresá el nuevo nombre para la carpeta." : "Ingresá el nuevo nombre para el archivo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Nuevo nombre
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#05050A] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              autoFocus
              data-testid="rename-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-md px-4 py-2 text-sm transition-colors border border-white/5"
              data-testid="cancel-rename"
            >
              Cancelar
            </button>
            <button
              onClick={handleRename}
              disabled={!newName.trim() || newName === item.name || isRenaming}
              className="bg-indigo-600 hover:bg-purple-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-rename"
            >
              {isRenaming ? "Renombrando..." : "Renombrar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenameModal;
