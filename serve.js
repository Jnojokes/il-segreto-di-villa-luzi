#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · serve.js — dev server a ZERO dipendenze.
   - Fa `node build.js` all'avvio e a ogni modifica dei sorgenti
     (debounce), così l'anteprima resta sempre allineata.
   - Serve dist/ con URL puliti (/foo/ → dist/foo/index.html),
     content-type corretti, 404.html, e Cache-Control: no-store
     (in dev niente cache stantia: nessun hard-refresh).
   Uso:  node serve.js     |  npm run dev     (PORT opzionale)
   Non è pubblicato: package.json/serve.js sono in SKIP_ROOT di build.js.
   ───────────────────────────────────────────────────────────── */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PORT = parseInt(process.env.PORT, 10) || 8765;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

function build(reason) {
  try {
    const out = execSync('node build.js', { cwd: ROOT, encoding: 'utf8' });
    process.stdout.write('· build (' + reason + '): ' + out.trim().split('\n').pop() + '\n');
  } catch (e) {
    process.stdout.write('✗ build FALLITA (' + reason + '):\n' + (e.stdout || '') + (e.stderr || e.message) + '\n');
  }
}

// ─── Watch sorgenti → rebuild (ignora dist/.git/node_modules) ───
let rt = null;
function watch() {
  try {
    fs.watch(ROOT, { recursive: true }, (_ev, file) => {
      if (!file) return;
      const top = file.split(path.sep)[0];
      if (top === 'dist' || top === '.git' || top === 'node_modules') return;
      if (path.basename(file) === '.DS_Store') return;
      clearTimeout(rt);
      rt = setTimeout(() => build('modifica: ' + file), 150);
    });
  } catch (e) {
    process.stdout.write('(watch non disponibile su questa piattaforma: rebuild manuale)\n');
  }
}

// ─── Risoluzione file con URL puliti, anti-traversal ───
function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.indexOf('\0') !== -1) return null;
  let rel = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  let abs = path.join(DIST, rel);
  if (abs !== DIST && !abs.startsWith(DIST + path.sep)) return null; // fuori da dist
  const candidates = [];
  if (p.endsWith('/')) candidates.push(path.join(abs, 'index.html'));
  else if (path.extname(abs)) candidates.push(abs);
  else { candidates.push(path.join(abs, 'index.html'), abs + '.html', abs); }
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c; } catch (e) {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolve(req.url);
  if (file) {
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
    return;
  }
  // 404
  let body = 'Not found';
  try { body = fs.readFileSync(path.join(DIST, '404.html')); } catch (e) {}
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
});

build('avvio');
watch();
server.listen(PORT, () => {
  process.stdout.write('\n  Villa Luzi · dev server\n  ▸ http://localhost:' + PORT + '/\n  (rebuild automatico al salvataggio · Ctrl+C per fermare)\n\n');
});
