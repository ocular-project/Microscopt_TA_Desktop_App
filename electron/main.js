import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import fs from 'fs'
import { fileURLToPath } from "url";
import { savePath, loadPath } from './storage.js'
import unzipper from "unzipper"
import {
  addDataJson,
  createPhysicalFolder, deleteFile, getDataFile,
  getDataJson, getMyImageAnnotations,
  handleImagesUpload,
  handleImageUpload, renameFolder, saveAnnotations, transferFile, transferFiles
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

async function createFolder(name, parentId) {
    const dir = loadPath()
    const data = {
        _id: String(Date.now()),
        name,
        type: "folder",
        mineType: "",
        parent: parentId || "",
        path: [],
        size: 0,
        isAnnotated: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
    return  await addDataJson(dir, data)
}

ipcMain.handle('fileManagement:createFolder', async (event, folder) => {
  return await createFolder(folder.name, folder.parentId)
})

ipcMain.handle('fileManagement:renameFolder', (event, object) => {
  const dir = loadPath()
  return  renameFolder(dir, object)

})

ipcMain.handle('fileManagement:getFoldersAndFiles', (event, parentId) => {
  const dir = loadPath()
  return  getDataJson(`${dir}/Microscopy_TA/database/database.json`, parentId)

})

ipcMain.handle('fileManagement:getFile', (event, fileId) => {
  const dir = loadPath()
  return  getDataFile(`${dir}/Microscopy_TA/database/database.json`, fileId)

})

ipcMain.handle('fileManagement:transferFile', (event, fileId, type) => {
  return  transferFile(fileId, type)
})

ipcMain.handle('fileManagement:transferFiles', (event, fileList, type) => {
  return  transferFiles(fileList, type)
})

ipcMain.handle('fileManagement:deleteFile', (event, fileId) => {
  return  deleteFile(fileId)
})

ipcMain.handle('imageAnnotation:saveAnnotation', (event, body) => {
  return  saveAnnotations(body)
})

ipcMain.handle('imageAnnotation:getMyAnnotation', (event, imageId) => {
  return getMyImageAnnotations(imageId)
})

ipcMain.handle('fileDownload:downloadFile', async (event, url) => {
    const win = BrowserWindow.getFocusedWindow();

    return new Promise((resolve, reject) => {
        win.webContents.downloadURL(url);

        session.defaultSession.once('will-download', (event, item) => {
            const filename = item.getFilename();
            const dir = loadPath()
            const customDir = path.join(dir, 'Microscopy_TA', 'folders_and_images');
            fs.mkdirSync(customDir, { recursive: true });

            const savePath = path.join(customDir, filename);

            // ✅ Check if file already exists
            if (fs.existsSync(savePath)) {
                console.log('File already exists, canceling download:', savePath);
                item.cancel(); // cancel the download
                return resolve({
                    success: false,
                    error: 'File already exists, check in My Computer',
                    path: savePath,
                });
            }

            item.setSavePath(savePath);

            item.once('done', (_, state) => {
                if (state === 'completed') {
                    console.log(savePath)
                    handleImageUpload(savePath)
                    resolve({
                        success: true,
                        filename,
                        path: savePath,
                    });
                } else {
                    reject({
                        success: false,
                        error: state,
                    });
                }
            });
        });
    });
});

ipcMain.handle('fileDownload:downloadZippedFile', async (event, url) => {
    const win = BrowserWindow.getFocusedWindow();

    return new Promise((resolve, reject) => {
        win.webContents.downloadURL(url);

        session.defaultSession.once('will-download', (event, item) => {
            const filename = item.getFilename();
            const dir = loadPath()
            const customDir = path.join(dir, 'Microscopy_TA', 'folders_and_images');
            fs.mkdirSync(customDir, { recursive: true });

            const savePath = path.join(customDir, filename);

            // ✅ Check if file already exists
            if (fs.existsSync(savePath)) {
                console.log('Zipped File already exists, canceling download:', savePath);
                item.cancel(); // cancel the download
                return resolve({
                    success: false,
                    error: 'Zipped File already exists, check in My Computer',
                    path: savePath,
                });
            }

            item.setSavePath(savePath);

            item.once('done', (_, state) => {
                if (state === 'completed') {
                    console.log(savePath)
                    // handleImageUpload(savePath)
                    resolve({
                        success: true,
                        filename,
                        path: savePath,
                    });
                } else {
                    reject({
                        success: false,
                        error: state,
                    });
                }
            });
        });
    });
});

function getDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}:${minutes}`;
}

ipcMain.handle('fileDownload:saveZip', async (_, buffer) => {
    try {
        const dir = loadPath();
        const customDir = path.join(dir, "Microscopy_TA", "folders_and_images");

        fs.mkdirSync(customDir, { recursive: true });

        const filePath = path.join(customDir, "temp.zip");
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        fs.writeFileSync(filePath, Buffer.from(buffer));

        let saveFiles = []
        const directory = await unzipper.Open.buffer(Buffer.from(buffer))
        const hasFiles = directory.files.some(item => item.type === 'File')
        if (hasFiles) {
            const name = `my_drive_${getDateTime()}`
            const folder = await createFolder(name, "")
            if (folder.success) {
                for (const entry of directory.files){
                   const fullPath = path.join(customDir, name, entry.path)

                   if (entry.type === 'File') {
                       const content = await entry.buffer()
                       fs.writeFileSync(fullPath, content)
                       saveFiles.push(fullPath)
                   }
                }
                await handleImagesUpload(saveFiles, folder.data._id)
            }
            else {
                return {
                    success: false,
                    error: folder.error
                }
            }
        }
        else {
            return {
                success: false,
                error: "Zipped file has no files to extract"
            }
        }

        // 3️⃣ Remove ZIP after extraction
        fs.unlinkSync(filePath);

        return {
          success: true,
          message: "Files extracted successfully",
        };
    }
    catch (error) {
        console.error(error);
        return {
            success: false,
            error: error.message || "Failed to extract ZIP",
        };
  }
});