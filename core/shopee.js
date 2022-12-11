const ExcelJS = require('exceljs');
const Common = require('./common');
const path = require('path');
const Browser = require('./browser');
class Shopee extends Browser {
    dataList = [];
    currentPage = 0;
    constructor(keyword, delayMin, delayMax, pageMax, dirFile) {
        super();
        this.keyword = keyword;
        this.delayMin = delayMin;
        this.delayMax = delayMax;
        this.pageMax = pageMax;
        this.dirFile = dirFile
    }
    readDataList() {
        return this.dataList.length + ' ' + this.listProductCrawled.length;
    }
    readFileExcel() {
        return new Promise(async (resolve) => {
            try {
                const pathExcel = path.join(this.dirFile, `./${this.keyword}_shopee.xlsx`);
                const workbook = new ExcelJS.Workbook();
                let data = await workbook.xlsx.readFile(pathExcel);
                let worksheet = data.getWorksheet("My Sheet")
                let dataList = []
                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                    dataList.push({ nameShop: row.values[1], idShop: row.values[2], linkShop: row.values[5], from: row.values[6], linkProduct: row.values[8].split(';') })
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
                const pathExcel = path.join(this.dirFile, `./${this.keyword}_shopee.xlsx`);
                let data = this.dataList
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('My Sheet');
                const HEARDER = worksheet.getRow(1);
                HEARDER.values = [
                    "Tên Shop",
                    "Shop Id",
                    "Số điện thoại",
                    "Email",
                    "Link Web",
                    "Khu vực",
                    "Địa chỉ",
                    "Link Sản phẩm",
                ]
                for (let i = 0; i < data.length; i++) {
                    worksheet.getCell(`A${i + 2}`).value = data[i].nameShop;
                    worksheet.getCell(`B${i + 2}`).value = data[i].idShop;
                    worksheet.getCell(`E${i + 2}`).value = data[i].linkShop;
                    worksheet.getCell(`F${i + 2}`).value = data[i].from;
                    worksheet.getCell(`H${i + 2}`).value = data[i].linkProduct.toString().replace(/,/g, ";");
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
    async loginShopee() {
        await this.browserPage.bringToFront();
        let loginShopee = 'https://shopee.vn/buyer/login';
        await this.browserPage.goto(loginShopee, { waitUntil: "networkidle2" });
        await Common.waitFor(2000);
        await this.browserPage.evaluate(async () => {
            const USERSHOPEE = 'bhngocminh.vn';
            const PASSSHOPEE = 'Thanhbinh29';
            let username = document.querySelector('input[name="loginKey"]')
            let password = document.querySelector('input[name="password"]')
            username.setAttribute("value", USERSHOPEE);
            username.dispatchEvent(new Event("change", { bubbles: true }));
            username.dispatchEvent(new Event("blur", { bubbles: true }));
            password.setAttribute("value", PASSSHOPEE);
            password.dispatchEvent(new Event("change", { bubbles: true }));
            password.dispatchEvent(new Event("blur", { bubbles: true }));
            Array.prototype.slice.call(document.querySelectorAll('button'))
                .filter(function (el) {
                    return el.textContent === 'Đăng nhập'
                })[0].click();
        })
    }
    async openPage(keyword) {
        let linkquery = 'https://shopee.vn/search?keyword=' + keyword + '&page=' + this.currentPage;
        this.currentPage = this.currentPage + 1;
        await this.browserPage.goto(linkquery, { waitUntil: "networkidle2" });
    }
    async getItemsInPage() {
        await this.browserPage.bringToFront();
        let displayItems = await this.browserPage.evaluate(async () => {
            await new Promise(r => setTimeout(r, 5000));
            return Object.entries(document.getElementsByClassName("shopee-search-item-result")[0])[0][1].return.memoizedProps.displayItems
        });
        let data = displayItems.map(element => {
            return { itemId: element.itemid, idShop: element.shopid, itemName: element.name.replace(/[\t\r\n]|(--[^\r\n]*)|(\/\*[\w\W]*?(?=\*)\*\/|[/ /])/gi, "-") }
        })
        return data
    }
    async getInfoItem(itemId, idShop) {
        await this.browserProduct.bringToFront();
        let link = `https://shopee.vn/${this.keyword}-i.${idShop}.${itemId}`;
        await this.browserProduct.goto(link, { waitUntil: "networkidle2" });
        let data = await this.browserProduct.evaluate(async (delayMax, delayMin) => {
            let randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
            await new Promise(r => setTimeout(r, randomnumber * 1000));
            let shopInfo = Object.entries(document.getElementsByClassName("page-product__detail")[0])[0][1].memoizedProps.children[0].props.shopInfo
            return { nameShop: shopInfo.name, linkShop: `https://shopee.vn/${shopInfo.account.username}`, from: shopInfo.shop_location }
        }, this.delayMax, this.delayMin);
        return data
    }
}
module.exports = Shopee;