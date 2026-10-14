// Preload Script - Electron IPC güvenli köprü
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkUpdates: () => ipcRenderer.invoke('app:check-updates')
});