// Menyiapkan folder www: bundle jembatan Android + menyalin library & font agar bisa jalan offline.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('www/lib', { recursive: true });
mkdirSync('www/fonts', { recursive: true });
await build({ entryPoints: ['src/native.js'], bundle: true, minify: true, format: 'iife', target: ['chrome90'], outfile: 'www/native.js' });
const copies = [
  ['node_modules/sql.js/dist/sql-wasm.js', 'www/lib/sql-wasm.js'],
  ['node_modules/sql.js/dist/sql-wasm.wasm', 'www/lib/sql-wasm.wasm'],
  ['node_modules/xlsx/dist/xlsx.full.min.js', 'www/lib/xlsx.full.min.js'],
  ['node_modules/jszip/dist/jszip.min.js', 'www/lib/jszip.min.js'],
  ['node_modules/@fontsource/inclusive-sans/files/inclusive-sans-latin-400-normal.woff2', 'www/fonts/inclusive-sans-400.woff2'],
  ['node_modules/@fontsource/inclusive-sans/files/inclusive-sans-latin-700-normal.woff2', 'www/fonts/inclusive-sans-700.woff2']
];
for (const [a, b] of copies) copyFileSync(a, b);
console.log('www siap.');
