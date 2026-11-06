const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

(async () => {
  const root = path.resolve(__dirname, '..');
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reverse-chart-smoke-'));
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png'};
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({headless: true, args: process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []});
    const page = await browser.newPage();
    await page.setViewport({width:1280, height:900});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
    const cdp = await page.createCDPSession();
    await cdp.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: downloadDir});
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.click('#loadExample');
    await page.waitForFunction(() => state.image && state.imageName === 'Example chart');
    const clickPixel = async (x, y) => {
      const point = await page.$eval('#chartCanvas', (canvas, point) => {
        const rect = canvas.getBoundingClientRect();
        return {x:rect.left + point.x * rect.width / canvas.width, y:rect.top + point.y * rect.height / canvas.height};
      }, {x,y});
      await page.mouse.click(point.x, point.y);
    };
    await clickPixel(50,50);
    assert.equal(await page.$$eval('#calibrationList li', nodes => nodes.length), 0, 'blank input must not create a point');
    for (const [axis,x,y,value] of [['x',50,50,'0'],['x',150,50,'10'],['y',50,50,'20'],['y',50,150,'0']]) {
      await page.select('#axisInput', axis);
      await page.$eval('#valueInput', (input,value) => {input.value=value}, value);
      await clickPixel(x,y);
    }
    assert.equal(await page.$$eval('#calibrationList li', nodes => nodes.length), 4);
    await page.click('#measureMode');
    assert.equal(await page.$eval('#measureMode', el => el.getAttribute('aria-pressed')), 'true');
    await clickPixel(100,100);
    assert.equal(await page.$$eval('#measurementList li', nodes => nodes.length), 1);
    const values = await page.evaluate(() => computeValues(state.measurements[0]));
    assert.ok(Math.abs(values.x-5)<1e-10 && Math.abs(values.y-10)<1e-10);
    const waitDownload = async name => {
      const filename = path.join(downloadDir,name);
      for (let i=0;i<100;i++) {
        if (fs.existsSync(filename) && !fs.existsSync(filename+'.crdownload')) return filename;
        await new Promise(resolve => setTimeout(resolve,50));
      }
      throw new Error(`Missing download: ${name}`);
    };
    await page.click('#exportMeasurements');
    const csv = fs.readFileSync(await waitDownload('measured-values.csv'),'utf8');
    assert.match(csv, /nr,x measured,y measured,x pixel,y pixel/);
    const exported = csv.split('\n')[1].split(',').map(Number);
    assert.ok(Math.abs(exported[1]-5)<1e-10 && Math.abs(exported[2]-10)<1e-10);
    await page.click('#saveProject');
    const projectFile = await waitDownload('reverse-chart-project.json');
    const project = JSON.parse(fs.readFileSync(projectFile,'utf8'));
    assert.equal(project.schemaVersion,1);
    assert.match(project.image.data,/^data:image\/png;base64,/);
    assert.equal(project.calibration.length,4);
    assert.equal(project.measurements.length,1);
    await page.click('#measurementList .remove-point');
    assert.equal(await page.$$eval('#measurementList li', nodes => nodes.length),0);
    await page.click('#undo');
    assert.equal(await page.$$eval('#measurementList li', nodes => nodes.length),1);
    await page.click('#loadExample');
    await page.waitForFunction(() => state.measurements.length === 0);
    const importInput = await page.$('#openProject');
    await importInput.uploadFile(projectFile);
    await page.waitForFunction(() => state.measurements.length === 1 && state.calibration.length === 4);
    assert.equal(await page.evaluate(() => createMeasurementsCsv()),csv);
    const corrupt = path.join(downloadDir,'corrupt.png');fs.writeFileSync(corrupt,'broken image');
    await (await page.$('#imageInput')).uploadFile(corrupt);
    await page.waitForFunction(() => document.querySelector('#imageStatus').textContent.includes('Could not decode'));
    assert.equal(await page.evaluate(() => state.measurements.length),1);
    // Exercise the real keyboard handler and responsive layout.
    await page.focus('#chartCanvas');
    const before = await page.evaluate(() => state.hover.x);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => state.hover.x), before+1);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => state.measurements.length),2);
    await page.setViewport({width:390,height:844});
    await page.waitForFunction(() => document.querySelector('#chartCanvas').getBoundingClientRect().width > 0);
    assert.equal(await page.$eval('#chartCanvas', el => el.getAttribute('aria-describedby')),'chartInstructions');
    assert.deepEqual(errors,[]);
    console.log('Browser smoke passed: load, blank rejection, calibrate, measure, CSV download, project round trip, remove/undo, decode failure, keyboard, mobile viewport.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(downloadDir,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;});
