const { contextBridge, ipcRenderer } = require('electron');

console.log("✅ Preload loaded");

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    selectImages: (parentId) => ipcRenderer.invoke('dialog:openImagePicker', parentId),
    selectImage: () => ipcRenderer.invoke('dialog:openOneImagePicker'),

    savePath: (folderPath) => ipcRenderer.invoke("electron:savePath", folderPath),
    getPath: () => ipcRenderer.invoke("electron:getPath"),

    createFolder: (folder) => ipcRenderer.invoke("fileManagement:createFolder", folder),
    getFoldersAndFiles: (parentId) => ipcRenderer.invoke('fileManagement:getFoldersAndFiles', parentId),
    getFile: (fileId) => ipcRenderer.invoke('fileManagement:getFile', fileId),

    saveAnnotation: (body) => ipcRenderer.invoke("imageAnnotation:saveAnnotation", body),
    getMyAnnotations: (imageId) => ipcRenderer.invoke("imageAnnotation:getMyAnnotation", imageId),
})