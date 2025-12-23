/**
 * Screenshot capture script for Product Hunt gallery
 * Run: node scripts/capture-screenshots.mjs
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Simple static file server
function startServer(port = 3456) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = req.url === '/' ? '/docs/index.html' : `/docs${req.url}`;
      filePath = `${rootDir}${filePath}`;

      try {
        const content = readFileSync(filePath);
        const ext = filePath.split('.').pop();
        const mimeTypes = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          png: 'image/png',
          jpg: 'image/jpeg'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
        res.end(content);
      } catch (e) {
        res.statusCode = 404;
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function captureScreenshots() {
  // Create screenshots directory
  const screenshotsDir = resolve(rootDir, 'screenshots');
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir);
  }

  // Start local server
  const server = await startServer();

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    console.log('\n📸 Capturing screenshots...\n');

    // 1. Main hero screenshot - full page with demo images loaded
    console.log('1/5 Hero screenshot (main view)...');
    await page.goto('http://localhost:3456', { waitUntil: 'networkidle2', timeout: 60000 });
    // Wait for demo images to load (they come from external CDN)
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({
      path: resolve(screenshotsDir, '01-hero.png'),
      fullPage: false
    });

    // 2. Different layout - 3x3 grid
    console.log('2/5 Layout 3x3...');
    await page.select('#layout', '3x3');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: resolve(screenshotsDir, '02-layout-3x3.png'),
      fullPage: false
    });

    // 3. Full page layout
    console.log('3/5 Full page layout...');
    await page.select('#layout', 'full');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: resolve(screenshotsDir, '03-layout-full.png'),
      fullPage: false
    });

    // 4. Wallet layout
    console.log('4/5 Wallet layout...');
    await page.select('#layout', 'wallet');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: resolve(screenshotsDir, '04-layout-wallet.png'),
      fullPage: false
    });

    // 5. Contact sheet layout
    console.log('5/5 Contact sheet layout...');
    await page.select('#layout', '4x5');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: resolve(screenshotsDir, '05-layout-contact.png'),
      fullPage: false
    });

    console.log(`\n✅ Screenshots saved to: ${screenshotsDir}\n`);
    console.log('Files:');
    console.log('  - 01-hero.png (main view)');
    console.log('  - 02-layout-3x3.png');
    console.log('  - 03-layout-full.png');
    console.log('  - 04-layout-wallet.png');
    console.log('  - 05-layout-contact.png');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
    server.close();
  }
}

// Capture GIF frames
async function captureGifFrames() {
  const framesDir = resolve(rootDir, 'screenshots', 'gif-frames');
  if (!existsSync(framesDir)) {
    mkdirSync(framesDir, { recursive: true });
  }

  const server = await startServer(3457);
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    console.log('\n🎬 Capturing GIF frames...\n');

    await page.goto('http://localhost:3457', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 8000));

    const layouts = ['2x2', '3x3', 'wallet', '4x5', 'full', '2x2'];

    for (let i = 0; i < layouts.length; i++) {
      console.log(`Frame ${i + 1}/${layouts.length}: ${layouts[i]}`);
      await page.select('#layout', layouts[i]);
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({
        path: resolve(framesDir, `frame-${String(i + 1).padStart(2, '0')}.png`),
        fullPage: false
      });
    }

    console.log(`\n✅ GIF frames saved to: ${framesDir}`);
    console.log('\nTo create GIF, use:');
    console.log('  ffmpeg -framerate 1 -i frame-%02d.png -vf "fps=1,scale=1280:-1" demo.gif');
    console.log('  or use https://ezgif.com/maker\n');

  } catch (error) {
    console.error('Error capturing GIF frames:', error);
  } finally {
    await browser.close();
    server.close();
  }
}

// Run
console.log('🖼️  Photo Print JS - Screenshot Capture Tool\n');
console.log('Choose mode:');
console.log('  node scripts/capture-screenshots.mjs        - Static screenshots');
console.log('  node scripts/capture-screenshots.mjs --gif  - GIF frames\n');

const mode = process.argv[2];

if (mode === '--gif') {
  captureGifFrames();
} else {
  captureScreenshots();
}
