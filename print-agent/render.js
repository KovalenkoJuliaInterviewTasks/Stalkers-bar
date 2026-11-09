// Отрисовка HTML-чека в PNG ровно под ширину ленты (203 dpi) через headless Chrome.
const puppeteer = require('puppeteer');
const { PAPER_DOTS } = require('./escpos');

const PRINTER_DPI = 203;
const CSS_DPI = 96;

let browserPromise = null;

const getBrowser = (chromePath) => {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            headless: true,
            executablePath: chromePath || undefined,
            args: ['--no-sandbox', '--font-render-hinting=none'],
        }).then(browser => {
            browser.on('disconnected', () => { browserPromise = null; });
            return browser;
        }).catch(err => {
            browserPromise = null;
            throw err;
        });
    }
    return browserPromise;
};

const renderPng = async (html, paper, chromePath) => {
    const dots = PAPER_DOTS[paper] || PAPER_DOTS['58'];
    const scale = PRINTER_DPI / CSS_DPI;
    const browser = await getBrowser(chromePath);
    const page = await browser.newPage();
    try {
        // Окно шириной с печатную область; стили @media print — как при обычной печати
        await page.setViewport({ width: Math.ceil(dots / scale), height: 200, deviceScaleFactor: scale });
        await page.emulateMediaType('print');
        await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
        const body = await page.$('body');
        return await body.screenshot({ type: 'png', omitBackground: false });
    } finally {
        await page.close().catch(() => {});
    }
};

const closeBrowser = async () => {
    if (browserPromise) {
        const browser = await browserPromise.catch(() => null);
        browserPromise = null;
        if (browser) await browser.close().catch(() => {});
    }
};

module.exports = { renderPng, closeBrowser };
