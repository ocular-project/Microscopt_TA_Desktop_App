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
    getFile: (fileId, credentials) => ipcRenderer.invoke('fileManagement:getFile', fileId, credentials),
    deleteFile: (fileId) => ipcRenderer.invoke('fileManagement:deleteFile', fileId),

    transferFile: (fileId, type) => ipcRenderer.invoke('fileManagement:transferFile', fileId, type),
    transferFiles: (fileList, type) => ipcRenderer.invoke('fileManagement:transferFiles', fileList, type),
    updateFiles: (fileList) => ipcRenderer.invoke('fileManagement:updateFiles', fileList),

    saveAnnotation: (body, cred) => ipcRenderer.invoke("imageAnnotation:saveAnnotation", body, cred),
    getMyAnnotations: (imageId, cred) => ipcRenderer.invoke("imageAnnotation:getMyAnnotations", imageId, cred),
    getAllAnnotations: (imageId) => ipcRenderer.invoke("imageAnnotation:getAllAnnotations", imageId),
    getAnnotatorFeedback: (id, cred) => ipcRenderer.invoke("imageAnnotation:getAnnotatorFeedback", id, cred),
    saveFeedback: (object, cred) => ipcRenderer.invoke("imageAnnotation:saveFeedback", object, cred),
    getMyFeedback: (id) => ipcRenderer.invoke("imageAnnotation:getMyFeedback", id),

    downloadFile: (url) => ipcRenderer.invoke('fileDownload:downloadFile', url),
    downloadZippedFile: (url) => ipcRenderer.invoke('fileDownload:downloadZippedFile', url),
    saveZip: (buffer, cat) => ipcRenderer.invoke("fileDownload:saveZip", buffer, cat),

    downloadImageAnnotations: (pair) => ipcRenderer.invoke('fileDownload:downloadImageAnnotations', pair),

    getInstructions: (fileId) => ipcRenderer.invoke('instructions:getInstructions', fileId),
    saveInstructions: (instructions) => ipcRenderer.invoke('instructions:saveInstructions', instructions)
})