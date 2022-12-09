// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs');
const path = require('path');
const Shopee = require('./core/shopee')
const Common = require('./core/common');
let mainWindow
let running = true;



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
      preload: path.join(__dirname, './preload.js'),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./index.html')

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
        runTypeShopee(keyword, delayMin, delayMax, pageMax)
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
        stopShopee()
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

const stopShopee = () => {
  running = false;
}
const runTypeShopee = async (keyword, delayMin, delayMax, pageMax) => {
  running = true;
  let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
  const shopee = new Shopee(keyWordRemoveTons, delayMin, delayMax, pageMax, dirFile);
  try {
    await shopee.readFileExcel()
    mainWindow.webContents.send("notification-running", "Open file");
    await shopee.openChrome()
    mainWindow.webContents.send("notification-running", "Open chrome");
    await shopee.loginShopee()
    mainWindow.webContents.send("notification-running", "Login");
    await Common.waitFor(5000);
    while (running && shopee.currentPage < shopee.pageMax) {
      await shopee.openPage(keyword)
      mainWindow.webContents.send("notification-running", "Crawl Page " + shopee.currentPage);
      await Common.waitFor(1000);
      let crawlItemsInPage = await shopee.getItemsInPage()
      for (let i = 0; i < crawlItemsInPage.length; i++) {
        if (running) {
          mainWindow.webContents.send("notification-status", { status: "Đang hoạt động", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: i });
          let linkProduct = `https://shopee.vn/${keyWordRemoveTons}-i.${crawlItemsInPage[i].idShop}.${crawlItemsInPage[i].itemId}`

          let index = shopee.dataList.length > 0 ? shopee.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
          if (index != -1) {
            shopee.dataList[index].linkProduct.push(linkProduct)
          } else {
            let item = await shopee.getInfoItem(crawlItemsInPage[i].itemId, crawlItemsInPage[i].idShop)
            shopee.dataList.push({ nameShop: item.nameShop, linkShop: item.linkShop, from: item.from, linkProduct: [linkProduct], idShop: crawlItemsInPage[i].idShop })
            let randomnumber = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
            await Common.waitFor(randomnumber * 1000);
          }
          await shopee.writeFileExcel();
        } else {
          break;
        }
      }
    }
    mainWindow.webContents.send("notification-status", { status: "Kết thúc", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: 0 });
    shopee.browser.close();
  } catch (err) {
    dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
    mainWindow.webContents.send("notification-status", { status: "Lỗi", shopNumber: 0, pageNumber: 0, productNumber: 0 });
    mainWindow.webContents.send("notification-error", err);
    shopee.browser.close();
  }
}