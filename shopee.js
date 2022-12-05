const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const KEY_WORD = 'sen đá';
let listExcel = [{
    "Tên Shop": '',
    "Số điện thoại": '',
    "Email": '',
    "Link Web": '',
    "Khu vực": '',
    "Địa chỉ": '',
    "Link Sản phẩm": ''
}];
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
    return new Promise(async (resolve,reject) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('My Sheet');
            const r3 = worksheet.getColumn(1);
            r3.values = data
            workbook.xlsx
                .writeFile(`./${nameFile}_shopee.xlsx`)
                .then(() => {
                    console.log('file created');
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
            resolve(data)
        } catch (e) {
            resolve(null)
        }
    });
};

// const readFileExcel = async (collumn) => {
//   await workbook.xlsx.readFile("./thongtinsendo.xlsx");
//   const worksheet = workbook.getWorksheet("Sheet1");
//   let listShopName = worksheet.getColumn(collumn).values;
//   listShopName.shift()
//   listShopName.shift()
//   return listShopName
// }

const runShopee = async () => {
    let keyword = removeVietnameseTones(KEY_WORD);
    listExcel = await readFileExcel(keyword);
    if (listExcel == null) console.log('Chưa có data')
    const width = 1500
    const height = 1500

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [`--window-size=${width},${height}`]
    });
    let listAddress = [
        'https://shopee.vn/search?keyword=sen%20%C4%91%C3%A1'
    ]
    const pages = await browser.pages();
    const page = pages[0];
    await page.goto(listAddress[0], { waitUntil: "networkidle2" });
    let dataList = await page.evaluate(async () => {
        let dataList = []
        let listProduct = document.getElementsByClassName("shopee-search-item-result__items")[0].children
        await new Promise(r => setTimeout(r, 3000));

        console.log(listProduct)
        for (let j = 0; j < listProduct.length; j++) {
            let data = listProduct[j].children[0].href
            await new Promise(r => setTimeout(r, 200));
            dataList.push(data)
        }
        document.getElementsByClassName("shopee-button-no-outline")[0].click()
        await new Promise(r => setTimeout(r, 3000));
        listProduct = document.getElementsByClassName("shopee-search-item-result__items")[0].children
        for (let j = 0; j < listProduct.length; j++) {
            let data = listProduct[j].children[0].href
            await new Promise(r => setTimeout(r, 200));
            dataList.push(data)
        }
        return dataList
    });
    console.log(dataList)
    writeFileExcel(keyword,dataList)
    //browser.close();
}
runShopee()