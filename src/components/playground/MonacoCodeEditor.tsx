"use client";

import { useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';

interface MonacoCodeEditorProps {
  /**
   * Initial code content
   */
  value?: string;

  /**
   * Programming language (default: 'python')
   */
  language?: 'python' | 'javascript';

  /**
   * Editor height
   */
  height?: string | number;

  /**
   * Callback when code changes
   */
  onChange?: (value: string) => void;

  /**
   * Read-only mode
   */
  readOnly?: boolean;

  /**
   * Show line numbers
   */
  lineNumbers?: 'on' | 'off' | 'relative';

  /**
   * Theme
   */
  theme?: 'light' | 'vs-dark';

  /**
   * Show minimap
   */
  minimap?: boolean;
}

/**
 * MonacoCodeEditor Component
 *
 * A powerful code editor powered by Monaco (VS Code's editor)
 * Provides Python syntax highlighting, auto-completion, and more.
 *
 * Features:
 * - Syntax highlighting
 * - Auto-completion
 * - Error detection
 * - Code folding
 * - Multiple cursors
 * - Find/replace
 */
export function MonacoCodeEditor({
  value = '',
  language = 'python',
  height = '600px',
  onChange,
  readOnly = false,
  lineNumbers = 'on',
  theme = 'vs-dark',
  minimap = true,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * Handle editor mount
   */
  function handleEditorDidMount(
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) {
    editorRef.current = editorInstance;
    setIsReady(true);

    // Configure Python-specific settings
    if (language === 'python') {
      monacoInstance.languages.setLanguageConfiguration('python', {
        indentationRules: {
          increaseIndentPattern: /^(\s*)(class|def|if|elif|else|for|while|with|try|except|finally).*:\s*$/,
          decreaseIndentPattern: /^\s*(return|pass|break|continue|raise)\b/,
        },
      });

      // Add common Python snippets
      monacoInstance.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
          const suggestions: any[] = [
            {
              label: 'shiny_app',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: [
                'from shiny import App, ui, render',
                '',
                'app_ui = ui.page_fluid(',
                '    ui.h2("${1:Title}"),',
                '    ${2:# Add UI elements here}',
                ')',
                '',
                'def server(input, output, session):',
                '    ${3:# Add server logic here}',
                '    pass',
                '',
                'app = App(app_ui, server)',
              ].join('\n'),
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Basic Shiny app template',
            },
            {
              label: 'shiny_plot',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: [
                '@output',
                '@render.ui',
                'def ${1:plot_name}():',
                '    fig = go.Figure()',
                '    ${2:# Create your plot}',
                '    return ui.HTML(fig.to_html(include_plotlyjs="cdn"))',
              ].join('\n'),
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Shiny plotly output',
            },
            {
              label: 'shiny_text',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: [
                '@output',
                '@render.text',
                'def ${1:text_name}():',
                '    return "${2:text content}"',
              ].join('\n'),
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Shiny text output',
            },
          ];
          return { suggestions };
        },
      });
    }

    // Focus editor
    editorInstance.focus();
  }

  /**
   * Handle code changes
   */
  function handleEditorChange(value: string | undefined) {
    if (value !== undefined && onChange) {
      onChange(value);
    }
  }

  /**
   * Format code
   */
  function formatCode() {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }

  /**
   * Get editor instance (for parent components)
   */
  function getEditor() {
    return editorRef.current;
  }

  return (
    <div className="monaco-editor-container">
      {/* Editor Toolbar */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{language}</span>
          {readOnly && (
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">Read Only</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={formatCode}
              disabled={!isReady}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Format Code
            </button>
          )}
          <span className="text-xs text-gray-400">
            {value.split('\n').length} lines
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        options={{
          readOnly,
          lineNumbers,
          minimap: {
            enabled: minimap,
          },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          snippetSuggestions: 'inline',
          padding: {
            top: 16,
            bottom: 16,
          },
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-white">Loading editor...</div>
          </div>
        }
      />

      {/* Editor Info */}
      <div className="bg-gray-800 text-gray-400 px-4 py-1 text-xs border-t border-gray-700">
        Tip: Press <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + Space</kbd> for auto-complete,{' '}
        <kbd className="bg-gray-700 px-1 rounded">Ctrl/Cmd + /</kbd> to comment
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * ```tsx
 * const [code, setCode] = useState(exampleTemplate.sourceCode);
 *
 * <MonacoCodeEditor
 *   value={code}
 *   onChange={setCode}
 *   language="python"
 *   height="600px"
 *   theme="vs-dark"
 * />
 * ```
 */
