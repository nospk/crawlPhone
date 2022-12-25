const chromePaths = require('chrome-paths');
const puppeteer = require('puppeteer-core');
class Browser {
    browser;
    browserPage;
    browserProduct;
    WIDTH = 1200;
    HEIGHT = 1200;
    constructor() {
    }
    async openChrome() {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [`--window-size=${this.WIDTH},${this.HEIGHT}`],
            executablePath: chromePaths.chrome
        });
        const pages = await browser.pages();
        const browserProduct = await browser.newPage();
        const browserGoogle = await browser.newPage();
        this.browser = browser;
        this.browserPage = pages[0];
        this.browserProduct = browserProduct;
        this.browserGoogle = browserGoogle;

    }
    async searchGoogle(key) {
        let link = 'https://www.google.com/search?q="'+ key +'"'
        await this.browserGoogle.bringToFront();
        try {
            await this.browserGoogle.goto(link, { waitUntil: "networkidle2" });
        } catch (err) {
            await this.browserGoogle.reload({ waitUntil: "networkidle2" });
        }

        let delayMax = 20;
        let delayMin = 5;
        let data = await this.browserGoogle.evaluate(async (delayMax, delayMin) => {
            let phoneDetect = /(\84|0)+(([\d] *){9})/g;
            let phoneNumber;

            let randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
            let scrollNow = 0;
            let scrollGo = randomnumber * 100;
            await new Promise(r => setTimeout(r, randomnumber * 1000));
            window.scrollTo(scrollNow, scrollGo);
            scrollNow = scrollGo

            randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
            scrollGo += randomnumber * 60;
            await new Promise(r => setTimeout(r, randomnumber * 1000));
            window.scrollTo(scrollNow, scrollGo);
            scrollNow = scrollGo

            if (randomnumber % 2 == 0) {
                randomnumber = Math.floor(Math.random() * (Number(delayMax) - Number(delayMin) + 1)) + Number(delayMin);
                scrollGo += randomnumber * 10;
                await new Promise(r => setTimeout(r, randomnumber * 1000));
                window.scrollTo(scrollNow, scrollGo);
            }
            phoneNumber = document.body.innerText.match(phoneDetect)
            return phoneNumber;
        }, delayMax, delayMin);
        return data
    }
}


module.exports = Browser;