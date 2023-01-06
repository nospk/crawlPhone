const ExcelJS = require('exceljs');
const Common = require('./common');
const path = require('path');
const Browser = require('./browser');
const LISTPOSITION = require('./position');


class GoogleMap extends Browser {
  dataList = [];
  currentPage = 1;
  listPosition = LISTPOSITION;
  position;
  local;
  constructor(keyword, delayMin, delayMax, dirFile) {
    super();
    this.keyword = keyword;
    this.delayMin = delayMin;
    this.delayMax = delayMax;
    this.dirFile = dirFile;
  }
  readFileExcel() {
    return new Promise(async (resolve) => {
      try {
        const pathExcel = path.join(this.dirFile, `./${this.keyword}_ggmap.xlsx`);
        const workbook = new ExcelJS.Workbook();
        let data = await workbook.xlsx.readFile(pathExcel);
        let worksheet = data.getWorksheet("My Sheet")
        let dataList = []
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
          dataList.push({
            nameShop: row.values[1],
            phoneShop: row.values[2],
            email: row.values[3],
            website: row.values[4],
            address: row.values[5],
            from: row.values[6],
            local: row.values[7],
            position: row.values[8]
          })
        });
        //remove header !!! IMPORTANT !!!
        dataList.shift()
        this.dataList = dataList
        resolve()
      } catch (e) {
        resolve()
      }
    });
  };
  writeFileExcel() {
    return new Promise(async (resolve, reject) => {
      try {
        const pathExcel = path.join(this.dirFile, `./${this.keyword}_ggmap.xlsx`);
        let data = this.dataList
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('My Sheet');
        const HEARDER = worksheet.getRow(1);
        HEARDER.values = [
          "Tên Shop",
          "Số điện thoại",
          "Email",
          "Link Web",
          "Địa chỉ",
          "Khu vực",
          "Tên Bản đồ",
          "Vị trí Bản đồ",
        ]
        for (let i = 0; i < data.length; i++) {
          worksheet.getCell(`A${i + 2}`).value = data[i].nameShop;
          worksheet.getCell(`B${i + 2}`).value = data[i].phoneShop;
          worksheet.getCell(`C${i + 2}`).value = data[i].email;
          worksheet.getCell(`D${i + 2}`).value = data[i].website;
          worksheet.getCell(`E${i + 2}`).value = data[i].address;
          worksheet.getCell(`F${i + 2}`).value = data[i].from;
          worksheet.getCell(`G${i + 2}`).value = data[i].local;
          worksheet.getCell(`H${i + 2}`).value = data[i].position;
        }

        workbook.xlsx
          .writeFile(pathExcel)
          .then(() => {
            //console.log('file created');
          })
          .catch(err => {
            console.log(err.message);
          })
        resolve()
      } catch (e) {
        reject(e)
      }
    });
  }
  async openPage(keyword, index) {
    let getPosition = this.listPosition[index]
    this.position = getPosition.position
    this.local = getPosition.local
    let linkquery = 'https://www.google.com/maps/search/' + keyword + '/' + getPosition.geo;
    await this.browserPage.bringToFront();
    await this.browserPage.goto(linkquery, { waitUntil: "networkidle2" });
  }
  async loadPageSearch() {
    let scroll = true
    // console.log(this.WIDTH, this.HEIGHT)
    await this.browserPage.mouse.click(this.WIDTH / 1.5, this.HEIGHT / 5, { button: 'right', clickCount: 1 })
    await this.browserPage.mouse.click(this.WIDTH / 1.5, this.HEIGHT / 5, { button: 'right', clickCount: 1 })
    await Common.waitFor(3000)
    await this.browserPage.click('[aria-label="Tìm kiếm khu vực này"]')
    await Common.waitFor(3000)
    let count = 0;
    while (scroll) {
      count++;
      if (count > 200) {
        await this.browserPage.reload({ waitUntil: "networkidle2" });
        await this.browserPage.mouse.click(this.WIDTH / 1.5, this.HEIGHT / 5, { button: 'right', clickCount: 1 })
        await this.browserPage.mouse.click(this.WIDTH / 1.5, this.HEIGHT / 5, { button: 'right', clickCount: 1 })
        await Common.waitFor(3000)
        await this.browserPage.click('[aria-label="Tìm kiếm khu vực này"]')
        await Common.waitFor(3000)
      }
      await this.browserPage.mouse.move(
        this.WIDTH / 8,
        this.HEIGHT / 2
      );

      await Common.waitFor(2000)
      await this.browserPage.mouse.wheel({ deltaY: 1000 });
      await Common.waitFor(1000)
      await this.browserPage.mouse.wheel({ deltaY: 200 });

      let $parentEmpty = await this.browserPage.$("[role='main']");
      let checkEmpty = await this.browserPage.evaluate(el => el.innerHTML, $parentEmpty);
      if (checkEmpty.indexOf("Không tìm thấy kết quả nào") >= 0) scroll = false


      let $parentList = await this.browserPage.$("[role='feed']");
      let $childsList = await $parentList.$$(':scope > div');
      let checkEndList = await this.browserPage.evaluate(el => el.innerHTML, $childsList.pop());
      if (checkEndList.includes("Bạn đã xem hết danh sách này")) scroll = false

    }
  }
  async getItemsInPage() {
    await this.browserPage.bringToFront();
    let displayItems = await this.browserPage.evaluate(async () => {
      const getShopData = async (index) => {
        document.querySelectorAll('[role="article"]')[index].children[0].click()
        let arrayData = []
        let nameShop, phoneShop, email, website, address, from

        nameShop = document.querySelectorAll('[role="article"]')[index].children[0].ariaLabel // title
        await new Promise(r => setTimeout(r, 5000));
        try {
          if (document.querySelectorAll('[data-tooltip="Sao chép số điện thoại"]').length > 0) {
            phoneShop = document.querySelectorAll('[data-tooltip="Sao chép số điện thoại"]')[0].innerText
          } else {
            throw "Không có số đt"
          }
          if (document.querySelectorAll('[data-tooltip="Mở trang web"]').length > 0) {
            website = document.querySelectorAll('[data-tooltip="Mở trang web"]')[0].href
          }
          if (document.querySelectorAll('[data-tooltip="Sao chép plus code"]').length > 0) {
            from = String(document.querySelectorAll('[data-tooltip="Sao chép plus code"]')[0].innerText.split(/(?<=^\S+)\s/)[1])
          }
          if (document.querySelectorAll('[data-tooltip="Sao chép địa chỉ"]')) {
            address = String(document.querySelectorAll('[data-tooltip="Sao chép địa chỉ"]')[0].innerText)
          }
          arrayData = { nameShop, phoneShop, email, website, from, address }
        } catch (e) {
          console.log("lỗi: ", nameShop)
        }
        return arrayData
      }

      let listShopData = []
      for (var i = 0; i < document.querySelectorAll('[role="article"]').length; i++) {
        let shopData = await getShopData(i)
        if (!shopData.phoneShop) {
          continue
        }
        listShopData.push(shopData)
      }
      return listShopData
    });
    return displayItems
  }
}
module.exports = GoogleMap;


