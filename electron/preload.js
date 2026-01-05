const { contextBridge, ipcRenderer } = require('electron');

console.log("✅ Preload loaded");

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),

    savePath: (folderPath) => ipcRenderer.invoke("electron:savePath", folderPath),
    getPath: () => ipcRenderer.invoke("electron:getPath"),
})