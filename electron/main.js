import { app, BrowserWindow, ipcMain, dialog, session, protocol, shell} from "electron";
import { writeFile, readFile, access, mkdir, rename, rm, stat } from 'fs/promises'
import updater from "electron-updater";
import { spawn } from "child_process";
import path from "path";
import packageJson from "../package.json" with { type: "json" };
import fs from 'fs'
import { fileURLToPath } from "url";
import { savePath, loadPath } from './repositories/storage.js'
import unzipper from "unzipper"
import {
    addDataJson, convertFilePathToBase64,
    createPhysicalFolder,
    deleteFile,
    generateObjectId,
    getAllAnnotations,
    getAnnotatorFeedback,
    getDataFile,
    getDataJson, getInstructions,
    getMyFeedback,
    getMyImageAnnotations,
    handleAnnotationsDownload,
    handleBatchAnnotationsDownload,
    handleImagesSave,
    handleImagesUpload,
    handleImageUpload, handleInstructionsDownload,
    renameFolder,
    saveAnnotations,
    saveFeedback, saveInstructions,
    transferFile,
    transferFiles, updateFiles
} from './repositories/fileManagement.js'
import https from "https";

import { runInference } from "./repositories/inference.js"
import ScrcpyManager from "./repositories/scrcpy-manager.js";
import AdbManager from "./repositories/adbManager.js";
import AdbInstaller from "./repositories/adbInstaller.js";
import SimpleAdb from "./repositories/simple-adb.js"
import PythonRepository from "./repositories/python/pythonRepository.js";
import PythonDependencyRepository from "./repositories/python/pythonDependencyRepository.js";
import PythonInferenceRepository from "./repositories/python/pythonInferenceRepository.js";
import ModelRepository from "./repositories/model/modelRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setName("Microscopy Teaching Aid");
app.setVersion(packageJson.version)

// console.log("Electron started:", new Date().toLocaleTimeString());
// console.log("Main process path:", __filename);

const version= app.getVersion();
// console.log("APP VERSION:", version);

// new changes for me

const { autoUpdater } = updater;
autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;

let mainWindow

// console.log("BEFORE AdbManager");
// const adbManager = new AdbManager();
let adbInstaller = null;
let adbManager = null;

let adbInstallationInProgress = false;

let adbState = {
    status: 'checking',
    message: 'Checking ADB installation...',
    step: 'check',
    percent: 0,
    error: null,
    logs: []
};

// console.log("AFTER AdbManager");

// console.log("BEFORE ScrcpyManager");
const scrcpyManager = new ScrcpyManager();
// console.log("AFTER ScrcpyManager");

let simpleAdbJson;

// console.log("BEFORE PythonRepository");
const pythonRepository = new PythonRepository();
// console.log("AFTER PythonRepository");

// console.log("BEFORE ModelRepository");
const modelRepository = new ModelRepository();
// console.log("AFTER ModelRepository");

async function createWindow() {
  mainWindow = new BrowserWindow({
    // width: 1200,
    // height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize()

  // Vite dev server
  // console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3009');
  } else {

    protocol.registerFileProtocol('file', (request, callback) => {
      const url = request.url.replace('file:///', '');
      callback({ path: path.join(__dirname, '..', url) });
    });


    // Use built files in production
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch(err => console.error(err));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

app.whenReady().then(async () => {

    // console.log('[APP] Electron application starting...');

    adbInstaller = new AdbInstaller(app);

    adbManager = new AdbManager(
        adbInstaller.getAdbExecutable()
    );

    registerAdbHandlers();

    createWindow()

    // autoUpdater.checkForUpdates();
    if(mainWindow) {
        mainWindow.webContents.once('did-finish-load', async () => {
            // console.log('[APP] React renderer loaded.');
            // console.log('[APP] Starting ADB initialization...');

            const dir = loadPath();

            // await initializeAdb()
            if (dir) {
                simpleAdbJson = new SimpleAdb(mainWindow, dir);
            }

            autoUpdater.checkForUpdates();
        });
    }
});

app.on("window-all-closed", () => {
   if (simpleAdbJson) {
     simpleAdbJson.stopPolling()
  }
  if (process.platform !== "darwin") {
      app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

ipcMain.on('app:close', () => {
    if (simpleAdbJson) {
         simpleAdbJson.stopPolling()
    }
    app.quit();
});

ipcMain.handle('adb:check-internet', async () => {
    return await adbInstaller.checkInternetConnection();
});

ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

ipcMain.handle("dialog:openImage", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            {
                name: "Images",
                extensions: ["jpg", "jpeg", "png", "webp", "bmp"]
            }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    const filePath = result.filePaths[0];

    return convertFilePathToBase64(filePath)
});

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
  return await handleImagesUpload(result.filePaths)
})

ipcMain.handle('dialog:openOneImagePicker', async () => {

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

  if (result.canceled || result.filePaths.length === 0) return null;
  // console.log(parentId)
  // return handleImageUpload(result.filePaths[0])
    return handleImagesUpload(result.filePaths)
})

ipcMain.handle('electron:savePath', (event, folderPath) => {
  savePath(folderPath);
  return true;
});

ipcMain.handle('electron:getPath', () => {
  return loadPath();
});

export async function createFolder(name, parentId, _id = generateObjectId()) {
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

ipcMain.handle('fileManagement:getFoldersAndFiles', async (event, parentId) => {
  const dir = loadPath()
  return  await getDataJson(`${dir}/Microscopy_TA/database/database.json`, parentId)
})

ipcMain.handle('fileManagement:getFile', async (event, fileId, credentials) => {
  const dir = loadPath()
  return  await getDataFile(`${dir}/Microscopy_TA/database/database.json`, fileId, credentials)

})

ipcMain.handle('fileManagement:transferFile', async (event, fileId, type) => {
  return  await transferFile(fileId, type)
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
                // console.log('File already exists, canceling download:', savePath);
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
                    // console.log(savePath)
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
                // console.log('Zipped File already exists, canceling download:', savePath);
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
                    // console.log(savePath)
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

ipcMain.handle('fileDownload:saveZip', async (_, buffer, cat, cred) => {
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

        const instructionsEntry = directory.files.find(entry =>
            entry.type === 'File' && entry.path.endsWith('instructions.json')
        )

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
            if (entry.path.endsWith('instructions.json')) continue;

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
                await handleBatchAnnotationsDownload(jsonContent, cred)
            } catch (err) {
                console.error('Error reading or parsing annotationData.json:', err.message);
            }
        }

        if (instructionsEntry) {
            try {
                const content = await instructionsEntry.buffer();
                const jsonContent = JSON.parse(content.toString('utf8'));
                if (!!jsonContent.length){
                    await handleInstructionsDownload(jsonContent)
                }
            } catch (err) {
                console.error('Error reading or parsing instructions.json:', err.message);
            }
        }

        // 3️⃣ Remove ZIP after extraction
        fs.unlinkSync(filePath);

        return {
          success: true,
          folderId: folder._id,
          message: "Files extracted successfully",
        };
        // return {
        //   success: true,
        //   folderId: "sdsdfsdfsadfasdfsdfsdf",
        //   message: "Files extracted successfully asdsdasdasasdsdasd",
        // };
    }
    catch (error) {
        console.error(error);
        return {
            success: false,
            error: error.message || "Failed to extract ZIP",
        };
  }
});

ipcMain.handle('fileDownload:downloadImageAnnotations', async (event, pair, cred) => {
   return await handleBatchAnnotationsDownload([pair], cred)
    // return await handleAnnotationsDownload(object, fileId)
})

ipcMain.handle('instructions:getInstructions', async (event, fileId) => {
    return await getInstructions(fileId)
})

ipcMain.handle('instructions:saveInstructions', async (event, instructions) => {
    return await saveInstructions(instructions)
})

autoUpdater.on("update-available", (info) => {
  // console.log("Update available:", info);
  mainWindow.webContents.send("update-available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
  })
});

ipcMain.on("download-update", () => {
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-downloaded", () => {
  // console.log("Update downloaded successfully");

  mainWindow.webContents.send("update-status", {
    status: "downloaded",
    message: "Update downloaded successfully"
  });
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);

  mainWindow.webContents.send("update-status", {
    status: "error",
    message: err?.message || "Update failed"
  });
});

autoUpdater.on("download-progress", (progress) => {
  mainWindow.webContents.send("download-progress", {
    percent: progress.percent,
    bytesPerSecond: progress.bytesPerSecond
  });
});

// Manual download
ipcMain.on("open-download-page", () => {
  shell.openExternal("https://microscopyteachingaid.ocular-project.com/download/69e764bdbaaa263cbcb8c5aa");
});


// Devices
ipcMain.handle('check-adb-installed', async () => {
  return await adbManager.checkAdbInstalled();
});

ipcMain.handle('get-devices', async () => {
  return await adbManager.getDevices();
});

// Python handlers
ipcMain.handle("inference:check", async () => {
    // const pythonRepository = new PythonRepository()

    const exists = pythonRepository.exists()
    // console.log(exists)

    if (!exists) {
        return {
            exists: false
        }
    }

    try {
        const version = await pythonRepository.getVersion()

        return {
            exists: true,
            version
        }
    } catch (error) {
        return {
            exists: true,
            version: null,
            error: error.message
        }
    }
})

ipcMain.handle("inference:check-packages", async () => {
  // const pythonRepository = new PythonRepository();

  if (!pythonRepository.exists()) {
    return {
      success: false,
      error: "Python runtime not found.",
    };
  }

  const dependencyRepository = new PythonDependencyRepository(
    pythonRepository
  );

  const packages = await dependencyRepository.getPackageStatus();

  const missing = packages.filter(
    (packageItem) => !packageItem.installed
  );

  return {
    success: true,
    packages,
    missing,
    allInstalled: missing.length === 0,
  };
});

ipcMain.handle("inference:install-packages", async (event, packages) => {
  // const pythonRepository = new PythonRepository();

  if (!pythonRepository.exists()) {
    return {
      success: false,
      error: "Python runtime not found.",
    };
  }

  if (!Array.isArray(packages) || packages.length === 0) {
    return {
      success: true,
      results: [],
      message: "No packages need to be installed.",
    };
  }

  const dependencyRepository = new PythonDependencyRepository(
    pythonRepository
  );

  try {
    const results = await dependencyRepository.installPackages(
      packages,
      (progress) => {
        event.sender.send("inference:install-progress", progress);
      }
    );

    const failed = results.filter(
      (result) => result.status === "failed"
    );

    return {
      success: failed.length === 0,
      results,
      installed: results.filter(
        (result) => result.status === "success"
      ),
      failed,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("inference:check-internet", async () => {
  return new Promise((resolve) => {
    const request = https.get(
      "https://www.google.com",
      {
        timeout: 5000,
      },
      (response) => {
        response.resume();

        resolve({
          success: response.statusCode >= 200 && response.statusCode < 400,
          statusCode: response.statusCode,
        });
      }
    );

    request.on("error", (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    request.on("timeout", () => {
      request.destroy();

      resolve({
        success: false,
        error: "Internet connection timed out.",
      });
    });
  });
});

ipcMain.handle("inference:run-inference", async (_event, imagePath) => {
    // const pythonRepository = new PythonRepository();

    if (!pythonRepository.exists()) {
      return {
        success: false,
        error: "Python runtime not found."
      };
    }

    try {
      const inferenceRepository =
        new PythonInferenceRepository(
          pythonRepository
        );

      return await inferenceRepository.runInference(imagePath);

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
);

// Model checks and installs
ipcMain.handle("model:get-info", async () => {
    try {
        return await modelRepository.getModelInfo();
    } catch (error) {
        console.error("[MODEL] Failed to get model info:", error);

        throw new Error(
            `Failed to get model information: ${error.message}`
        );
    }
});

ipcMain.handle("model:download", async (event) => {
    try {
        // console.log("[MODEL] Download requested from frontend");

        const result = await modelRepository.download(
            (progress) => {
                if (!mainWindow || mainWindow.isDestroyed()) {
                    return;
                }

                mainWindow.webContents.send(
                    "model:download-progress",
                    progress
                );
            }
        );

        return result;

    } catch (error) {
        console.error(
            "[MODEL] Download failed:",
            error
        );

        throw new Error(
            `Model download failed: ${error.message}`
        );
    }
});


// ------------------------------------
// ADB STATUS MANAGEMENT
// ------------------------------------

function updateAdbState({
    status,
    message,
    step,
    percent,
    error = null
}) {
    adbState = {
        ...adbState,
        status,
        message,
        step,
        percent,
        error
    };

    const log = {
        timestamp: new Date().toISOString(),
        status,
        step,
        message,
        percent,
        error
    };

    adbState.logs = [
        ...adbState.logs,
        log
    ].slice(-100);

    // console.log(`[ADB] ${message}`);

    if (error) {
        console.error(`[ADB ERROR] ${error}`);
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
            'adb:status-changed',
            adbState
        );
    }
}

// ------------------------------------
// ADB INSTALLATION
// ------------------------------------

async function initializeAdb() {
    if (adbInstallationInProgress) {
        return {
            success: false,
            error: 'ADB installation is already running.'
        };
    }

    adbInstallationInProgress = true;

    try {
        updateAdbState({
            status: 'checking',
            step: 'check',
            message: 'Checking whether ADB is installed...',
            percent: 0
        });

        // Check existing ADB installation
        const check = await adbManager.checkAdbInstalled();

        if (check.success) {
            updateAdbState({
                status: 'ready',
                step: 'complete',
                message: 'ADB is already installed and working.',
                percent: 100
            });

            // console.log(
            //     `[APP] Using ADB: ${adbManager.getAdbPath()}`
            // );

            return {
                success: true,
                adbPath: adbManager.getAdbPath(),
                alreadyInstalled: true
            };
        }

        // ADB missing: installation required
        updateAdbState({
            status: 'installing',
            step: 'download',
            message: 'ADB was not found. Preparing Platform Tools download...',
            percent: 0
        });

        // console.log('[APP] Starting automatic ADB installation...');

        // The installer must support this callback for detailed
        // progress events. See the note after the code.
        const installation = await adbInstaller.install({
            onProgress: (progress) => {
                updateAdbState({
                    status: 'installing',
                    step: progress.step,
                    message: progress.message,
                    percent: progress.percent ?? 0
                });
            }
        });

        if (!installation.success) {
            throw new Error(
                installation.error || 'ADB installation failed.'
            );
        }

        // Verify using AdbManager
        updateAdbState({
            status: 'installing',
            step: 'verification',
            message: 'Verifying ADB installation...',
            percent: 95
        });

        const finalCheck = await adbManager.checkAdbInstalled();

        if (!finalCheck.success) {
            throw new Error(
                finalCheck.error || 'ADB verification failed.'
            );
        }

        updateAdbState({
            status: 'ready',
            step: 'complete',
            message: 'ADB installation completed successfully.',
            percent: 100
        });

        // console.log(
        //     `[APP] ADB ready: ${adbManager.getAdbPath()}`
        // );

        return {
            success: true,
            adbPath: adbManager.getAdbPath(),
            alreadyInstalled: false
        };

    } catch (error) {
        updateAdbState({
            status: 'error',
            step: adbState.step,
            message: 'ADB installation failed.',
            error: error.message
        });

        return {
            success: false,
            error: error.message
        };

    } finally {
        adbInstallationInProgress = false;
    }
}

// ------------------------------------
// IPC HANDLERS
// ------------------------------------

function registerAdbHandlers() {

    // Get current installation state
    ipcMain.handle('adb:get-status', () => {
        return adbState;
    });

    // Retry installation
    ipcMain.handle('adb:retry-install', async () => {
        if (adbInstallationInProgress) {
            return {
                success: false,
                error: 'ADB installation is already running.'
            };
        }

        return initializeAdb();
    });

    // Check ADB
    ipcMain.handle('adb:check', async () => {
        return adbManager.checkAdbInstalled();
    });

    // Get connected devices
    // ipcMain.handle('adb:get-devices', async () => {
    //     return adbManager.getDevices();
    // });

    // Execute ADB version check
    ipcMain.handle('adb:get-version', async () => {
        return adbManager.getAdbVersion();
    });

    ipcMain.handle('adb:start-install', async () => {
        return await initializeAdb();
    });

    // Check device shell access
    // ipcMain.handle(
    //     'adb:check-device',
    //     async (_event, deviceId) => {
    //         return adbManager.enableUsbDebugging(deviceId);
    //     }
    // );
}



