// convert_to_webp.mjs
// Converts all game PNGs to WebP (quality 82) in-place alongside the originals.
// Skips the archive/ folder and Screenshots.
// Run once: node convert_to_webp.mjs
// After verifying results, delete the .png originals with: node convert_to_webp.mjs --cleanup

import { readdir, stat } from 'node:fs/promises';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Try to load sharp; if missing, print install instructions and exit.
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\nsharp is not installed. Run:\n  npm install sharp\nthen re-run this script.\n');
  process.exit(1);
}

const QUALITY   = 82;
const ROOT      = fileURLToPath(new URL('.', import.meta.url));
const SKIP_DIRS = new Set(['archive', 'node_modules', '.git']);
const SKIP_NAME = /^Screenshot/i;   // skip screenshot files

const cleanup = process.argv.includes('--cleanup');

// ── Collect PNGs ────────────────────────────────────────────────────────────
async function* walkPngs(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkPngs(join(dir, entry.name));
    } else if (entry.isFile()
      && extname(entry.name).toLowerCase() === '.png'
      && !SKIP_NAME.test(entry.name)) {
      yield join(dir, entry.name);
    }
  }
}

// ── Format helpers ───────────────────────────────────────────────────────────
const kb  = bytes => (bytes / 1024).toFixed(0).padStart(6) + ' KB';
const pct = (before, after) => ((1 - after / before) * 100).toFixed(0).padStart(3) + '%';

// ── Main ─────────────────────────────────────────────────────────────────────
if (cleanup) {
  // Delete original PNGs where a .webp sibling already exists
  console.log('\n── CLEANUP: deleting original PNGs where .webp exists ──\n');
  const { unlink, access } = await import('node:fs/promises');
  let deleted = 0;
  for await (const png of walkPngs(ROOT)) {
    const webp = png.replace(/\.png$/i, '.webp');
    try {
      await access(webp);
      await unlink(png);
      console.log('  deleted  ' + png.replace(ROOT, ''));
      deleted++;
    } catch {
      console.log('  skipped  ' + png.replace(ROOT, '') + '  (no .webp sibling)');
    }
  }
  console.log(`\nDeleted ${deleted} PNG file(s).\n`);
  process.exit(0);
}

// Convert mode
console.log(`\n── Converting PNGs to WebP (quality ${QUALITY}) ──\n`);
let totalBefore = 0, totalAfter = 0, count = 0;

for await (const png of walkPngs(ROOT)) {
  const webp = png.replace(/\.png$/i, '.webp');
  const rel  = png.replace(ROOT, '');

  const beforeStat = await stat(png);
  await sharp(png).webp({ quality: QUALITY }).toFile(webp);
  const afterStat  = await stat(webp);

  totalBefore += beforeStat.size;
  totalAfter  += afterStat.size;
  count++;

  console.log(
    `  ${kb(beforeStat.size)} → ${kb(afterStat.size)}  (${pct(beforeStat.size, afterStat.size)} smaller)  ${rel}`
  );
}

console.log('\n' + '─'.repeat(60));
console.log(`  ${count} files converted`);
console.log(`  Total before: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Total after:  ${(totalAfter  / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Saved:        ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB`);
console.log('\nNext steps:');
console.log('  1. Update image references in HTML files (.png → .webp)');
console.log('  2. Check the site looks correct');
console.log('  3. Run:  node convert_to_webp.mjs --cleanup  to delete the original PNGs\n');
