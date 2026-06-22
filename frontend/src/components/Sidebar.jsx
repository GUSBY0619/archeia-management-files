import React from "react";
import { File, Folder, MoreVertical, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = ({
  directories,
  files,
  currentPath,
  parentPath,
  selectedFile,
  onSelectFile,
  onNavigate,
  onNavigateUp,
  onDelete,
  onRename,
}) => {
  const isSelected = (item) => selectedFile && selectedFile.path === item.path;

  // ── "Go up" entry ──
  const renderGoUp = () => {
    if (parentPath === null) return null;
    return (
      <div key="__go_up__">
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors text-slate-500 hover:bg-indigo-500/10 hover:text-slate-300"
          onClick={onNavigateUp}
          data-testid="go-up"
        >
          <ArrowUp size={16} className="shrink-0 text-slate-600" />
          <span className="font-medium">..</span>
        </div>
      </div>
    );
  };

  // ── Directory row ──
  const renderDirectory = (dir) => (
    <div key={dir.path}>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${
          isSelected(dir)
            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
            : "text-slate-400 hover:bg-indigo-500/10 hover:text-slate-200"
        }`}
        onClick={() => onNavigate(dir.path)}
        data-testid={`folder-${dir.name}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Folder size={16} className="text-amber-500/70 shrink-0" />
          <span className="truncate font-medium">{dir.name}</span>
        </div>

        <div
          className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-white/5 rounded p-0.5">
              <MoreVertical size={14} className="text-slate-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0F101A] border-white/10 text-white"
            >
              <DropdownMenuItem
                onClick={() => onRename(dir)}
                className="cursor-pointer hover:bg-indigo-500/10 focus:bg-indigo-500/10 focus:text-indigo-400"
              >
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete({ ...dir, type: "folder" })}
                className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 focus:text-red-400"
              >
                Eliminar carpeta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  // ── File row ──
  const renderFile = (file) => (
    <div key={file.path}>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${
          isSelected(file)
            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
            : "text-slate-400 hover:bg-indigo-500/10 hover:text-slate-200"
        }`}
        onClick={() => onSelectFile(file)}
        data-testid={`file-item-${file.name}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <File size={16} className="text-indigo-500/70 shrink-0" />
          <span className="truncate font-medium">{file.name}</span>
        </div>

        <div
          className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-white/5 rounded p-0.5">
              <MoreVertical size={14} className="text-slate-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0F101A] border-white/10 text-white"
            >
              <DropdownMenuItem
                onClick={() => onRename(file)}
                className="cursor-pointer hover:bg-indigo-500/10 focus:bg-indigo-500/10 focus:text-indigo-400"
              >
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete({ ...file, type: "file" })}
                className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 focus:text-red-400"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  const hasContent = directories.length > 0 || files.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-2" data-testid="file-tree">
      {!hasContent && parentPath === null ? (
        <div className="text-center text-slate-600 text-sm py-8">
          No hay archivos
        </div>
      ) : (
        <div className="space-y-0.5">
          {renderGoUp()}
          {directories.map(renderDirectory)}
          {files.map(renderFile)}
          {!hasContent && (
            <div className="text-xs text-slate-600 italic pl-4 py-1">
              Carpeta vacía
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
