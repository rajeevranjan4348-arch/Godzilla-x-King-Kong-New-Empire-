const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openApp: (name: string) => ipcRenderer.invoke('iris:openApp', name),
  screenshot: () => ipcRenderer.invoke('iris:screenshot'),
});
