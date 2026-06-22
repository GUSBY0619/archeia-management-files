import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Editor from "./Editor";
import PreviewPanel, { isTextFile } from "./PreviewPanel";
import CreateFileModal from "./CreateFileModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import CreateFolderModal from "./CreateFolderModal";
import RenameModal from "./RenameModal";
import { Search, FilePlus, FolderPlus, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FileManager = () => {
  // ── Directory navigation state ──
  const [currentPath, setCurrentPath] = useState("");
  const [currentContents, setCurrentContents] = useState({
    path: "",
    parent: null,
    directories: [],
    files: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  // ── File selection ──
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [showTextEditor, setShowTextEditor] = useState(false);

  // ── UI state ──
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToRename, setItemToRename] = useState(null);

  // ── Fetch current directory ──
  const fetchDirectory = useCallback(async (path) => {
    try {
      const params = path ? { path } : {};
      const response = await axios.get(`${API}/files`, { params });
      setCurrentContents(response.data);
    } catch (error) {
      console.error("Error fetching directory:", error);
      toast.error("Error al cargar archivos");
    }
  }, []);

  // Initial load: root
  useEffect(() => {
    fetchDirectory("");
  }, [fetchDirectory]);

  // ── Reload current directory (after CRUD) ──
  const reloadCurrentDir = useCallback(() => {
    fetchDirectory(currentPath);
  }, [currentPath, fetchDirectory]);

  // ── Search filter (client-side on current contents) ──
  const filteredContents = React.useMemo(() => {
    if (searchQuery.trim() === "") return currentContents;

    const q = searchQuery.toLowerCase();
    return {
      ...currentContents,
      directories: currentContents.directories.filter((d) =>
        d.name.toLowerCase().includes(q)
      ),
      files: currentContents.files.filter((f) =>
        f.name.toLowerCase().includes(q)
      ),
    };
  }, [searchQuery, currentContents]);

  // ── Navigation ──
  const navigateToFolder = useCallback(
    async (folderPath) => {
      setCurrentPath(folderPath);
      await fetchDirectory(folderPath);
      // Clear file selection when navigating
      setSelectedFile(null);
      setFileContent("");
      setShowTextEditor(false);
    },
    [fetchDirectory]
  );

  const navigateToParent = useCallback(() => {
    if (currentContents.parent !== null) {
      navigateToFolder(currentContents.parent);
    }
  }, [currentContents.parent, navigateToFolder]);

  const navigateToRoot = useCallback(() => {
    setCurrentPath("");
    fetchDirectory("");
    setSelectedFile(null);
    setFileContent("");
    setShowTextEditor(false);
  }, [fetchDirectory]);

  // ── Build breadcrumb segments ──
  const breadcrumb = React.useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.replace(/\\/g, "/").split("/").filter(Boolean);
    let acc = "";
    return parts.map((part) => {
      acc = acc ? `${acc}/${part}` : part;
      return { name: part, path: acc };
    });
  }, [currentPath]);

  // ── File selection ──
  const loadFile = useCallback(async (file) => {
    const ext = file.extension?.toLowerCase();

    if (isTextFile(ext)) {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API}/files/${file.path}`);
        setSelectedFile(file);
        setFileContent(response.data.content);
        setShowTextEditor(true);
      } catch (error) {
        console.error("Error loading file:", error);
        toast.error("Error al cargar el archivo");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setSelectedFile(file);
    setShowTextEditor(false);
    setFileContent("");
  }, []);

  // ── Save text file ──
  const saveFile = async (content) => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      await axios.put(`${API}/files/${selectedFile.path}`, { content });
      toast.success("Archivo guardado");
      reloadCurrentDir();
    } catch (error) {
      console.error("Error saving file:", error);
      toast.error("Error al guardar el archivo");
    } finally {
      setIsSaving(false);
    }
  };

  // ── CRUD handlers ──
  const handleCreateFile = async (path, content) => {
    try {
      await axios.post(`${API}/files`, { path, content });
      toast.success("Archivo creado");
      reloadCurrentDir();
      setCreateFileOpen(false);
    } catch (error) {
      console.error("Error creating file:", error);
      toast.error(error.response?.data?.detail || "Error al crear el archivo");
      throw error;
    }
  };

  const handleCreateFolder = async (path) => {
    try {
      await axios.post(`${API}/folders`, { path });
      toast.success("Carpeta creada");
      reloadCurrentDir();
      setCreateFolderOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(error.response?.data?.detail || "Error al crear la carpeta");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API}/files/${itemToDelete.path}`);
      toast.success(
        itemToDelete.type === "folder" ? "Carpeta eliminada" : "Archivo eliminado"
      );
      if (selectedFile && selectedFile.path === itemToDelete.path) {
        setSelectedFile(null);
        setFileContent("");
      }
      reloadCurrentDir();
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleRename = async (newName) => {
    if (!itemToRename) return;
    try {
      const response = await axios.put(`${API}/files/rename`, {
        old_path: itemToRename.path,
        new_name: newName,
      });
      toast.success("Renombrado exitosamente");
      if (selectedFile && selectedFile.path === itemToRename.path) {
        setSelectedFile(response.data);
      }
      reloadCurrentDir();
      setRenameModalOpen(false);
      setItemToRename(null);
    } catch (error) {
      console.error("Error renaming:", error);
      toast.error(error.response?.data?.detail || "Error al renombrar");
      throw error;
    }
  };

  const openDeleteConfirm = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const openRenameModal = (item) => {
    setItemToRename(item);
    setRenameModalOpen(true);
  };

  // ── Back button for text editor ──
  const handleBackToPreview = () => {
    setShowTextEditor(false);
  };

  // ── Render main panel ──
  const renderMainPanel = () => {
    if (!selectedFile) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-600">
          <div className="text-center">
            <p className="text-lg">Seleccioná un archivo</p>
            <p className="text-sm mt-1">PDF, imágenes, documentos y más</p>
          </div>
        </div>
      );
    }

    if (showTextEditor) {
      return (
        <>
          <div className="h-10 border-b border-white/5 flex items-center px-3 gap-2 shrink-0 bg-[#0A0B14]">
            <button
              onClick={handleBackToPreview}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Vista previa
            </button>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-xs text-slate-500 font-mono">
              {selectedFile.path}
            </span>
          </div>
          <Editor
            file={selectedFile}
            content={fileContent}
            onContentChange={setFileContent}
            onSave={saveFile}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        </>
      );
    }

    return (
      <PreviewPanel
        file={selectedFile}
        onLoadText={() => loadFile(selectedFile)}
      />
    );
  };

  // ── Breadcrumb component ──
  const renderBreadcrumb = () => (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 min-h-0 shrink-0 overflow-x-auto">
      <button
        onClick={navigateToRoot}
        className={`flex items-center gap-1 text-xs transition-colors shrink-0 ${
          !currentPath
            ? "text-indigo-400 font-medium"
            : "text-slate-500 hover:text-slate-300"
        }`}
        title="Raíz"
      >
        <Home size={14} />
      </button>
      {breadcrumb.map((seg, i) => (
        <React.Fragment key={seg.path}>
          <span className="text-slate-700 text-xs">/</span>
          <button
            onClick={() => navigateToFolder(seg.path)}
            className={`text-xs transition-colors whitespace-nowrap ${
              i === breadcrumb.length - 1
                ? "text-indigo-400 font-medium"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {seg.name}
          </button>
        </React.Fragment>
      ))}
      {/* Go up button */}
      {currentContents.parent !== null && (
        <button
          onClick={navigateToParent}
          className="ml-2 text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0"
          title="Subir"
        >
          ↑
        </button>
      )}
    </div>
  );

  return (
    <div
      className="h-screen flex overflow-hidden bg-[#05050A]"
      data-testid="file-manager"
    >
      {/* ── Sidebar ── */}
      <div className="w-64 border-r border-white/5 flex flex-col bg-[#0A0B14] h-full">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
          <h1 className="text-lg font-semibold text-white">Archivos</h1>
          <div className="flex gap-1">
            <button
              onClick={() => setCreateFileOpen(true)}
              className="hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 rounded-md p-1.5 transition-colors"
              title="Nuevo archivo"
            >
              <FilePlus size={18} />
            </button>
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 rounded-md p-1.5 transition-colors"
              title="Nueva carpeta"
            >
              <FolderPlus size={18} />
            </button>
          </div>
        </div>

        {/* Breadcrumb / Current location */}
        {renderBreadcrumb()}

        {/* Search */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#05050A] border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Directory listing */}
        <Sidebar
          directories={filteredContents.directories}
          files={filteredContents.files}
          currentPath={currentPath}
          parentPath={currentContents.parent}
          selectedFile={selectedFile}
          onSelectFile={loadFile}
          onNavigate={navigateToFolder}
          onNavigateUp={navigateToParent}
          onDelete={openDeleteConfirm}
          onRename={openRenameModal}
        />
      </div>

      {/* ── Main panel ── */}
      {renderMainPanel()}

      {/* ── Modals ── */}
      <CreateFileModal
        open={createFileOpen}
        onOpenChange={setCreateFileOpen}
        onCreate={handleCreateFile}
      />
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={handleCreateFolder}
      />
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        item={itemToDelete}
      />
      <RenameModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        onRename={handleRename}
        item={itemToRename}
      />
    </div>
  );
};

export default FileManager;
