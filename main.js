const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { setupFileSystem } = require('./src/main/fileSystem');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  // Load the index.html file
  if (isDev) {
    mainWindow.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`);
  }
}

app.whenReady().then(() => {
  setupFileSystem();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 