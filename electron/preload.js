const { contextBridge, ipcRenderer } = require('electron');

console.log("✅ Preload loaded");

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    selectImages: (parentId) => ipcRenderer.invoke('dialog:openImagePicker', parentId),
    selectImage: () => ipcRenderer.invoke('dialog:openOneImagePicker'),

    savePath: (folderPath) => ipcRenderer.invoke("electron:savePath", folderPath),
    getPath: () => ipcRenderer.invoke("electron:getPath"),

    createFolder: (folder) => ipcRenderer.invoke("fileManagement:createFolder", folder),
    renameFolder: (object) => ipcRenderer.invoke("fileManagement:renameFolder", object),
    getFoldersAndFiles: (parentId) => ipcRenderer.invoke('fileManagement:getFoldersAndFiles', parentId),
    getFile: (fileId) => ipcRenderer.invoke('fileManagement:getFile', fileId),
    deleteFile: (fileId) => ipcRenderer.invoke('fileManagement:deleteFile', fileId),

    transferFile: (fileId, type) => ipcRenderer.invoke('fileManagement:transferFile', fileId, type),
    transferFiles: (fileList, type) => ipcRenderer.invoke('fileManagement:transferFiles', fileList, type),

    saveAnnotation: (body) => ipcRenderer.invoke("imageAnnotation:saveAnnotation", body),
    getMyAnnotations: (imageId) => ipcRenderer.invoke("imageAnnotation:getMyAnnotation", imageId),

    downloadFile: (url) => ipcRenderer.invoke('fileDownload:downloadFile', url),
})