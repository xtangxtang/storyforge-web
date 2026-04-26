const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const distDir = path.join(__dirname, 'dist');
  const htmlFile = path.join(distDir, 'index.html');
  const jsFile = path.join(distDir, 'assets', 'index-ulsDEHS9.js');

  console.log('HTML exists:', fs.existsSync(htmlFile));
  console.log('JS exists:', fs.existsSync(jsFile));

  // Test with --allow-file-access-from-files flag
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('pageerror', err => {
    errors.push('PAGE: ' + err.message);
  });
  page.on('requestfailed', req => {
    errors.push('REQ FAILED: ' + req.url() + ' - ' + req.failure()?.errorText);
  });

  await page.goto(`file://${htmlFile}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const rootHTML = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 200) : 'NO_ROOT_ELEMENT';
  });

  console.log('Root content:', rootHTML);
  console.log('Errors:', errors.length > 0 ? errors : 'NONE');

  await browser.close();
})();
