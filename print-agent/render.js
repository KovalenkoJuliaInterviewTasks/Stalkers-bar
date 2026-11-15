// Renders an HTML receipt to a PNG exactly as wide as the paper (203 dpi) with headless Chrome.
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
        // Viewport as wide as the printable area; @media print styles, as in normal printing
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
