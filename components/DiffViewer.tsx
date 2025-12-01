import React, { useRef, useEffect } from 'react';
import { DiffEditor, OnMount } from '@monaco-editor/react';
import { Language } from '../types';
import { Upload, Trash2, FileText, Copy, Download } from 'lucide-react';

interface DiffViewerProps {
  language: Language;
  original: string;
  modified: string;
  onOriginalChange: (value: string) => void;
  onModifiedChange: (value: string) => void;
  onOriginalUpload: (content: string, fileName: string) => void;
  onModifiedUpload: (content: string, fileName: string) => void;
  onCopy: (content: string) => void;
  onDownload: (content: string, suffix: string) => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  language,
  original,
  modified,
  onOriginalChange,
  onModifiedChange,
  onOriginalUpload,
  onModifiedUpload,
  onCopy,
  onDownload
}) => {
  const diffEditorRef = useRef<any>(null);
  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const modifiedFileInputRef = useRef<HTMLInputElement>(null);
  const listenersRef = useRef<any[]>([]);

  // Cleanup on unmount to prevent "TextModel got disposed" error
  useEffect(() => {
    return () => {
      // Dispose all listeners
      listenersRef.current.forEach(disposable => disposable.dispose());
      listenersRef.current = [];

      // Detach model to prevent race condition during unmount
      if (diffEditorRef.current) {
        try {
            diffEditorRef.current.setModel(null);
        } catch (e) {
            // Ignore potential errors during disposal
        }
      }
    };
  }, []);

  const handleEditorDidMount: OnMount = (editor) => {
    diffEditorRef.current = editor;
    
    // Listen to changes on the original model (Left side)
    const originalModel = editor.getOriginalEditor().getModel();
    if (originalModel) {
        const d = originalModel.onDidChangeContent(() => {
            onOriginalChange(originalModel.getValue());
        });
        listenersRef.current.push(d);
    }

    // Listen to changes on the modified model (Right side)
    const modifiedModel = editor.getModifiedEditor().getModel();
    if (modifiedModel) {
        const d = modifiedModel.onDidChangeContent(() => {
            onModifiedChange(modifiedModel.getValue());
        });
        listenersRef.current.push(d);
    }
  };

  const handleFileUpload = (
      event: React.ChangeEvent<HTMLInputElement>, 
      callback: (content: string, fileName: string) => void
    ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        callback(content, file.name);
      };
      reader.readAsText(file);
    }
    // Reset inputs
    if (originalFileInputRef.current) originalFileInputRef.current.value = '';
    if (modifiedFileInputRef.current) modifiedFileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        
        {/* Left Control (Original) */}
        <div className="flex items-center gap-4 w-1/2 pr-2">
            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Original
            </h2>
            <div className="flex items-center gap-1 ml-auto">
                <input 
                    type="file" 
                    ref={originalFileInputRef} 
                    onChange={(e) => handleFileUpload(e, onOriginalUpload)} 
                    className="hidden" 
                />
                <button 
                    onClick={() => originalFileInputRef.current?.click()}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                    title="Upload Original File"
                >
                    <Upload size={16} />
                </button>
                <button 
                    onClick={() => onDownload(original, 'original')}
                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                    title="Download Original"
                >
                    <Download size={16} />
                </button>
                <button 
                    onClick={() => onCopy(original)}
                    className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded transition-colors"
                    title="Copy Original"
                >
                    <Copy size={16} />
                </button>
                <button 
                    onClick={() => onOriginalChange('')}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                    title="Clear Original"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        <div className="w-px h-6 bg-gray-700"></div>

        {/* Right Control (Modified) */}
        <div className="flex items-center gap-4 w-1/2 pl-4">
             <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Modified
            </h2>
             <div className="flex items-center gap-1 ml-auto">
                <input 
                    type="file" 
                    ref={modifiedFileInputRef} 
                    onChange={(e) => handleFileUpload(e, onModifiedUpload)} 
                    className="hidden" 
                />
                <button 
                    onClick={() => modifiedFileInputRef.current?.click()}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                    title="Upload Modified File"
                >
                    <Upload size={16} />
                </button>
                <button 
                    onClick={() => onDownload(modified, 'modified')}
                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                    title="Download Modified"
                >
                    <Download size={16} />
                </button>
                <button 
                    onClick={() => onCopy(modified)}
                    className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded transition-colors"
                    title="Copy Modified"
                >
                    <Copy size={16} />
                </button>
                <button 
                    onClick={() => onModifiedChange('')}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                    title="Clear Modified"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Diff Editor */}
      <div className="flex-grow relative h-0 min-h-[400px]">
        <DiffEditor
          height="100%"
          language={language}
          original={original}
          modified={modified}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            originalEditable: true,
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            renderSideBySide: true
          }}
        />
      </div>
      
       <div className="bg-gray-900 px-4 py-1 text-xs text-gray-500 flex justify-between border-t border-gray-700">
        <span>{language} Diff</span>
        <div className="flex gap-4">
            <span>Original: {original.length} chars</span>
            <span>Modified: {modified.length} chars</span>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;