export enum Language {
  JSON = 'json',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  HTML = 'html',
  CSS = 'css',
  XML = 'xml',
  SQL = 'sql',
  MARKDOWN = 'markdown'
}

export interface EditorProps {
  language: Language;
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  title: string;
  onClear: () => void;
  onCopy: () => void;
  onPaste?: () => void;
  onUpload?: (content: string, fileName: string) => void;
  onDownload?: () => void;
}

export type FormatMode = 'beautify' | 'minify';

export type ViewMode = 'formatter' | 'diff';