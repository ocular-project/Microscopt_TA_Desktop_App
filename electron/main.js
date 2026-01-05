import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { savePath, loadPath } from './storage.js'

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

ipcMain.handle('electron:savePath', (event, folderPath) => {
  savePath(folderPath);
  return true;
});

ipcMain.handle('electron:getPath', () => {
  return loadPath();
});