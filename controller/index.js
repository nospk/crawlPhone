const Shopee = require('../core/shopee-web');
const Tiki = require('../core/tiki-web');
const Lazada = require('../core/lazada-web');
const Sendo = require('../core/sendo-web');
const Common = require('../core/common');
const { dialog } = require('electron');

class Controller {
  constructor(mainWindow, dirFile) {
    this.dirFile = dirFile
    this.mainWindow = mainWindow;
    this.running = true;
  }
  sendLogs(type, msg) {
    this.mainWindow.webContents.send(type, msg);
  }
  stop() {
    this.running = false;
  }
  async runShopee(keyword, delayMin, delayMax, pageMax) {
    this.running = true;
    let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
    const shopee = new Shopee(keyWordRemoveTons, delayMin, delayMax, pageMax, this.dirFile);
    try {
      this.sendLogs("notification-logs", "Open file");
      await shopee.readFileExcel()
      this.sendLogs("notification-logs", "Open chrome");
      await shopee.openChrome()
      this.sendLogs("notification-logs", "Login");
      await shopee.loginShopee()
      await Common.waitFor(5000);
      this.sendLogs("notification-logs", "Running Shopee");
      while (this.running && shopee.currentPage < shopee.pageMax) {
        await shopee.openPage(keyword)
        this.sendLogs("notification-logs", "Crawl Page " + shopee.currentPage);
        await Common.waitFor(1000);
        let crawlItemsInPage = await shopee.getItemsInPage()
        for (let i = 0; i < crawlItemsInPage.length; i++) {
          if (this.running) {
            this.sendLogs("notification-status", { status: "Đang hoạt động", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: i });
            let linkProduct = `https://shopee.vn/${keyWordRemoveTons}-i.${crawlItemsInPage[i].idShop}.${crawlItemsInPage[i].itemId}`

            let index = shopee.dataList.length > 0 ? shopee.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
            if (index != -1) {
              let check = shopee.dataList[index].linkProduct.length > 0 ? shopee.dataList[index].linkProduct.findIndex(item => item == linkProduct) : -1;
              if (check == -1) shopee.dataList[index].linkProduct.push(linkProduct)
            } else {
              let item = await shopee.getInfoItem(crawlItemsInPage[i].itemId, crawlItemsInPage[i].idShop)
              if (item.phoneShop == null) {
                item.phoneShop = await shopee.getInfoShop(item.linkShop)
              }
              if (item.phoneShop == null) {
                item.phoneGoogle = await shopee.searchGoogle(item.nameShop)
                console.log(item.phoneGoogle)
              }
              shopee.dataList.push({ nameShop: item.nameShop, linkShop: item.linkShop, from: item.from, phoneShop: [item.phoneShop], linkProduct: [linkProduct], idShop: crawlItemsInPage[i].idShop, phoneGoogle: [item.phoneGoogle] })
            }
            await shopee.writeFileExcel();
          } else {
            break;
          }
        }
      }
      this.sendLogs("notification-logs", "Stop Shopee");
      this.sendLogs("notification-status", { status: "Kết thúc", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: 0 });
      shopee.browser.close();
    } catch (err) {
      console.log(err)
      dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
      this.sendLogs("notification-logs", "Stop Shopee");
      this.sendLogs("notification-status", { status: "Lỗi", shopNumber: shopee.dataList.length, pageNumber: shopee.currentPage, productNumber: 0 });
      this.sendLogs("notification-error", err);
      shopee.browser.close();
    }
  }
  async runTiki(keyword, delayMin, delayMax, pageMax) {
    this.running = true;
    let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
    const tiki = new Tiki(keyWordRemoveTons, delayMin, delayMax, pageMax, this.dirFile);
    try {
      this.sendLogs("notification-logs", "Open file");
      await tiki.readFileExcel()
      this.sendLogs("notification-logs", "Open chrome");
      await tiki.openChrome()
      //this.sendLogs("notification-logs", "Login");
      //await tiki.loginTiki()
      await Common.waitFor(5000);
      this.sendLogs("notification-logs", "Running Tiki");
      while (this.running && tiki.currentPage < tiki.pageMax) {
        this.sendLogs("notification-logs", "Crawl Page " + tiki.currentPage);
        await tiki.openPage(keyword)
        await Common.waitFor(1000);
        let crawlItemsInPage = await tiki.getItemsInPage()
        for (let i = 0; i < crawlItemsInPage.length; i++) {
          if (this.running) {
            this.sendLogs("notification-status", { status: "Đang hoạt động", shopNumber: tiki.dataList.length, pageNumber: Number(tiki.currentPage) - 1, productNumber: i });
            let linkProduct = `https://tiki.vn/${keyWordRemoveTons}-p${crawlItemsInPage[i].itemId}.html`

            let index = tiki.dataList.length > 0 ? tiki.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
            if (index != -1) {
              let check = tiki.dataList[index].linkProduct.length > 0 ? tiki.dataList[index].linkProduct.findIndex(item => item == linkProduct) : -1;
              if (check == -1) tiki.dataList[index].linkProduct.push(linkProduct)
            } else {
              let phoneGoogle = await tiki.searchGoogle(crawlItemsInPage[i].nameShop)
              let linkShop = `https://tiki.vn/cua-hang/${Common.getLinkFromName(crawlItemsInPage[i].nameShop)}`
              tiki.dataList.push({
                nameShop: crawlItemsInPage[i].nameShop,
                linkShop: linkShop,
                from: '',
                phoneShop: [],
                linkProduct: [linkProduct],
                idShop: crawlItemsInPage[i].idShop,
                phoneGoogle: [phoneGoogle]
              })
            }
            await tiki.writeFileExcel();
            let randomnumber = Math.floor(Math.random() * (Number(tiki.delayMax) - Number(tiki.delayMin) + 1)) + Number(tiki.delayMin);
            await Common.waitFor(randomnumber * 1000);
          } else {
            break;
          }
        }
      }
      this.sendLogs("notification-logs", "Stop Tiki");
      this.sendLogs("notification-status", { status: "Kết thúc", shopNumber: tiki.dataList.length, pageNumber: Number(tiki.currentPage) - 1, productNumber: 0 });
      tiki.browser.close();
    } catch (err) {
      console.log(err)
      dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
      this.sendLogs("notification-logs", "Stop Tiki");
      this.sendLogs("notification-status", { status: "Lỗi", shopNumber: tiki.dataList.length, pageNumber: Number(tiki.currentPage) - 1, productNumber: 0 });
      this.sendLogs("notification-error", err);
      tiki.browser.close();
    }
  }
  async runLazada(keyword, delayMin, delayMax, pageMax) {
    this.running = true;
    let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
    const lazada = new Lazada(keyWordRemoveTons, delayMin, delayMax, pageMax, this.dirFile);
    try {
      this.sendLogs("notification-logs", "Open file");
      await lazada.readFileExcel()
      this.sendLogs("notification-logs", "Open chrome");
      await lazada.openChrome()
      //this.sendLogs("notification-logs", "Login");
      //await lazada.loginLazada()
      await Common.waitFor(5000);
      this.sendLogs("notification-logs", "Running Lazada");
      while (this.running && lazada.currentPage < lazada.pageMax) {
        this.sendLogs("notification-logs", "Crawl Page " + lazada.currentPage);
        await lazada.openPage(keyword)
        await Common.waitFor(1000);
        let crawlItemsInPage = await lazada.getItemsInPage()
        for (let i = 0; i < crawlItemsInPage.length; i++) {
          if (this.running) {
            this.sendLogs("notification-status", { status: "Đang hoạt động", shopNumber: lazada.dataList.length, pageNumber: Number(lazada.currentPage) - 1, productNumber: i });
            let linkProduct = `https://lazada.vn/products/${keyWordRemoveTons}-i${crawlItemsInPage[i].itemId}.html`

            let index = lazada.dataList.length > 0 ? lazada.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
            if (index != -1) {
              let check = lazada.dataList[index].linkProduct.length > 0 ? lazada.dataList[index].linkProduct.findIndex(item => item == linkProduct) : -1;
              if (check == -1) lazada.dataList[index].linkProduct.push(linkProduct)
            } else {
              let linkShop = await lazada.getLinkShop(linkProduct)
              linkShop = `https://www.${linkShop.split('www.')[1]}`
              let phoneShop = await lazada.getPhoneShop(linkShop)
              let phoneGoogle
              if (phoneShop == null) {
                phoneGoogle = await lazada.searchGoogle(crawlItemsInPage[i].nameShop)
              }
              lazada.dataList.push({
                nameShop: crawlItemsInPage[i].nameShop,
                linkShop: linkShop,
                from: crawlItemsInPage[i].from,
                phoneShop: [phoneShop],
                linkProduct: [linkProduct],
                idShop: crawlItemsInPage[i].idShop,
                phoneGoogle: [phoneGoogle]
              })
            }
            await lazada.writeFileExcel();
          } else {
            break;
          }
        }
      }
      this.sendLogs("notification-logs", "Stop Lazada");
      this.sendLogs("notification-status", { status: "Kết thúc", shopNumber: lazada.dataList.length, pageNumber: Number(lazada.currentPage) - 1, productNumber: 0 });
      lazada.browser.close();
    } catch (err) {
      console.log(err)
      dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
      this.sendLogs("notification-logs", "Stop lazada");
      this.sendLogs("notification-status", { status: "Lỗi", shopNumber: lazada.dataList.length, pageNumber: Number(lazada.currentPage) - 1, productNumber: 0 });
      this.sendLogs("notification-error", err);
      lazada.browser.close();
    }
  }
  async runSendo(keyword, delayMin, delayMax, pageMax) {
    this.running = true;
    let keyWordRemoveTons = Common.removeVietnameseTones(keyword);
    const sendo = new Sendo(keyWordRemoveTons, delayMin, delayMax, pageMax, this.dirFile);
    try {
      this.sendLogs("notification-logs", "Open file");
      await sendo.readFileExcel()
      this.sendLogs("notification-logs", "Open chrome");
      await sendo.openChrome()
      //this.sendLogs("notification-logs", "Login");
      //await sendo.loginSendo()
      await Common.waitFor(5000);
      this.sendLogs("notification-logs", "Running sendo");
      while (this.running && sendo.currentPage < sendo.pageMax) {
        await sendo.openPage(keyword)
        this.sendLogs("notification-logs", "Crawl Page " + sendo.currentPage);
        await Common.waitFor(1000);
        let crawlItemsInPage = await sendo.getItemsInPage()
        for (let i = (Number(sendo.currentPage)-1) * 60; i < crawlItemsInPage.length; i++) {
          if (this.running) {
            this.sendLogs("notification-status", { status: "Đang hoạt động", shopNumber: sendo.dataList.length, pageNumber: sendo.currentPage, productNumber: i });
            let linkProduct = `https://sendo.vn/${keyWordRemoveTons}-${crawlItemsInPage[i].itemId}.html`

            let index = sendo.dataList.length > 0 ? sendo.dataList.findIndex(item => item.idShop == crawlItemsInPage[i].idShop) : -1;
            if (index != -1) {
              let check = sendo.dataList[index].linkProduct.length > 0 ? sendo.dataList[index].linkProduct.findIndex(item => item == linkProduct) : -1;
              if (check == -1) sendo.dataList[index].linkProduct.push(linkProduct)
            } else {
              let infoShop = await sendo.getInfoShop(linkProduct)
              sendo.dataList.push({
                nameShop: crawlItemsInPage[i].nameShop,
                linkShop: infoShop.linkShop,
                from: infoShop.from,
                phoneShop: [infoShop.phoneNumber],
                linkProduct: [linkProduct],
                idShop: crawlItemsInPage[i].idShop,
                phoneGoogle: []
              })
            }
            await sendo.writeFileExcel();
          } else {
            break;
          }
        }
        
      }
      this.sendLogs("notification-logs", "Stop sendo");
      this.sendLogs("notification-status", { status: "Kết thúc", shopNumber: sendo.dataList.length, pageNumber: sendo.currentPage, productNumber: 0 });
      sendo.browser.close();
    } catch (err) {
      console.log(err)
      dialog.showErrorBox("Lỗi", "Vui lòng kiểm tra")
      this.sendLogs("notification-logs", "Stop sendo");
      this.sendLogs("notification-status", { status: "Lỗi", shopNumber: sendo.dataList.length, pageNumber: sendo.currentPage, productNumber: 0 });
      this.sendLogs("notification-error", err);
      sendo.browser.close();
    }
  }
}
module.exports = Controller;