import React, { useRef, useEffect, useState, useMemo } from 'react';
import { DiffEditor, OnMount } from '@monaco-editor/react';
import { Language } from '../types';
import { Upload, Trash2, FileText, Copy, Download } from 'lucide-react';
import CodeEditor from './CodeEditor';

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
  
  // Detect mobile width to toggle side-by-side vs inline view
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount or when switching views
  useEffect(() => {
    return () => {
      // Dispose all listeners
      listenersRef.current.forEach(disposable => disposable.dispose());
      listenersRef.current = [];
      diffEditorRef.current = null;
    };
  }, [isMobile]); // Re-run cleanup if switching between mobile/desktop layouts

  // Memoize options to prevent unnecessary re-renders/re-initializations
  const editorOptions = useMemo(() => ({
    originalEditable: true,
    fontSize: 14,
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
    renderSideBySide: true
  }), []);

  // Sync Props to Model safely (Fix for Reverse Writing / Cursor Jump)
  // We only update if the model exists, isn't disposed, and the value actually differs.
  useEffect(() => {
    if (diffEditorRef.current && !isMobile) {
        try {
            const editor = diffEditorRef.current;
            const originalEditor = editor.getOriginalEditor();
            const modifiedEditor = editor.getModifiedEditor();
            
            if (originalEditor) {
                const model = originalEditor.getModel();
                if (model && !model.isDisposed() && model.getValue() !== original) {
                    model.setValue(original);
                }
            }
            
            if (modifiedEditor) {
                const model = modifiedEditor.getModel();
                if (model && !model.isDisposed() && model.getValue() !== modified) {
                    model.setValue(modified);
                }
            }
        } catch (e) {
            // Ignore errors during disposal
            console.warn("Safe sync skipped", e);
        }
    }
  }, [original, modified, isMobile]);


  const handleEditorDidMount: OnMount = (editor) => {
    diffEditorRef.current = editor;
    
    // Listen to changes on the original model (Left side)
    const originalEditor = editor.getOriginalEditor();
    const originalModel = originalEditor.getModel();
    
    if (originalModel) {
        // Init value if needed
        if (!originalModel.isDisposed() && originalModel.getValue() !== original) {
            originalModel.setValue(original);
        }

        const d = originalModel.onDidChangeContent(() => {
            if (originalModel.isDisposed()) return;
            const val = originalModel.getValue();
            if (val !== original) {
                onOriginalChange(val);
            }
        });
        listenersRef.current.push(d);
    }

    // Listen to changes on the modified model (Right side)
    const modifiedEditor = editor.getModifiedEditor();
    const modifiedModel = modifiedEditor.getModel();
    
    if (modifiedModel) {
        if (!modifiedModel.isDisposed() && modifiedModel.getValue() !== modified) {
            modifiedModel.setValue(modified);
        }

        const d = modifiedModel.onDidChangeContent(() => {
            if (modifiedModel.isDisposed()) return;
            const val = modifiedModel.getValue();
            if (val !== modified) {
                onModifiedChange(val);
            }
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
    if (originalFileInputRef.current) originalFileInputRef.current.value = '';
    if (modifiedFileInputRef.current) modifiedFileInputRef.current.value = '';
  };

  // Mobile View: Render two stacked standard CodeEditors
  if (isMobile) {
      return (
          <div className="flex flex-col gap-4 h-full w-full">
               <div className="flex-1 min-h-[350px]">
                    <CodeEditor 
                        title="Original (Source)"
                        language={language}
                        value={original}
                        onChange={(val) => onOriginalChange(val || '')}
                        onClear={() => onOriginalChange('')}
                        onCopy={() => onCopy(original)}
                        onDownload={() => onDownload(original, 'original')}
                        onUpload={onOriginalUpload}
                    />
               </div>
               <div className="flex-1 min-h-[350px]">
                    <CodeEditor 
                        title="Modified (Target)"
                        language={language}
                        value={modified}
                        onChange={(val) => onModifiedChange(val || '')}
                        onClear={() => onModifiedChange('')}
                        onCopy={() => onCopy(modified)}
                        onDownload={() => onDownload(modified, 'modified')}
                        onUpload={onModifiedUpload}
                    />
               </div>
          </div>
      );
  }

  // Desktop View: Render Side-by-Side DiffEditor
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl w-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between bg-gray-900 border-b border-gray-700">
        
        {/* Left Control (Original) */}
        <div className="flex items-center justify-between px-4 py-2 w-1/2 border-r border-gray-700">
            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> <span className="hidden sm:inline">Original</span>
            </h2>
            <div className="flex items-center gap-1">
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

        {/* Right Control (Modified) */}
        <div className="flex items-center justify-between px-4 py-2 w-1/2">
             <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> <span className="hidden sm:inline">Modified</span>
            </h2>
             <div className="flex items-center gap-1">
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
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={editorOptions}
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
