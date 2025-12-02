import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import JsonVisualEditor from './components/JsonVisualEditor';
import DiffViewer from './components/DiffViewer';
import Toolbar from './components/Toolbar';
import { detectLanguage, formatCode, minifyCode } from './utils/formatter';
import { Language, ViewMode } from './types';

function App() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [language, setLanguage] = useState<Language>(Language.JSON);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('formatter');

  // Debounce helper for real-time updates in Formatter Mode
  useEffect(() => {
    // Skip if in Diff mode or JSON visual mode
    if (viewMode === 'diff' || language === Language.JSON) return;

    if (!autoUpdate || !inputCode.trim()) return;

    const timeoutId = setTimeout(async () => {
      handleBeautify(true);
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputCode, language, autoUpdate, viewMode]);


  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLanguageChange = (val: string) => {
    if (val === 'auto') {
        const detected = detectLanguage(inputCode);
        setLanguage(detected);
        showNotification(`Auto-detected: ${detected.toUpperCase()}`);
    } else {
        setLanguage(val as Language);
    }
  };

  const handleBeautify = async (silent: boolean = false) => {
    setError(null);
    try {
      const formatted = await formatCode(inputCode, language);
      // If we are in JSON mode (single pane), we update inputCode directly
      if (language === Language.JSON) {
         setInputCode(formatted);
      } else {
         setOutputCode(formatted);
      }
      if (!silent) showNotification('Code beautified successfully!');
    } catch (e: any) {
      if (!silent) {
        setError(e.message || 'Formatting failed');
      } else {
         console.warn("Auto-format failed:", e.message);
      }
    }
  };

  const handleMinify = () => {
    setError(null);
    try {
      const minified = minifyCode(inputCode, language);
      
      // Safety check: if minification returns empty string but input wasn't empty, something went wrong (bad regex)
      // or if logic returned error.
      if (!minified && inputCode.trim().length > 0) {
        throw new Error("Minification produced empty result");
      }

      if (language === Language.JSON) {
        setInputCode(minified);
      } else {
        setOutputCode(minified);
      }
      showNotification('Code minified successfully!');
    } catch (e: any) {
      setError(e.message || 'Minification failed');
      console.error(e);
    }
  };

  const handleInputUpload = (content: string, fileName: string) => {
    setInputCode(content);
    const detected = detectLanguage(content);
    setLanguage(detected);
    showNotification(`Loaded ${fileName} (${detected})`);
  };
  
  const handleOutputUpload = (content: string, fileName: string) => {
    setOutputCode(content);
    showNotification(`Loaded ${fileName} as Modified`);
  };

  const handleInputChange = (newCode: string | undefined) => {
    const val = newCode || '';
    
    // Auto-detect language if the input was empty or if there is a significant length change (paste)
    const isPaste = val.length - inputCode.length > 10;
    
    if ((inputCode.length === 0 || isPaste) && val.length > 10) {
      const detected = detectLanguage(val);
      if (detected !== language) {
        setLanguage(detected);
      }
    }
    setInputCode(val);
  };

  const handleDownload = (content: string, suffix: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = language === Language.JAVASCRIPT ? 'js' : language;
    a.download = `code-${suffix}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showNotification('Copied to clipboard!');
    });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputCode(text);
      
      const detected = detectLanguage(text);
      
      if (detected !== language) {
        setLanguage(detected);
        showNotification(`Pasted & Detected: ${detected.toUpperCase()}`);
      } else {
        showNotification('Pasted from clipboard');
      }
    } catch (err) {
      showNotification('Failed to read clipboard');
    }
  };

  const handleJsonChange = useCallback((val: string) => {
    setInputCode(val);
  }, []);

  return (
    // Mobile: min-h-screen (scrollable). Desktop: h-screen (fixed).
    <div className="min-h-screen lg:h-screen bg-gray-950 text-gray-200 flex flex-col overflow-x-hidden w-full">
      <div className="flex-none">
        <Toolbar 
            language={language}
            setLanguage={handleLanguageChange}
            onBeautify={() => handleBeautify(false)}
            onMinify={handleMinify}
            autoUpdate={autoUpdate}
            setAutoUpdate={setAutoUpdate}
            viewMode={viewMode}
            setViewMode={setViewMode}
        />
      </div>

      <main className="flex-grow flex flex-col min-h-0 p-4 md:p-6 gap-4 max-w-[1920px] mx-auto w-full lg:overflow-hidden">
        
        {/* Error / Notification Banner */}
        <div className="flex-none h-8 flex items-center justify-center">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-1.5 rounded-full text-sm animate-pulse">
              Error: {error}
            </div>
          )}
          {notification && !error && (
            <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-1.5 rounded-full text-sm transition-all">
              {notification}
            </div>
          )}
        </div>

        {/* View Switching Logic */}
        <div className="flex-grow relative flex flex-col min-h-[500px] lg:min-h-0 w-full">
            {viewMode === 'diff' ? (
                <DiffViewer 
                    language={language}
                    original={inputCode}
                    modified={outputCode}
                    onOriginalChange={setInputCode}
                    onModifiedChange={setOutputCode}
                    onOriginalUpload={handleInputUpload}
                    onModifiedUpload={handleOutputUpload}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                />
            ) : (
                <>
                    {language === Language.JSON ? (
                        // Single Pane for JSON Formatter
                        <JsonVisualEditor 
                            title="JSON Visual Editor"
                            value={inputCode}
                            onChange={handleJsonChange}
                            onClear={() => setInputCode('')}
                            onDownload={() => handleDownload(inputCode, 'input')}
                        />
                    ) : (
                        // Split Pane for other languages Formatter
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full w-full">
                            <CodeEditor 
                                title="Input / Source"
                                language={language}
                                value={inputCode}
                                onChange={handleInputChange}
                                onClear={() => setInputCode('')}
                                onCopy={() => handleCopy(inputCode)}
                                onPaste={handlePaste}
                                onUpload={handleInputUpload}
                                onDownload={() => handleDownload(inputCode, 'input')}
                            />
                            
                            <CodeEditor 
                                title="Output / Result"
                                language={language}
                                value={outputCode}
                                onChange={(val) => setOutputCode(val || '')}
                                onClear={() => setOutputCode('')}
                                onCopy={() => handleCopy(outputCode)}
                                onDownload={() => handleDownload(outputCode, 'output')}
                                readOnly={false} 
                            />
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Info Footer */}
        <div className="flex-none text-center text-gray-500 text-sm py-4">
          <p className="mb-1">Processing is done entirely in your browser. No code is sent to any server.</p>
          <a 
            href="https://github.com/garnajee/formacheck/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
          >
            View Source on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}

export default App;