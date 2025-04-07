import React, { useState, useEffect } from 'react';
import { Editor, OnMount, BeforeMount } from '@monaco-editor/react';
import FallbackEditor from './FallbackEditor';

interface EditorProps {
  content: string;
  language?: string;
  onContentChange?: (content: string) => void;
}

const CodeEditor: React.FC<EditorProps> = ({
  content,
  language = 'javascript',
  onContentChange,
}) => {
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);

  // Handle errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      if (event.error && event.error.message && event.error.message.includes('monaco')) {
        setEditorError(event.error.message);
        setUseSimpleEditor(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Set a timeout to switch to simple editor if Monaco doesn't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isEditorReady && !editorError) {
        console.warn('Monaco editor took too long to load, switching to simple editor');
        setUseSimpleEditor(true);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timeout);
  }, [isEditorReady, editorError]);

  const handleEditorChange = (value: string | undefined) => {
    if (onContentChange && value !== undefined) {
      onContentChange(value);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setIsEditorReady(true);
    setEditorError(null);
    console.log('Editor mounted successfully');
    
    // Focus the editor
    if (editor) {
      editor.focus();
    }
  };

  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('vs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    });
  };

  // If we've detected errors or timeout, use the simple editor
  if (useSimpleEditor) {
    return <FallbackEditor content={content} onContentChange={onContentChange} />;
  }

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={content || '// Start coding here...'}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorWillMount}
        loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          renderWhitespace: 'selection',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: true,
          tabCompletion: true,
          wordBasedSuggestions: true,
          parameterHints: {
            enabled: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
      />
      {editorError && !useSimpleEditor && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 p-4">
          <p className="text-red-400 font-bold mb-2">Error loading editor:</p>
          <p className="text-white text-sm">{editorError}</p>
          <button
            onClick={() => setUseSimpleEditor(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Use Simple Editor
          </button>
        </div>
      )}
      {!isEditorReady && !editorError && !useSimpleEditor && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <p className="text-white">Loading editor...</p>
        </div>
      )}
    </div>
  );
};

export default CodeEditor; 