import React, { useEffect, useRef, useState } from "react";
import { Save, FileText, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const Editor = ({
  file,
  content,
  onContentChange,
  onSave,
  isLoading,
  isSaving,
}) => {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState("");
  const debouncedContent = useDebounce(localContent, 1000);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Auto-save on debounced content change
  useEffect(() => {
    if (file && debouncedContent !== content && debouncedContent !== "") {
      onSave(debouncedContent);
    }
  }, [debouncedContent]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange(newContent);
  };

  const handleManualSave = () => {
    if (file && localContent !== content) {
      onSave(localContent);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05050A]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05050A] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1758551051834-61f10a361b73)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)",
            WebkitMaskImage:
              "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="text-center z-10" data-testid="empty-state">
          <FileText size={64} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 text-lg">
            Selecciona un archivo para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#05050A]"
      data-testid="editor"
    >
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-white">{file.name}</h2>
          {file.modified && (
            <span className="text-xs text-slate-600">
              Modificado: {formatDate(file.modified)}
            </span>
          )}
        </div>
        <button
          onClick={handleManualSave}
          disabled={isSaving || localContent === content}
          className="bg-indigo-600 hover:bg-purple-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="save-button"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar
            </>
          )}
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-8 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleContentChange}
          className="w-full h-full bg-transparent resize-none outline-none text-slate-300 text-sm leading-relaxed placeholder:text-slate-700"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          placeholder="Comienza a escribir..."
          data-testid="editor-textarea"
        />
      </div>

      {isSaving && (
        <div className="absolute bottom-4 right-4 bg-[#0A0B14] border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300 flex items-center gap-2 shadow-lg">
          <Loader2 size={14} className="animate-spin text-indigo-500" />
          Guardando...
        </div>
      )}
    </div>
  );
};

export default Editor;
