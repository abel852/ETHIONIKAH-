import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

// Mobile screenshot
const mPage = await browser.newPage();
await mPage.setViewport({ width: 390, height: 844, isMobile: true });
await mPage.goto('http://localhost:3000/register', { waitUntil: 'networkidle0', timeout: 30000 });
await mPage.waitForTimeout(2000);
await mPage.screenshot({ path: 'screenshots/mobile-register.png', fullPage: true });
console.log('Mobile screenshot saved');

// Desktop screenshot
const dPage = await browser.newPage();
await dPage.setViewport({ width: 1440, height: 900 });
await dPage.goto('http://localhost:3000/register', { waitUntil: 'networkidle0', timeout: 30000 });
await dPage.waitForTimeout(2000);
await dPage.screenshot({ path: 'screenshots/desktop-register.png', fullPage: false });
console.log('Desktop screenshot saved');

await browser.close();
console.log('Done');
