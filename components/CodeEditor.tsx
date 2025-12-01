import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { EditorProps } from '../types';
import { Trash2, Copy, Upload, Download, Clipboard } from 'lucide-react';

const CodeEditor: React.FC<EditorProps> = ({ 
  language, 
  value, 
  onChange, 
  title, 
  readOnly,
  onClear,
  onCopy,
  onPaste,
  onUpload,
  onDownload
}) => {
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content, file.name);
      };
      reader.readAsText(file);
    }
    // Reset value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</h2>
        
        <div className="flex items-center space-x-1">
          {onUpload && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                title="Upload File"
              >
                <Upload size={16} />
              </button>
            </>
          )}

          {onDownload && (
            <button 
              onClick={onDownload}
              className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
              title="Download File"
            >
              <Download size={16} />
            </button>
          )}

          {onPaste && (
             <button 
             onClick={onPaste}
             className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
             title="Paste from Clipboard"
           >
             <Clipboard size={16} />
           </button>
          )}

          <button 
            onClick={onCopy}
            className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded transition-colors"
            title="Copy Content"
          >
            <Copy size={16} />
          </button>
          
          <button 
            onClick={onClear}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
            title="Clear Editor"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-grow relative h-0 min-h-[400px]">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            readOnly: readOnly,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          }}
        />
      </div>
      
      {/* Editor Footer Status */}
      <div className="bg-gray-900 px-4 py-1 text-xs text-gray-500 flex justify-between border-t border-gray-700">
        <span>{language}</span>
        <span>{value.length} chars</span>
      </div>
    </div>
  );
};

export default CodeEditor;
