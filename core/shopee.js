const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const Common = require('./common');
const { ipcMain } = require('electron')
class Shopee {
    dataList = [];
    browserPage;
    browserProduct;
    constructor(keyword, delayMin, delayMax, pageMax, mainWindow) {
        this.keyword = keyword;
        this.delayMin = delayMin;
        this.delayMax = delayMax;
        this.pageMax = pageMax;
        this.mainWindow = mainWindow;
    }
    readDataList() {
        return this.dataList;
    }
    readFileExcel() {
        return new Promise(async (resolve) => {
            try {
                const workbook = new ExcelJS.Workbook();
                let data = await workbook.xlsx.readFile(`./${this.keyword}_shopee.xlsx`);
                let worksheet = data.getWorksheet("My Sheet")
                let dataList = []
                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                    dataList.push({ nameShop: row.values[1], linkShop: row.values[4], from: row.values[5], linkProduct: row.values[7].split(';') })
                });
                //remove header !!! IMPORTANT !!!
                dataList.shift()
                this.dataList = dataList
                resolve()
            } catch (e) {
                resolve(null)
            }
        });
    };
    writeFileExcel(nameFile, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('My Sheet');
                const HEARDER = worksheet.getRow(1);
                HEARDER.values = [
                    "Tên Shop",
                    "Số điện thoại",
                    "Email",
                    "Link Web",
                    "Khu vực",
                    "Địa chỉ",
                    "Link Sản phẩm",
                ]
                for (let i = 0; i < data.length; i++) {
                    worksheet.getCell(`A${i + 2}`).value = data[i].nameShop;
                    worksheet.getCell(`D${i + 2}`).value = data[i].linkShop;
                    worksheet.getCell(`E${i + 2}`).value = data[i].from;
                    worksheet.getCell(`G${i + 2}`).value = data[i].linkProduct.toString().replace(/,/g, ";");
                }

                workbook.xlsx
                    .writeFile(`./${nameFile}_shopee.xlsx`)
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
    async openChrome() {
        const WIDTH = 1500
        const HEIGHT = 1500

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [`--window-size=${WIDTH},${HEIGHT}`]
        });
        const pages = await browser.pages();
        this.page = pages[0];
        this.browserProduct = await browser.newPage();
    }
    async loginShopee() {
        await this.page.bringToFront();
        let loginShopee = 'https://shopee.vn/buyer/login';
        await this.page.goto(loginShopee, { waitUntil: "networkidle2" });
        await Common.waitFor(2000);
        await this.page.evaluate(async () => {
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
    async running() {
        try {
            let listProductCrawled = []
            if (this.listExcel != null) {
                this.listExcel.forEach(element => {
                    listProductCrawled.push(element.linkProduct)
                });
            }
            listProductCrawled = listProductCrawled.flat()




            let linkShopee = 'https://shopee.vn/search?keyword=sen%20%C4%91%C3%A1';

            //await installMouseHelper(page);
            await page.goto(linkShopee, { waitUntil: "networkidle2" });

            let dataList = await page.evaluate(async () => {
                let linkList = []
                let listProduct = document.getElementsByClassName("shopee-search-item-result__items")[0].children
                await new Promise(r => setTimeout(r, 3000));


                for (let j = 0; j < listProduct.length; j++) {
                    let data = listProduct[j].children[0].href
                    while (data == null) {
                        window.scrollTo(0, 1000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 2000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 3000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 4000);
                        await new Promise(r => setTimeout(r, 500));
                        data = listProduct[j].children[0].href
                    }
                    linkList.push(data.split('?')[0])
                }
                document.getElementsByClassName("shopee-button-no-outline")[0].click()
                await new Promise(r => setTimeout(r, 3000));
                listProduct = document.getElementsByClassName("shopee-search-item-result__items")[0].children
                for (let j = 0; j < listProduct.length; j++) {
                    let data = listProduct[j].children[0].href
                    while (data == null) {
                        window.scrollTo(0, 1000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 2000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 3000);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, 4000);
                        await new Promise(r => setTimeout(r, 500));
                        data = listProduct[j].children[0].href
                    }
                    linkList.push(data.split('?')[0])
                }
                return linkList
            });

            let listProductCrawlLinks = []
            for (let i = 0; i < dataList.length; i++) {
                if (listProductCrawled.indexOf(dataList[i]) == -1) listProductCrawlLinks.push(dataList[i])
            }
            //console.log(listProductCrawlLinks.length)
            let dataFindByLink = this.listExcel != null ? this.listExcel : [];
            for (let i = 0; i < listProductCrawlLinks.length; i++) {
                await page.goto(listProductCrawlLinks[i], { waitUntil: "networkidle2" });
                let data = await page.evaluate(async () => {
                    window.scrollTo(0, 1000);
                    let randomnumber = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
                    await new Promise(r => setTimeout(r, randomnumber * 1000));
                    let nameShop = document.getElementsByClassName("page-product__shop")[0].children[0].children[1].children[0].textContent;
                    let linkShop = document.getElementsByClassName("page-product__shop")[0].children[0].children[1].children[2].children[1].href.split('?')[0]
                    let elements = Array.from(document.querySelectorAll('label'));
                    let match = elements.find(item => {
                        return item.textContent.includes("Gửi từ");
                    });
                    let from = match.parentElement.children[1].textContent
                    return { nameShop, linkShop, from }
                });
                if (i == 0) {
                    dataFindByLink.push({ nameShop: data.nameShop, linkShop: data.linkShop, from: data.from, linkProduct: [listProductCrawlLinks[i]] })
                } else {
                    let index = dataFindByLink.findIndex(item => item.nameShop == data.nameShop)
                    if (index == -1) dataFindByLink.push({ nameShop: data.nameShop, linkShop: data.linkShop, from: data.from, linkProduct: [listProductCrawlLinks[i]] })
                    else dataFindByLink[index].linkProduct.push(listProductCrawlLinks[i])
                }
                writeFileExcel(keyword, dataFindByLink)
            }
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = Shopee;