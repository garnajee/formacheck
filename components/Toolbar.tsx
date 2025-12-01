import React from 'react';
import { Language, ViewMode } from '../types';
import { Wand2, Zap, ArrowRightLeft, Settings2, FileDiff, FileCode2 } from 'lucide-react';

interface ToolbarProps {
  language: Language;
  setLanguage: (lang: string) => void;
  onBeautify: () => void;
  onMinify: () => void;
  onSwap: () => void;
  autoUpdate: boolean;
  setAutoUpdate: (val: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  language, 
  setLanguage, 
  onBeautify, 
  onMinify,
  onSwap,
  autoUpdate,
  setAutoUpdate,
  viewMode,
  setViewMode
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Branding & Language */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xl mr-2">
                <Settings2 className="w-6 h-6" />
                <span className="hidden sm:inline">FormaCheck</span>
            </div>

            {/* Mode Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                <button
                    onClick={() => setViewMode('formatter')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'formatter' 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <FileCode2 size={16} />
                    Formatter
                </button>
                <button
                    onClick={() => setViewMode('diff')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'diff' 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <FileDiff size={16} />
                    Diff Checker
                </button>
            </div>
          
            {viewMode === 'formatter' && (
              <div className="relative">
                  <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="appearance-none bg-gray-900 border border-gray-600 text-white py-2 pl-4 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-gray-850 font-medium text-sm"
                  >
                      <option value="auto" className="font-bold text-blue-400">✨ Auto-Detect</option>
                      <option disabled className="text-gray-600">──────────</option>
                      {Object.values(Language).map((lang) => (
                      <option key={lang} value={lang} className="capitalize">
                          {lang.toUpperCase()}
                      </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            )}
        </div>

        {/* Actions - Only show formatter actions if in formatter mode */}
        {viewMode === 'formatter' && (
            <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-300 mr-2 cursor-pointer select-none bg-gray-900 px-3 py-2 rounded border border-gray-700 hover:border-gray-500 transition-colors">
                <input 
                type="checkbox" 
                checked={autoUpdate} 
                onChange={(e) => setAutoUpdate(e.target.checked)} 
                className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                />
                <span>Real-time</span>
            </label>

            <button 
                onClick={onBeautify}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-all transform active:scale-95 shadow-lg shadow-blue-900/20 text-sm"
            >
                <Wand2 size={16} />
                Beautify
            </button>

            <button 
                onClick={onMinify}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded font-medium transition-all transform active:scale-95 text-sm"
            >
                <Zap size={16} />
                Minify
            </button>
            
            <button 
                onClick={onSwap}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded font-medium transition-all transform active:scale-95"
                title="Use Output as Input"
            >
                <ArrowRightLeft size={16} />
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
