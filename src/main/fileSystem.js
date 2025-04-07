const { ipcMain, dialog } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function setupFileSystem() {
  // Open folder
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (!result.canceled) {
      return result.filePaths[0];
    }
  });

  // Read directory contents
  ipcMain.handle('fs:readDirectory', async (_, folderPath) => {
    const items = await fs.readdir(folderPath, { withFileTypes: true });
    const fileItems = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(folderPath, item.name);
        return {
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'folder' : 'file',
        };
      })
    );
    return fileItems;
  });

  // Create new file
  ipcMain.handle('fs:createFile', async (_, filePath) => {
    await fs.writeFile(filePath, '');
    return filePath;
  });

  // Create new folder
  ipcMain.handle('fs:createFolder', async (_, folderPath) => {
    await fs.mkdir(folderPath);
    return folderPath;
  });

  // Read file content
  ipcMain.handle('fs:readFile', async (_, filePath) => {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  });

  // Write file content
  ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // Delete file or folder
  ipcMain.handle('fs:delete', async (_, itemPath) => {
    const stat = await fs.stat(itemPath);
    if (stat.isDirectory()) {
      await fs.rm(itemPath, { recursive: true });
    } else {
      await fs.unlink(itemPath);
    }
  });
}

module.exports = { setupFileSystem }; 