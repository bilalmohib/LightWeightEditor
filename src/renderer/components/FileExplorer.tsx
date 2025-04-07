import React, { useState, useEffect } from 'react';
import { FolderIcon, DocumentIcon, PlusIcon, FolderPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
const { ipcRenderer } = window.require('electron');
import * as monaco from 'monaco-editor';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

interface FileExplorerProps {
  onFileSelect?: (filePath: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [rootPath, setRootPath] = useState<string>('');

  const loadRootDirectory = async (path: string) => {
    try {
      const items = await ipcRenderer.invoke('fs:readDirectory', path);
      setFiles(items);
      setRootPath(path);
    } catch (error) {
      console.error('Error loading directory:', error);
    }
  };

  const loadSubDirectory = async (folderPath: string) => {
    try {
      const items = await ipcRenderer.invoke('fs:readDirectory', folderPath);
      
      // Update the nested children without losing the tree structure
      setFiles(prevFiles => {
        return updateFileTreeChildren(prevFiles, folderPath, items);
      });
    } catch (error) {
      console.error('Error loading subdirectory:', error);
    }
  };

  // Helper function to update children at a specific path in the tree
  const updateFileTreeChildren = (tree: FileItem[], folderPath: string, children: FileItem[]): FileItem[] => {
    return tree.map(item => {
      if (item.path === folderPath) {
        return { ...item, children };
      } else if (item.type === 'folder' && item.children) {
        return { ...item, children: updateFileTreeChildren(item.children, folderPath, children) };
      }
      return item;
    });
  };

  const handleOpenFolder = async () => {
    const folderPath = await ipcRenderer.invoke('dialog:openFolder');
    if (folderPath) {
      loadRootDirectory(folderPath);
    }
  };

  const handleCreateFile = async (folderPath: string) => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const filePath = `${folderPath}/${fileName}`;
        await ipcRenderer.invoke('fs:createFile', filePath);
        // Reload the parent directory to show the new file
        if (folderPath === rootPath) {
          loadRootDirectory(rootPath);
        } else {
          loadSubDirectory(folderPath);
        }
      } catch (error: any) {
        console.error('Error creating file:', error);
        alert(`Failed to create file: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCreateFolder = async (folderPath: string) => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const newFolderPath = `${folderPath}/${folderName}`;
        await ipcRenderer.invoke('fs:createFolder', newFolderPath);
        // Reload the parent directory to show the new folder
        if (folderPath === rootPath) {
          loadRootDirectory(rootPath);
        } else {
          loadSubDirectory(folderPath);
        }
      } catch (error: any) {
        console.error('Error creating folder:', error);
        alert(`Failed to create folder: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (itemPath: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await ipcRenderer.invoke('fs:delete', itemPath);
        // Find parent folder and reload it
        const parentPath = itemPath.substring(0, itemPath.lastIndexOf('/'));
        if (parentPath === rootPath) {
          loadRootDirectory(rootPath);
        } else {
          loadSubDirectory(parentPath);
        }
      } catch (error: any) {
        console.error('Error deleting item:', error);
        alert(`Failed to delete: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const toggleFolder = async (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      await loadSubDirectory(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (item: FileItem) => {
    if (item.type === 'file' && onFileSelect) {
      console.log(`File selected: ${item.path}`);
      onFileSelect(item.path);
    }
  };

  const renderFileItem = (item: FileItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const paddingLeft = `${level * 16}px`;

    return (
      <div key={item.path}>
        <div className="group flex items-center py-1 px-2 hover:bg-gray-700">
          <div className="flex-1 flex items-center" style={{ paddingLeft }}>
            <button
              className="flex items-center flex-1"
              onClick={() => 
                item.type === 'folder' 
                  ? toggleFolder(item.path) 
                  : handleFileClick(item)
              }
            >
              {item.type === 'folder' ? (
                <FolderIcon className="w-4 h-4 mr-2 text-yellow-500" />
              ) : (
                <DocumentIcon className="w-4 h-4 mr-2 text-blue-500" />
              )}
              <span className="text-sm truncate">{item.name}</span>
            </button>
          </div>
          
          <div className="hidden group-hover:flex items-center space-x-2">
            {item.type === 'folder' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFile(item.path);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFolder(item.path);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <FolderPlusIcon className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.path);
              }}
              className="p-1 hover:bg-gray-600 rounded text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map((child) => renderFileItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700">
        <button
          onClick={handleOpenFolder}
          className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Open Folder
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file) => renderFileItem(file))}
      </div>
    </div>
  );
};

export default FileExplorer;