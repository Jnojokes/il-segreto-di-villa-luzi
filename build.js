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
  'build.js', 'check.js', 'serve.js', 'netlify.toml', 'vercel.json', 'skills-lock.json',
  'package.json', 'package-lock.json',
  'CONSEGNA_DEV',            // sorgente media (35 GB): non pubblicare in dist/
  'PROMPT_CHECK_IMPLEMENTAZIONE.md', 'REPORT_CHECK.md', // documenti di lavoro
  'PROMPT_BLOCCHI_DINAMICI.md', 'REPORT_BLOCCHI.md',    // documenti di lavoro
  'PROMPT_AI_CONCIERGE.md', 'REPORT_AI_CONCIERGE.md',   // documenti di lavoro
]);
const SKIP_ANY = new Set(['.DS_Store', 'node_modules']);
const SKIP_ROOT_PATTERNS = [/^Screenshot /, /^dist \d+$/]; // "dist 2", "dist 4"…: duplicati creati da iCloud

// Pagine dismesse dalla ristrutturazione del 2026-07-16: fuori dalla build
// ma sorgenti nel repo (reversibile). I loro URL fanno redirect in vercel.json.
// NB: di aperitivi-in-erba si esclude SOLO l'index — la landing figlia
// 2-giugno-2026/ (Salotto dei Corsari) resta pubblicata.
const SKIP_REL = new Set([
  'journal',
  'il-segreto/menu',
  'esperienze/yoga-e-benessere',
  'esperienze/il-parco',
  'esperienze/aperitivi-in-erba/index.html',
  'eventi/eventi-privati',
  'eventi/corporate',
  'eventi/la-domenica',
  // Vecchie pagine camere (Room/Suite Villa): sostituite dalle camere
  // regali in /soggiornare/ (2026-07-20).
  'soggiornare/camere',
]);

function readPartial(name) {
  return fs.readFileSync(path.join(ROOT, 'partials', `${name}.html`), 'utf8').trim();
}

// Include generico: <!-- @include:<nome> -->  →  partials/<nome>.html
// Il nome ammette solo [a-z0-9-], quindi un marker non può uscire da
// partials/ (niente path traversal) e un nome scritto male resta non
// risolto invece di leggere un file a caso.
// DUE regex e non una: INCLUDE_RE è globale, e .test() su una regex
// globale avanza lastIndex — riusarla per il controllo farebbe saltare
// un file su due.
const INCLUDE_RE = /<!--\s*@include:([a-z0-9-]+)\s*-->/g;
const HAS_INCLUDE = /<!--\s*@include:/;

// Ogni partial si legge una volta per build.
const PARTIALS = new Map();
function partial(name) {
  if (!PARTIALS.has(name)) PARTIALS.set(name, readPartial(name));
  return PARTIALS.get(name);
}
// Precarico del chrome del sito: se manca, la build deve morire subito
// e non alla prima pagina che lo include.
partial('header');
partial('footer');

let copied = 0;
let withInclude = 0;
let failed = false;

function walk(srcDir, outDir, isRoot) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (SKIP_ANY.has(entry.name)) continue;
    if (isRoot && (SKIP_ROOT.has(entry.name) || SKIP_ROOT_PATTERNS.some((re) => re.test(entry.name)))) continue;
    const src = path.join(srcDir, entry.name);
    if (SKIP_REL.has(path.relative(ROOT, src).split(path.sep).join('/'))) continue;
    const out = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      walk(src, out, false);
      continue;
    }

    fs.mkdirSync(outDir, { recursive: true });

    if (entry.name.endsWith('.html')) {
      const raw = fs.readFileSync(src, 'utf8');
      if (HAS_INCLUDE.test(raw)) {
        // Funzione come replacement: il contenuto dei partial non passa
        // dai pattern speciali ($&, $1…) di String.replace.
        // Un solo giro, niente ricorsione: se un partial contenesse a sua
        // volta un marker, il controllo qui sotto lo trasforma in errore
        // rumoroso invece di risolverlo a sorpresa. Per citare un marker
        // dentro un commento si scrive <!━━ @include:nome ━━>, come già
        // fanno partials/header.html e partials/footer.html.
        const mancanti = [];
        INCLUDE_RE.lastIndex = 0;
        const html = raw.replace(INCLUDE_RE, (marker, name) => {
          try {
            return partial(name);
          } catch (e) {
            mancanti.push(name);
            return marker;
          }
        });
        let rotta = false;
        for (const name of mancanti) {
          console.error(`✗ partial mancante o illeggibile: partials/${name}.html — richiesto da ${path.relative(ROOT, src)}`);
          failed = rotta = true;
        }
        if (!mancanti.length && HAS_INCLUDE.test(html)) {
          console.error(`✗ marker @include non risolto in ${path.relative(ROOT, src)} (nome fuori da [a-z0-9-])`);
          failed = rotta = true;
        }
        // La pagina col marker aperto non si scrive affatto: la build
        // esce comunque con 1, ma così dist/ non contiene mai una pagina
        // mutila da servire per sbaglio in locale.
        if (rotta) continue;
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
console.log(`build ok → dist/ · ${copied} file copiati · ${withInclude} con include · ${PARTIALS.size} partial usati`);
