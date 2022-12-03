const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();

const {installMouseHelper} = require('./install-mouse-helper');

const waitFor = async (time) => {
  await new Promise(r => setTimeout(r,time));
}

const saveToExcel = async (allShopData) => {
  await workbook.xlsx.readFile("./thongtinsendo.xlsx");
  const worksheet = workbook.getWorksheet("Sheet1");
  worksheet.addRows(allShopData)
  await workbook.xlsx.writeFile("./thongtinsendo.xlsx");
}

const readFileExcel = async (collumn) => {
  await workbook.xlsx.readFile("./thongtinsendo.xlsx");
  const worksheet = workbook.getWorksheet("Sheet1");
  let listShopName = worksheet.getColumn(collumn).values;
  listShopName.shift()
  listShopName.shift()
  return listShopName
}

(async () => {
  let listShopName = await readFileExcel("A")
  let listLinkProduct = await readFileExcel("G")
  const width = 1500
  const height = 1500

  const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [`--window-size=${width},${height}`]
  });
  let listAddress = [
    'https://www.sendo.vn/tim-kiem?q=sen%20%C4%91%C3%A1'
  ]
  const pages = await browser.pages();
  const page = pages[0];
  let pagesProductDetail = await browser.newPage();
  await page.bringToFront();
  await installMouseHelper(page);
  let listHref = []

  for(var i=0; i< listAddress.length; i++){
    await page.goto(listAddress[i],{ waitUntil: "networkidle2" });
    await waitFor(5000)
    await page.mouse.move(
      width/4,
      height/2
    );
  
    await waitFor(2000)
    await page.mouse.wheel({deltaY: 5000});
    await waitFor(2000)
    await page.mouse.wheel({deltaY: 10000});

    listHref = await page.evaluate(async () => {
      for(var i=0; i< 1; i++){
        await new Promise(r => setTimeout(r,3000));
        document.getElementById("main").children[0].children[0].children[1].children[1].children[2].children[0].children[1].children[0].children[0].children[0].click()
        await new Promise(r => setTimeout(r,2000));
        window.scrollTo(0, 100000);
      }

      let listHref = []
      let listProduct = document.querySelector("main").children[0].children[0].children[1].children[1].children[2].children[0].children[0].children
      for(var j=0; j<listProduct.length; j++){
        listHref.push(listProduct[j].children[0].href)
      }
      return listHref
    })
    let dataShop = []
    let dataShopDetail
    await pagesProductDetail.bringToFront();
    for(var i=0; i< 2; i++){
      let urlExist = false
      await waitFor(4000)
      await pagesProductDetail.goto(listHref[i],{ waitUntil: "networkidle2" });

      linkShop = await pagesProductDetail.evaluate(async () => {
        window.scrollTo(0, 20000);
        await new Promise(r => setTimeout(r,2000));
        return document.querySelectorAll('[aria-label="shop-name"]')[0].href
      })
      for(var j=0; j< dataShop.length; j++){
        if(linkShop == dataShop[j].shop_url){
          dataShop[j].listLink.push(listHref[i])
          urlExist = true
          break;
        }
      }
      if(urlExist){
        break;
      }


      await pagesProductDetail.goto(linkShop,{ waitUntil: "networkidle2" });

      dataShopDetail = await pagesProductDetail.evaluate(async (dataShop) => {
        window.scrollTo(0, 10000);
        await new Promise(r => setTimeout(r,4000));
        
        let getname = window.__INITIAL_STATE__["@"].data.ShopHome._.__active__
        let data = window.__INITIAL_STATE__["@"].data.ShopHome._[getname].data.layout[0].data
        return data
      }, dataShop)
      if(dataShopDetail){
        listLink = []
        listLink.push(listHref[i])
        dataShopDetail.listLink = listLink
        dataShop.push(dataShopDetail)
      }
    }
    console.log(dataShop)
  }
  console.log("100% xong")
  //await browser.close();
})();

  