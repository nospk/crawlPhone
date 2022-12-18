const ExcelJS = require('exceljs');
const Common = require('./common');
const path = require('path');
const Browser = require('./browser');
class LazadaWeb extends Browser {
    dataList = [];
    currentPage = 1;
    constructor(keyword, delayMin, delayMax, pageMax, dirFile) {
        super();
        this.keyword = keyword;
        this.delayMin = delayMin;
        this.delayMax = delayMax;
        this.pageMax = Number(pageMax) + 1;
        this.dirFile = dirFile
    }
    readDataList() {
        return this.dataList.length + ' ' + this.listProductCrawled.length;
    }
    readFileExcel() {
        return new Promise(async (resolve) => {
            try {
                const pathExcel = path.join(this.dirFile, `./${this.keyword}_lazada.xlsx`);
                const workbook = new ExcelJS.Workbook();
                let data = await workbook.xlsx.readFile(pathExcel);
                let worksheet = data.getWorksheet("My Sheet")
                let dataList = []
                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                    dataList.push({
                        nameShop: row.values[1],
                        idShop: row.values[2],
                        phoneShop: row.values[3].split(';'),
                        linkShop: row.values[5], from: row.values[6],
                        linkProduct: row.values[8].split(';'),
                        phoneGoogle: row.values[9].split(';')
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
                const pathExcel = path.join(this.dirFile, `./${this.keyword}_lazada.xlsx`);
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
                    "Số điện thoại Goolge",
                ]
                for (let i = 0; i < data.length; i++) {
                    worksheet.getCell(`A${i + 2}`).value = data[i].nameShop;
                    worksheet.getCell(`B${i + 2}`).value = data[i].idShop;
                    worksheet.getCell(`C${i + 2}`).value = data[i].phoneShop.toString().replace(/,/g, ";");
                    worksheet.getCell(`E${i + 2}`).value = data[i].linkShop;
                    worksheet.getCell(`F${i + 2}`).value = data[i].from;
                    worksheet.getCell(`H${i + 2}`).value = data[i].linkProduct.toString().replace(/,/g, ";");
                    worksheet.getCell(`I${i + 2}`).value = data[i].phoneGoogle.toString().replace(/,/g, ";");
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
    async loginLazada() {
        await this.browserPage.bringToFront();
        let link = 'https://member.lazada.vn/user/login';
        await this.browserPage.goto(link, { waitUntil: "networkidle2" });
        await Common.waitFor(2000);
        await this.browserPage.evaluate(async () => {
            const USER = 'thaibinh1729@gmail.com';
            const PASSWORD = 'Ngocminh123';
            let inputUser = document.querySelector('input[placeholder="Vui lòng nhập số điện thoại hoặc email của bạn"]');
            let userValue = inputUser.value;
            inputUser.value = USER;
            let event = new Event('input', { bubbles: true });
            event.simulated = true;
            let trackerUser = inputUser._valueTracker;
            if (trackerUser) {
                trackerUser.setValue(userValue);
            }
            inputUser.dispatchEvent(event);
            let inputPass = document.querySelector('input[type="password"]');
            let userPass = inputPass.value;
            inputPass.value = PASSWORD;
            let trackerPass = inputPass._valueTracker;
            if (trackerPass) {
                trackerPass.setValue(userPass);
            }
            inputPass.dispatchEvent(event);
            Array.prototype.slice.call(document.querySelectorAll('button'))
                .filter(function (el) {
                    return el.textContent === 'ĐĂNG NHẬP'
                })[0].click();
        })
    }
    async openPage(keyword) {
        let linkquery = 'https://www.lazada.vn/catalog/?q=' + keyword + '&page=' + this.currentPage;
        this.currentPage = this.currentPage + 1;
        await this.browserPage.bringToFront();
        await this.browserPage.goto(linkquery, { waitUntil: "networkidle2" });
    }
    async getItemsInPage() {
        await this.browserPage.bringToFront();
        let displayItems = await this.browserPage.evaluate(async () => {
            await new Promise(r => setTimeout(r, 5000));
            return Object.entries(document.querySelector("div[data-qa-locator='general-products']"))[0][1].return.memoizedProps.items
        });
        let data = displayItems.map(element => {
            return { itemId: element.itemId, idShop: element.sellerId, nameShop: element.sellerName, from: element.location }
        })
        return data
    }
    async getLinkShop(linkProduct) {
        await this.browserProduct.bringToFront();
        await this.browserProduct.goto(linkProduct, { waitUntil: "networkidle2" });
        let data = await this.browserProduct.evaluate(async (delayMax, delayMin) => {
            let randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
            await new Promise(r => setTimeout(r, randomnumber * 1000));
            let linkShop = Object.entries(document.getElementsByClassName('seller-link')[0])[0][1].memoizedProps.children.props.href.split('?')[0]
            return linkShop
        }, this.delayMax, this.delayMin);
        return data
    }
    async getPhoneShop(linkShop) {
        await this.browserProduct.bringToFront();
        await this.browserProduct.goto(linkShop, { waitUntil: "networkidle2" });
        let data = await this.browserProduct.evaluate(async (delayMax, delayMin) => {
            let phoneDetect = /(\84|0)+(([\d][.,]*){9})/g;
            let randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
            let phoneNumber;
            await new Promise(r => setTimeout(r, randomnumber * 1000));

            phoneNumber = document.getElementsByClassName('pi-layout-container')[2].innerText.match(phoneDetect)
            if(phoneNumber == null){
                phoneDetect = /(\84|0)+(([\d] *){9})/g;
                phoneNumber = document.getElementsByClassName('pi-layout-container')[2].innerText.match(phoneDetect)
            }
            return phoneNumber;
        }, this.delayMax, this.delayMin);
        return data
    }

}
module.exports = LazadaWeb;