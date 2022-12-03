const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();

const {installMouseHelper} = require('./install-mouse-helper');

const waitFor = async (time) => {
  await new Promise(r => setTimeout(r,time));
}

const saveToExcel = async (allShopData) => {
  await workbook.xlsx.readFile("./thongtinmaps.xlsx");
  const worksheet = workbook.getWorksheet("Sheet1");
  worksheet.addRows(allShopData)
  await workbook.xlsx.writeFile("./thongtinmaps.xlsx");
}

const readFileExcel = async () => {
  await workbook.xlsx.readFile("./thongtinmaps.xlsx");
  const worksheet = workbook.getWorksheet("Sheet1");
  let listShopName = worksheet.getColumn('A').values;
  listShopName.shift()
  listShopName.shift()
  return listShopName
 }

(async () => {
  let listShopName = await readFileExcel()
  const width = 1500
  const height = 1500
  

  const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [`--window-size=${width},${height}`]
  });
  let listAddress = [
    'https://www.google.com/maps/search/%22sen+%C4%91%C3%A1%22/@9.2850687,105.1536754,11.01z?hl=vi-VN',
  ]
  const pages = await browser.pages();
  const page = pages[0];
  await installMouseHelper(page);
  for(var i=0; i< listAddress.length; i++){
    let scroll = true
    await page.goto(listAddress[i],{ waitUntil: "networkidle2" });
  
    await page.mouse.click(width/2, height/2, {clickCount: 2})
    await page.mouse.click(width/2, height/2, {clickCount: 2})
    await waitFor(3000)
    await page.click('[aria-label="Tìm kiếm khu vực này"]')
    await waitFor(3000)

    while(scroll){
      await page.mouse.move(
        width/8,
        height/2
      );
    
      await waitFor(2000)
      await page.mouse.wheel({deltaY: 1000});
      await waitFor(1000)
      await page.mouse.wheel({deltaY: 200});

      let res = await page.evaluate(async () => {
        let elementList = document.querySelectorAll('[role="feed"]')[0].children
        if(elementList[elementList.length - 1].innerHTML.includes("Bạn đã xem hết danh sách này")){
          return false
        }
        return true
      });
      
      if(!res){
        scroll = false
      }
    }
    //Get Data

    let allShopData = await page.evaluate(async (listShopName) => {
      const getShopData = async (index) => {
        document.querySelectorAll('[role="article"]')[index].children[0].click()
        let arrayData = []
        let shopName = ""
        let shopPhone = ""
        let shopEmail = ""
        let shopWeb = ""
        let shopArea = ""
        let shopAddress = ""
        
        shopName = document.querySelectorAll('[role="article"]')[index].children[0].ariaLabel // title
        if(listShopName.includes(shopName)){
          return false
        }

        await new Promise(r => setTimeout(r,5000));
        try{
          if(document.querySelectorAll('[data-value="Sao chép số điện thoại"]').length > 0){
            shopPhone = document.querySelectorAll('[data-value="Sao chép số điện thoại"]')[0].parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[1].children[0].textContent
          }
  
          if(document.querySelectorAll('[data-value="Sao chép trang web"]').length > 0){
            shopWeb = document.querySelectorAll('[data-value="Sao chép trang web"]')[0].parentElement.parentElement.parentElement.parentElement.children[1].href
          }
  
          if(document.querySelectorAll('[data-value="Sao chép plus code"]').length > 0){
            shopArea = document.querySelectorAll('[data-value="Sao chép plus code"]')[0].parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[1].children[0].textContent
            shopArea = shopArea.replace(" ", "***")
            shopArea = shopArea.split("***")[1]
          }
  
          if(document.querySelectorAll('[data-value="Sao chép địa chỉ"]')){
            shopAddress = document.querySelectorAll('[data-value="Sao chép địa chỉ"]')[0].parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[1].children[0].textContent
          }
        }catch(e){
          console.log("lỗi: ", shopName)
        }


        arrayData = [shopName, shopPhone, shopEmail, shopWeb, shopArea, shopAddress]
        return arrayData
      }

      let listShopData = []
      for(var i=0; i< document.querySelectorAll('[role="article"]').length; i++){
        let shopData = await getShopData(i)
        if(!shopData){
          continue
        }
        listShopData.push(shopData)
      }
      return listShopData
    }, listShopName);
    console.info("🚀 ~ file: ggmaps.js ~ line 135 ~ allShopData", allShopData)
    await saveToExcel(allShopData)
    console.log("Xong ", i + 1)
    await waitFor(5000)
  }
  console.log("100% xong")
  //await browser.close();
})();

  