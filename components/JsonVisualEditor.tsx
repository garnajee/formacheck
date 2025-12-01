import React, { useEffect, useRef } from 'react';
import { JSONEditor } from 'vanilla-jsoneditor';
import { Copy, Download, Trash2, Maximize2, Minimize2 } from 'lucide-react';

interface JsonVisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  onClear: () => void;
  onDownload?: () => void;
}

const JsonVisualEditor: React.FC<JsonVisualEditorProps> = ({
  value,
  onChange,
  title,
  onClear,
  onDownload
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  
  // Track the latest value emitted to parent to avoid update loops
  const lastEmittedValue = useRef<string>(value);
  // Track onChange callback to avoid re-initializing editor on prop change
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new JSONEditor({
        target: containerRef.current,
        props: {
          content: { text: value },
          mode: 'tree',
          onChange: (updatedContent, previousContent, { contentErrors }) => {
            if (!contentErrors) {
              let newValue = '';
              if ('text' in updatedContent && updatedContent.text) {
                newValue = updatedContent.text;
              } else if ('json' in updatedContent && updatedContent.json) {
                newValue = JSON.stringify(updatedContent.json, null, 2);
              }

              // Only emit if value has effectively changed
              if (newValue !== lastEmittedValue.current) {
                lastEmittedValue.current = newValue;
                onChangeRef.current(newValue);
              }
            }
          },
        },
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync props value to editor
  useEffect(() => {
    // Only update the editor if the prop value is different from what we last emitted
    if (editorRef.current && value !== lastEmittedValue.current) {
      lastEmittedValue.current = value;
      // We catch potential "Canceled" errors if updates happen too quickly
      editorRef.current.updateProps({
        content: { text: value }
      }).catch(err => {
         // Suppress "Canceled" error which happens on rapid updates
         if (err && err.message !== 'Canceled') {
             console.error('JSON Editor Update Failed', err);
         }
      });
    }
  }, [value]);

  const handleExpandAll = () => {
    // Use the functional form of expand to expand all nodes
    if (editorRef.current) {
        // @ts-ignore
        editorRef.current.expand(() => true);
    }
  };

  const handleCollapseAll = () => {
    // Use the functional form of expand returning false to collapse all nodes
    if (editorRef.current) {
        // @ts-ignore
        editorRef.current.expand(() => false);
    }
  };

  const handleCopyDirectly = async () => {
    if (!editorRef.current) return;
    
    try {
      const content = editorRef.current.get();
      let textToCopy = "";
      
      // @ts-ignore
      if (content.json) {
         // @ts-ignore
         textToCopy = JSON.stringify(content.json, null, 2);
      } else {
         // @ts-ignore
         const rawText = content.text || "";
         try {
            const obj = JSON.parse(rawText);
            textToCopy = JSON.stringify(obj, null, 2);
         } catch (e) {
            textToCopy = rawText;
         }
      }

      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error("Failed to copy from JSON Editor", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl jse-theme-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</h2>
        </div>

        <div className="flex items-center space-x-1">
            <button 
                onClick={handleExpandAll}
                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                title="Expand All"
            >
                <Maximize2 size={16} />
            </button>
            <button 
                onClick={handleCollapseAll}
                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                title="Collapse All"
            >
                <Minimize2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>

          {onDownload && (
            <button 
              onClick={onDownload}
              className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
              title="Download File"
            >
              <Download size={16} />
            </button>
          )}

          <button 
            onClick={handleCopyDirectly}
            className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded transition-colors"
            title="Copy Formatted JSON"
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

      <div 
        ref={containerRef} 
        className="flex-grow h-0 min-h-[400px]" 
      />
      
      <div className="bg-gray-900 px-4 py-1 text-xs text-gray-500 flex justify-between border-t border-gray-700">
        <span>Visual Editor</span>
        <span>{value.length} chars</span>
      </div>
    </div>
  );
};

export default JsonVisualEditor;