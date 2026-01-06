const { contextBridge, ipcRenderer } = require('electron');

console.log("✅ Preload loaded");

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),

    savePath: (folderPath) => ipcRenderer.invoke("electron:savePath", folderPath),
    getPath: () => ipcRenderer.invoke("electron:getPath"),

    createFolder: (folder) => ipcRenderer.invoke("fileManagement:createFolder", folder),
    getFoldersAndFiles: (parentId) => ipcRenderer.invoke('fileManagement:getFoldersAndFiles', parentId)
})