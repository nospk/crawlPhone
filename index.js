// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs');
const path = require('path');
const Controller = require('./controller')

let mainWindow
let controller



const dirFile = path.join(app.getPath('userData'), './result');
if (!fs.existsSync(dirFile)) {
  fs.mkdirSync(dirFile);
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 520,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, './controller/preload.js'),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./src/index.html')
  controller = new Controller(mainWindow, dirFile)
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("runCrawl", async (event, args) => {
  try {
    let { typeRun, keyword, delayMin, delayMax, pageMax } = args
    if (typeRun == "false") throw "Chưa chọn nền tảng"
    if (keyword == "") throw "Chưa nhập từ khóa"
    switch (typeRun) {
      case "shopee":
        controller.runShopee(keyword, delayMin, delayMax, pageMax)
        break;
    }
  } catch (err) {
    dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
    mainWindow.webContents.send("notification-error", err);
  }

});
ipcMain.on("stopCrawl", async (event, args) => {
  try {
    let { typeRun } = args
    switch (typeRun) {
      case "shopee":
        controller.stop()
        break;
    }
  } catch (err) {
    dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
    mainWindow.webContents.send("notification-error", err);
  }

});
ipcMain.on("openFolder", async (event, args) => {
  require('child_process').exec(`explorer.exe "${dirFile}"`);
});

