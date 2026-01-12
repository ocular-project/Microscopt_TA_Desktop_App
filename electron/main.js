import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { savePath, loadPath } from './storage.js'
import {
  addDataJson,
  createPhysicalFolder, getDataFile,
  getDataJson,
  handleImagesUpload,
  handleImageUpload, saveAnnotations
} from './fileManagement.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Vite dev server
  mainWindow.loadURL("http://localhost:3009");

}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if(canceled) {
    return null;
  } else {
    console.log(filePaths[0])
    return filePaths[0]
  }
})

ipcMain.handle('dialog:openImagePicker', async (event, parentId) => {

  const result = await  dialog.showOpenDialog({
    title: "Select images",
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Images",
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp"]
      }
    ]
  })

  if (result.canceled) return [];
  // console.log(parentId)
  return handleImagesUpload(result.filePaths, parentId)
})


ipcMain.handle('dialog:openOneImagePicker', async () => {

  const result = await  dialog.showOpenDialog({
    title: "Select images",
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp"]
      }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) return null;
  // console.log(parentId)
  return handleImageUpload(result.filePaths[0])
})

ipcMain.handle('electron:savePath', (event, folderPath) => {
  savePath(folderPath);
  return true;
});

ipcMain.handle('electron:getPath', () => {
  return loadPath();
});

ipcMain.handle('fileManagement:createFolder', (event, folder) => {
  const dir = loadPath()
  const data = {
    _id: String(Date.now()),
    name: folder.name,
    type: "folder",
    mineType: "",
    parent: folder.parentId || "",
    path: [],
    size: 0,
    isAnnotated: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return  addDataJson(dir, data)

})

ipcMain.handle('fileManagement:getFoldersAndFiles', (event, parentId) => {
  const dir = loadPath()
  return  getDataJson(`${dir}/Microscopy_TA/database/database.json`, parentId)

})

ipcMain.handle('fileManagement:getFile', (event, fileId) => {
  const dir = loadPath()
  return  getDataFile(`${dir}/Microscopy_TA/database/database.json`, fileId)

})

ipcMain.handle('imageAnnotation:saveAnnotation', (event, body) => {
  return  saveAnnotations(body)
})