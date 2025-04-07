import React, { useState, useCallback } from 'react';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/Editor';

const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('// Start coding here...');

  const handleFileSelect = useCallback(async (filePath: string) => {
    console.log('File selected in App:', filePath);
    try {
      setCurrentFile(filePath);
      const content = await ipcRenderer.invoke('fs:readFile', filePath);
      console.log('File content loaded, length:', content.length);
      setEditorContent(content);
    } catch (error: any) {
      console.error('Error loading file:', error);
      alert(`Failed to load file: ${error.message || 'Unknown error'}`);
    }
  }, []);

  const handleContentChange = useCallback(async (content: string) => {
    setEditorContent(content);
    if (currentFile) {
      try {
        await ipcRenderer.invoke('fs:writeFile', currentFile, content);
      } catch (error: any) {
        console.error('Error saving file:', error);
        // Only show alert for critical errors to avoid disrupting the editing experience
        if (error.code !== 'ENOENT') {
          alert(`Failed to save file: ${error.message || 'Unknown error'}`);
        }
      }
    }
  }, [currentFile]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <FileExplorer onFileSelect={handleFileSelect} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor */}
        <div className="flex-1">
          <CodeEditor
            content={editorContent}
            language={getLanguageFromFileName(currentFile)}
            onContentChange={handleContentChange}
          />
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-gray-800 border-t border-gray-700 px-4 flex items-center text-xs">
          <span className="text-gray-400">
            {currentFile || 'No file selected'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine language based on file extension
function getLanguageFromFileName(fileName: string): string {
  if (!fileName) return 'plaintext';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const extensionMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'php': 'php',
    'rb': 'ruby',
    'rs': 'rust',
    'sh': 'shell',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return extensionMap[extension] || 'plaintext';
}

export default App; 