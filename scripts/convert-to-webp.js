const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
const excludeDirs = ['node_modules', '.git'];
const converted = [];

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!extensions.includes(ext)) return null;
  const webpPath = filePath.slice(0, -ext.length) + '.webp';
  if (fs.existsSync(webpPath)) return null;
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    if (ext === '.gif') {
      if (metadata.pages && metadata.pages > 1) {
        await image.webp({ animated: true, loop: metadata.loop || 0 }).toFile(webpPath);
      } else {
        await image.webp().toFile(webpPath);
      }
    } else {
      await image.webp({ quality: 85 }).toFile(webpPath);
    }
    const origSize = fs.statSync(filePath).size;
    const webpSize = fs.statSync(webpPath).size;
    const saved = ((1 - webpSize / origSize) * 100).toFixed(1);
    return { file: filePath, webp: webpPath, origSize, webpSize, saved };
  } catch (err) {
    console.error(`Error converting ${filePath}:`, err.message);
    return null;
  }
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        await walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        const result = await convertFile(fullPath);
        if (result) converted.push(result);
      }
    }
  }
}

(async () => {
  console.log('Converting images to WebP...');
  await walkDir(rootDir);
  console.log(`\nConverted ${converted.length} images:`);
  let totalOrig = 0, totalWebp = 0;
  for (const r of converted) {
    totalOrig += r.origSize;
    totalWebp += r.webpSize;
    console.log(`  ${path.relative(rootDir, r.file)} -> ${path.relative(rootDir, r.webp)} (${r.saved}% smaller)`);
  }
  const totalSaved = ((1 - totalWebp / totalOrig) * 100).toFixed(1);
  console.log(`\nTotal: ${converted.length} images converted`);
  console.log(`Original: ${(totalOrig / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP: ${(totalWebp / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${totalSaved}%`);
})();
