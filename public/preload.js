const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Methods for interacting with main process
  getQuestions: () => ipcRenderer.invoke('get-questions'),
  saveQuestions: (questions) => ipcRenderer.invoke('save-questions', questions),
});
