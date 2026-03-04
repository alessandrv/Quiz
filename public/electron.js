const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Secure API exposure
      nodeIntegration: false,  // Disable nodeIntegration for security
      contextIsolation: true,  // Use contextIsolation for security
    },
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'build', 'index.html')}`);
}

app.on('ready', createWindow);

ipcMain.handle('get-questions', async () => {
  const filePath = path.join(__dirname, 'questions.json');
  const data = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(data);
});

ipcMain.handle('save-questions', async (event, questions) => {
  const filePath = path.join(__dirname, 'questions.json');
  await fs.promises.writeFile(filePath, JSON.stringify(questions, null, 2), 'utf8');
  return { status: 'success' };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
