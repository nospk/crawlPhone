const chromePaths = require('chrome-paths');
const puppeteer = require('puppeteer');
class Browser {
    browser;
    browserPage;
    browserProduct;
    constructor() {
    }
    async openChrome() {
        const WIDTH = 800
        const HEIGHT = 600
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [`--window-size=${WIDTH},${HEIGHT}`],
            executablePath: chromePaths.chrome
        });
        const pages = await browser.pages();
        const browserProduct = await browser.newPage();

        this.browser = browser;
        this.browserPage = pages[0];
        this.browserProduct = browserProduct;

    }
}


module.exports = Browser;