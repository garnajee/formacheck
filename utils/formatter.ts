import { Language } from '../types';
import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as parserHtml from 'prettier/plugins/html';
import * as parserPostcss from 'prettier/plugins/postcss';
import * as parserEstree from 'prettier/plugins/estree';
import * as parserTypescript from 'prettier/plugins/typescript';

// Helper to detect language based on content
export const detectLanguage = (content: string): Language => {
  const trimmed = content.trim();
  if (!trimmed) return Language.JSON;

  // 1. JSON (Strict & Loose)
  // Check for standard JSON start/end characters
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return Language.JSON;
    } catch {
      // If parse fails, it might be a JS Object or just invalid JSON.
    }
  }

  // 2. HTML / XML
  if (trimmed.startsWith('<')) {
    // XML Declaration
    if (/^<\?xml\s/i.test(trimmed)) return Language.XML;
    // Doctype HTML
    if (/^<!doctype\s+html/i.test(trimmed)) return Language.HTML;
    
    // Look for HTML-specific tags that are unlikely in generic XML
    const htmlTags = /<\s*\/?\s*(html|head|body|div|span|p|a|ul|ol|li|table|tr|td|br|img|h[1-6]|form|input|button|script|style|meta|link|header|footer|nav|section|article)\b/i;
    if (htmlTags.test(trimmed)) return Language.HTML;
    
    return Language.XML;
  }

  // 3. SQL
  const sqlStartPattern = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|BEGIN|DECLARE|WITH)\b/i;
  const sqlClausePattern = /\b(FROM|WHERE|GROUP BY|ORDER BY|INNER JOIN|LEFT JOIN|RIGHT JOIN|VALUES|SET|PRIMARY KEY|FOREIGN KEY)\b/i;
  
  if (sqlStartPattern.test(trimmed) || sqlClausePattern.test(trimmed)) {
      const isJs = /\b(const|var|let|function|return|import|export|class)\b/.test(trimmed);
      if (!isJs) return Language.SQL;
  }

  // 4. CSS
  const hasCssBlock = /[^{}]+{\s*([a-zA-Z0-9-]+\s*:\s*[^;]+;\s*)+}/.test(trimmed) || /^[^{}]+{\s*[\s\S]+\s*}$/m.test(trimmed);
  const isJsLike = /\b(function|class|if|for|while|const|var|let|return|import|export|=>)\b/.test(trimmed);
  
  if (hasCssBlock && !isJsLike) {
      if (!/"\s*:\s*"/m.test(trimmed)) {
          return Language.CSS;
      }
  }

  // 5. Markdown
  // Look for common markdown patterns: headers (# ), bold (**), links ([]()), lists (- )
  const mdPattern = /(^#{1,6}\s)|(^\s*[-*+]\s)|(^>\s)|(\[.*\]\(.*\))/m;
  if (mdPattern.test(trimmed)) {
    return Language.MARKDOWN;
  }

  // 6. TypeScript / JavaScript
  const tsKeywords = /\b(interface|type|enum|namespace|implements|abstract|readonly|private|protected|public|as)\b/;
  const tsTypeAnnotation = /:\s*(string|number|boolean|any|void|never|object|unknown)\b/;
  const tsGenerics = /<[A-Z][a-zA-Z0-9]*>/; 

  if (tsKeywords.test(trimmed) || tsTypeAnnotation.test(trimmed) || tsGenerics.test(trimmed)) {
      return Language.TYPESCRIPT;
  }

  // 7. Default to JavaScript
  return Language.JAVASCRIPT;
};

export const formatCode = async (code: string, language: Language): Promise<string> => {
  if (!code.trim()) return '';

  try {
    switch (language) {
      case Language.JSON:
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, 2);
      
      case Language.JAVASCRIPT:
        return await prettier.format(code, {
          parser: 'babel',
          plugins: [parserBabel, parserEstree],
          semi: true,
          singleQuote: true,
        });

      case Language.TYPESCRIPT:
        return await prettier.format(code, {
          parser: 'typescript',
          plugins: [parserTypescript, parserEstree],
          semi: true,
          singleQuote: true,
        });

      case Language.HTML:
        return await prettier.format(code, {
          parser: 'html',
          plugins: [parserHtml],
        });

      case Language.CSS:
        return await prettier.format(code, {
          parser: 'css',
          plugins: [parserPostcss],
        });
      
      case Language.XML:
        return await prettier.format(code, {
          parser: 'html',
          plugins: [parserHtml],
          htmlWhitespaceSensitivity: 'ignore',
          xmlWhitespaceSensitivity: 'ignore'
        } as any);

      case Language.SQL:
        return code
          .replace(/\s+/g, ' ')
          .replace(/\s*([,()])\s*/g, '$1 ')
          .replace(/\s*\(\s*/g, ' (')
          .replace(/\s*\)\s*/g, ') ')
          .replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT INTO|UPDATE|DELETE FROM|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|VALUES|SET|CREATE TABLE|ALTER TABLE)\b/gi, (match) => `\n${match.toUpperCase()}`)
          .replace(/\b(ON|AS|IN|IS|NULL|NOT|ASC|DESC)\b/gi, (match) => ` ${match.toUpperCase()} `)
          .trim();
          
      case Language.MARKDOWN:
          // Simple Markdown formatting (normalize headers and lists)
          // Since we don't have the markdown parser loaded for prettier, we do basic cleanup
          return code
            .replace(/^#+\s*/gm, (match) => match.trim() + ' ') // Fix header spacing
            .replace(/^\s*[-*]\s+/gm, '- '); // Normalize list bullets

      default:
        return code;
    }
  } catch (error) {
    console.warn("Formatting error:", error);
    throw error;
  }
};

export const minifyCode = (code: string, language: Language): string => {
   if (!code.trim()) return '';

   try {
     switch (language) {
       case Language.JSON:
         return JSON.stringify(JSON.parse(code));
       case Language.HTML:
       case Language.XML:
         return code.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
       case Language.CSS:
         return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([:;{}])\s*/g, '$1').trim();
       case Language.JAVASCRIPT:
       case Language.TYPESCRIPT:
         return code
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
            .replace(/\s+/g, ' ')
            .trim();
       case Language.SQL:
         return code.replace(/\s+/g, ' ').trim();
       default:
         return code.replace(/\s+/g, ' ');
     }
   } catch (e) {
     throw e;
   }
}