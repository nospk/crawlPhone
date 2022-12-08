const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

const KEY_WORD = 'sen đá';

const removeVietnameseTones = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/\s/g, '');
    str = str.trim();
    // Remove punctuations
    // Bỏ dấu câu, kí tự đặc biệt
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    return str;
}

const waitFor = async (time) => {
    await new Promise(r => setTimeout(r, time));
}
const writeFileExcel = (nameFile, data) => {
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
const readFileExcel = (nameFile) => {
    return new Promise(async (resolve) => {
        try {
            const workbook = new ExcelJS.Workbook();
            let data = await workbook.xlsx.readFile(`./${nameFile}_shopee.xlsx`);
            let worksheet = data.getWorksheet("My Sheet")
            let dataList = []
            worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                dataList.push({ nameShop: row.values[1], linkShop: row.values[4], from: row.values[5], linkProduct: row.values[7].split(';') })
            });
            //remove header !!! IMPORTANT !!!
            dataList.shift()

            resolve(dataList)
        } catch (e) {
            resolve(null)
        }
    });
};



const runShopee = async () => {
    try {
        let keyword = removeVietnameseTones(KEY_WORD);
        let listExcel = await readFileExcel(keyword);
        let listProductCrawled = []
        if (listExcel != null) {
            listExcel.forEach(element => {
                listProductCrawled.push(element.linkProduct)
            });
        }
        listProductCrawled = listProductCrawled.flat()

        const WIDTH = 1500
        const HEIGHT = 1500

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [`--window-size=${WIDTH},${HEIGHT}`]
        });
        const pages = await browser.pages();
        const page = pages[0];

        let loginShopee = 'https://shopee.vn/buyer/login';
        await page.goto(loginShopee, { waitUntil: "networkidle2" });
        await waitFor(2000);
        await page.evaluate(async () => {
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
        let dataFindByLink = listExcel != null ? listExcel : [];
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

    //browser.close();
}
runShopee()
//writeFileExcel("senda", [])