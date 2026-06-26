#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · build.js — include a build-time, zero dipendenze.

   Copia la repo in dist/ sostituendo nei file .html i marker
     <!-- @include:header -->   →  partials/header.html
     <!-- @include:footer -->   →  partials/footer.html
   I file SENZA marker (incluse le due pagine bloccate) vengono
   copiati byte-per-byte con copyFileSync: nessun roundtrip di
   encoding. L'output pubblicato resta HTML statico puro.

   Uso:  node build.js     (Netlify: command = "node build.js")
   ───────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// File e cartelle che non appartengono al sito pubblicato.
// SKIP_ROOT vale solo al primo livello della repo; SKIP_ANY a ogni profondità.
const SKIP_ROOT = new Set([
  '.git', '.gitignore', '.claude', '.agents', 'dist', 'partials', 'Tappe',
  'build.js', 'check.js', 'netlify.toml', 'skills-lock.json',
  'package.json', 'package-lock.json',
  'CONSEGNA_DEV',            // sorgente media (35 GB): non pubblicare in dist/
  'PROMPT_CHECK_IMPLEMENTAZIONE.md', 'REPORT_CHECK.md', // documenti di lavoro
  'PROMPT_BLOCCHI_DINAMICI.md', 'REPORT_BLOCCHI.md',    // documenti di lavoro
  'PROMPT_AI_CONCIERGE.md', 'REPORT_AI_CONCIERGE.md',   // documenti di lavoro
]);
const SKIP_ANY = new Set(['.DS_Store', 'node_modules']);
const SKIP_ROOT_PATTERNS = [/^Screenshot /];

function readPartial(name) {
  return fs.readFileSync(path.join(ROOT, 'partials', `${name}.html`), 'utf8').trim();
}
const HEADER = readPartial('header');
const FOOTER = readPartial('footer');

let copied = 0;
let withInclude = 0;
let failed = false;

function walk(srcDir, outDir, isRoot) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (SKIP_ANY.has(entry.name)) continue;
    if (isRoot && (SKIP_ROOT.has(entry.name) || SKIP_ROOT_PATTERNS.some((re) => re.test(entry.name)))) continue;
    const src = path.join(srcDir, entry.name);
    const out = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      walk(src, out, false);
      continue;
    }

    fs.mkdirSync(outDir, { recursive: true });

    if (entry.name.endsWith('.html')) {
      const raw = fs.readFileSync(src, 'utf8');
      if (/<!--\s*@include:/.test(raw)) {
        // Funzioni come replacement: il contenuto dei partial non passa
        // dai pattern speciali ($&, $1…) di String.replace.
        const html = raw
          .replace(/<!--\s*@include:header\s*-->/g, () => HEADER)
          .replace(/<!--\s*@include:footer\s*-->/g, () => FOOTER);
        if (/<!--\s*@include:/.test(html)) {
          console.error(`✗ marker @include sconosciuto in ${path.relative(ROOT, src)}`);
          failed = true;
        }
        fs.writeFileSync(out, html);
        withInclude++;
        copied++;
        continue;
      }
    }

    fs.copyFileSync(src, out); // byte-per-byte (pagine bloccate, asset, css, js…)
    copied++;
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
walk(ROOT, DIST, true);

if (failed) {
  console.error('build FALLITA: marker non risolti.');
  process.exit(1);
}
console.log(`build ok → dist/ · ${copied} file copiati · ${withInclude} con include header/footer`);
