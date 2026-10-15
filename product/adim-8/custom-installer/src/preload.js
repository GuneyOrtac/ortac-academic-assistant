const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isInstaller: true,
  getSystemInfo: () => ipcRenderer.invoke('installer:get-system-info'),
  selectDirectory: () => ipcRenderer.invoke('installer:select-directory'),
  startInstallation: (params) => ipcRenderer.invoke('installer:start-installation', params),
  launchApp: (targetExe) => ipcRenderer.invoke('installer:launch-app', targetExe),
  onInstallProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('installer:progress', listener);
    return () => ipcRenderer.removeListener('installer:progress', listener);
  }
});
