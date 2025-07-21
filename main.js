// main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280, // A slightly wider default width
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // Optional: Set a custom icon for your app
    // You would need to create an 'icon.png' file in a 'build' folder
    // icon: path.join(__dirname, 'build/icon.png') 
  });

  // Load your live website URL.
  mainWindow.loadURL('http://rota.ht-it.xyz/');

  // Optional: Open the DevTools for debugging.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});