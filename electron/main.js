import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import fs from 'fs'
import { fileURLToPath } from "url";
import { savePath, loadPath } from './storage.js'
import unzipper from "unzipper"
import {
    addDataJson,
    createPhysicalFolder,
    deleteFile,
    generateObjectId,
    getAllAnnotations,
    getAnnotatorFeedback,
    getDataFile,
    getDataJson,
    getMyFeedback,
    getMyImageAnnotations,
    handleAnnotationsDownload,
    handleBatchAnnotationsDownload,
    handleImagesSave,
    handleImagesUpload,
    handleImageUpload,
    renameFolder,
    saveAnnotations,
    saveFeedback,
    transferFile,
    transferFiles, updateFiles
} from './fileManagement.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // rest of your main.js code goes here
  app.whenReady().then(createWindow)
}

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
  if (process.platform !== "darwin") {
      app.quit()
  }
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

async function createFolder(name, parentId, _id = generateObjectId()) {
    const dir = loadPath()
    const data = {
        _id,
        name,
        type: "folder",
        mineType: "",
        parent: parentId || null,
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

ipcMain.handle('fileManagement:getFile', async (event, fileId, credentials) => {
  const dir = loadPath()
  return  await getDataFile(`${dir}/Microscopy_TA/database/database.json`, fileId, credentials)

})

ipcMain.handle('fileManagement:transferFile', (event, fileId, type) => {
  return  transferFile(fileId, type)
})

ipcMain.handle('fileManagement:transferFiles', async (event, fileList, type) => {
  return  await transferFiles(fileList, type)
})

ipcMain.handle('fileManagement:updateFiles', async (event, fileList,) => {
  return  await updateFiles(fileList)
})

ipcMain.handle('fileManagement:deleteFile', async (event, fileId) => {
  return  await deleteFile(fileId)
})

ipcMain.handle('imageAnnotation:saveAnnotation', (event, body, cred) => {
  return  saveAnnotations(body, cred)
})

ipcMain.handle('imageAnnotation:getMyAnnotations', (event, imageId, cred) => {
  return getMyImageAnnotations(imageId, cred)
})

ipcMain.handle('imageAnnotation:getAllAnnotations', async (event, imageId) => {
  return await getAllAnnotations(imageId)
})

ipcMain.handle('imageAnnotation:getAnnotatorFeedback', (event, id, cred) => {
  return getAnnotatorFeedback(id, cred)
})

ipcMain.handle('imageAnnotation:saveFeedback', async (event, object, cred) => {
    return await saveFeedback(object, cred)
})

ipcMain.handle('imageAnnotation:getMyFeedback', async (event, id) => {
    return await getMyFeedback(id)
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

    return `${year}-${month}-${day}_${hours}-${minutes}`;
}

ipcMain.handle('fileDownload:saveZip', async (_, buffer, cat) => {
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

        // console.log(directory.files)

        const foldersEntry = directory.files.find(entry =>
            entry.type === 'File' && entry.path.endsWith('folders.json')
        )

        const annotationsEntry = directory.files.find(entry =>
            entry.type === 'File' && entry.path.endsWith('annotationData.json')
        )
        // console.log(annotationsEntry)

        let folders = []
        let parentFolder = null
        if (foldersEntry) {
            try {
                const content = await foldersEntry.buffer();
                const jsonContent = JSON.parse(content.toString('utf8'));
                // console.log(jsonContent)
                folders = jsonContent.folders
                parentFolder = jsonContent.parentFolder
                // console.log(JSON.stringify(folders, null, 2));
            } catch (err) {
                console.error('Error reading or parsing folders.json:', err.message);
            }
        }

        let name = ""
        if (cat === "folder"){
            name = "my_drive"
        }
        else {
            name = "shared_files"
        }
        let folder = await createFolder(name, null)
        if (!folder?.success) {
            throw new Error('Folder creation failed');
        }
        folder = folder.data
        const driveId = folder._id

        if (parentFolder){
            let childFolder = await createFolder(parentFolder.name, folder._id, parentFolder._id)
            if (!childFolder?.success) {
                throw new Error('Folder creation failed');
            }
            folder = childFolder.data
        }

        // folder = folder.data
         for (const entry of directory.files){
            if (entry.type !== 'File') continue;
            if (!entry.path) continue;
            if (entry.path.endsWith('folders.json')) continue;
            if (entry.path.endsWith('annotationData.json')) continue;

            let fullPath = ""
            if (driveId === folder._id){
                fullPath = path.join(customDir, folder.name, entry.path)
            }
            else{
                fullPath = path.join(customDir, name, folder.name, entry.path)
            }
           const content = await entry.buffer()
           fs.writeFileSync(fullPath, content)
           saveFiles.push(fullPath)

         }

         if (!saveFiles.length) {
             // delete folder
              throw new Error('Filed to save the images locally');
         }

         const response = await handleImagesSave(folder, saveFiles, folders, driveId)
        if (!response.success) {
            throw new Error(response.error);
        }

        if (annotationsEntry) {
            try {
                const content = await annotationsEntry.buffer();
                const jsonContent = JSON.parse(content.toString('utf8'));
                await handleBatchAnnotationsDownload(jsonContent)
            } catch (err) {
                console.error('Error reading or parsing annotationData.json:', err.message);
            }
        }

        // 3️⃣ Remove ZIP after extraction
        fs.unlinkSync(filePath);

        return {
          success: true,
          folderId: folder._id,
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

ipcMain.handle('fileDownload:downloadImageAnnotations', async (event, pair) => {
   return await handleBatchAnnotationsDownload([pair])
    // return await handleAnnotationsDownload(object, fileId)
})