const Shopee = require('../core/shopee');
const Common = require('../core/common');
const {dialog } = require('electron');

class Controller {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  async runShopee(keyword, delayMin, delayMax, pageMax, dirFile) {
    this.running = true;
    let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
    const shopee = new Shopee(keyWordRemoveTons, delayMin, delayMax, pageMax, dirFile);
    try {
      this.mainWindow.webContents.send("notification-running", "Open file");
      await shopee.readFileExcel()
      this.mainWindow.webContents.send("notification-running", "Open chrome");
      await shopee.openChrome()
      this.mainWindow.webContents.send("notification-running", "Login");
      await shopee.loginShopee()
      await Common.waitFor(5000);
      this.mainWindow.webContents.send("notification-running", "Running Shopee");
      while (this.running && shopee.currentPage < shopee.pageMax) {
        await shopee.openPage(keyword)
        this.mainWindow.webContents.send("notification-running", "Crawl Page " + shopee.currentPage);
        await Common.waitFor(1000);
        let crawlItemsInPage = await shopee.getItemsInPage()
        for (let i = 0; i < crawlItemsInPage.length; i++) {
          if (this.running) {
            this.mainWindow.webContents.send("notification-status", { status: "Đang hoạt động", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: i });
            let linkProduct = `https://shopee.vn/${keyWordRemoveTons}-i.${crawlItemsInPage[i].idShop}.${crawlItemsInPage[i].itemId}`

            let index = shopee.dataList.length > 0 ? shopee.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
            if (index != -1) {
              shopee.dataList[index].linkProduct.push(linkProduct)
            } else {
              let item = await shopee.getInfoItem(crawlItemsInPage[i].itemId, crawlItemsInPage[i].idShop)
              shopee.dataList.push({ nameShop: item.nameShop, linkShop: item.linkShop, from: item.from, linkProduct: [linkProduct], idShop: crawlItemsInPage[i].idShop })
            }
            await shopee.writeFileExcel();
          } else {
            break;
          }
        }
      }
      this.mainWindow.webContents.send("notification-running", "Stop Shopee");
      this.mainWindow.webContents.send("notification-status", { status: "Kết thúc", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: 0 });
      shopee.browser.close();
    } catch (err) {
      console.log(err)
      dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
      this.mainWindow.webContents.send("notification-running", "Stop Shopee");
      this.mainWindow.webContents.send("notification-status", { status: "Lỗi", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: 0 });
      this.mainWindow.webContents.send("notification-error", err);
      shopee.browser.close();
    }
  }
}
module.exports = Controller;