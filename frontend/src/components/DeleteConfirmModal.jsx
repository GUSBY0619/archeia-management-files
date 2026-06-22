import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

const DeleteConfirmModal = ({ open, onOpenChange, onConfirm, item }) => {
  if (!item) return null;

  const isFolder = item.type === "folder";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0A0B14] border border-white/10 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-medium text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-400" />
            Confirmar eliminación
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            ¿Estás seguro de que deseas eliminar{" "}
            {isFolder ? "la carpeta" : "el archivo"}{" "}
            <span className="font-semibold text-white">{item.name}</span>?
            {isFolder && (
              <span className="block mt-2 text-red-400">
                Esta acción eliminará la carpeta y todo su contenido.
              </span>
            )}
            <span className="block mt-2">
              Esta acción no se puede deshacer.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-white/5 hover:bg-white/10 text-white border-white/5"
            data-testid="cancel-delete"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            data-testid="confirm-delete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmModal;
