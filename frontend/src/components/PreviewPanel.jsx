import React from "react";
import { FileText, Download, Image, File } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TEXT_EXTENSIONS = new Set([
  "txt", "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h",
  "json", "xml", "yaml", "yml", "toml", "ini", "cfg", "env",
  "md", "mdx", "rst", "csv",
  "html", "css", "scss", "less", "sass",
  "sh", "bash", "zsh", "ps1", "bat",
  "sql", "graphql", "prisma",
  "vue", "svelte", "astro",
  "log", "out", "diff", "patch",
  "gitignore", "dockerfile", "makefile",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);

const PREVIEW_EXTENSIONS = new Set(["pdf"]);

const OFFICE_EXTENSIONS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

export function isTextFile(extension) {
  return extension && TEXT_EXTENSIONS.has(extension.toLowerCase());
}

export function isPreviewable(file) {
  const ext = file.extension?.toLowerCase();
  return (
    TEXT_EXTENSIONS.has(ext) ||
    IMAGE_EXTENSIONS.has(ext) ||
    PREVIEW_EXTENSIONS.has(ext)
  );
}

const PreviewPanel = ({ file, onLoadText }) => {
  const ext = file.extension?.toLowerCase();
  // Encode each path segment so special chars (spaces, backslashes, unicode) work in URLs
  const rawUrl = `${API}/files/${file.path.split("/").map(encodeURIComponent).join("/")}/raw`;

  // Image preview
  if (IMAGE_EXTENSIONS.has(ext)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05050A] p-4 overflow-auto">
        <img
          src={rawUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className="hidden flex-col items-center gap-2 text-slate-500">
          <Image size={48} />
          <p className="text-sm">No se pudo cargar la imagen</p>
          <a
            href={rawUrl}
            download={file.name}
            className="text-indigo-400 hover:text-indigo-300 underline text-sm"
          >
            Descargar
          </a>
        </div>
      </div>
    );
  }

  // PDF preview
  if (PREVIEW_EXTENSIONS.has(ext)) {
    return (
      <div className="flex-1 flex flex-col bg-[#05050A]">
        <div className="flex-1">
          <iframe
            src={rawUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      </div>
    );
  }

  // Office documents (DOCX, XLSX, etc.) — download only
  if (OFFICE_EXTENSIONS.has(ext)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05050A]">
        <div className="flex flex-col items-center gap-4 text-slate-400 max-w-md text-center p-8">
          <FileText size={64} className="text-indigo-500/50" />
          <h3 className="text-lg font-medium text-white">{file.name}</h3>
          <p className="text-sm text-slate-500">
            Vista previa no disponible para documentos de Office.
            Descargalo para abrirlo con tu editor.
          </p>
          <a
            href={rawUrl}
            download={file.name}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm"
          >
            <Download size={16} />
            Descargar {ext?.toUpperCase()}
          </a>
        </div>
      </div>
    );
  }

  // Text files — delegate to the text editor
  if (TEXT_EXTENSIONS.has(ext)) {
    onLoadText?.();
    return null;
  }

  // Fallback: unknown file type → download
  return (
    <div className="flex-1 flex items-center justify-center bg-[#05050A]">
      <div className="flex flex-col items-center gap-4 text-slate-400 max-w-md text-center p-8">
        <File size={64} className="text-slate-600" />
        <h3 className="text-lg font-medium text-white">{file.name}</h3>
        <p className="text-sm text-slate-500">
          Tipo de archivo no soportado para vista previa.
        </p>
        <a
          href={rawUrl}
          download={file.name}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors text-sm"
        >
          <Download size={16} />
          Descargar
        </a>
      </div>
    </div>
  );
};

export default PreviewPanel;
