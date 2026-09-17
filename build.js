#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · build.js — include a build-time, zero dipendenze.

   Copia la repo in dist/ sostituendo nei file .html i marker
     <!-- @include:header -->   →  partials/header.html
     <!-- @include:footer -->   →  partials/footer.html
     <!-- @menu:<slug> -->      →  content/eventi/<slug>.menu.json,
                                   reso in HTML (vedi menu() più sotto)
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
  '.git', '.gitignore', '.claude', '.agents', '.impeccable', 'dist', 'partials', 'Tappe',
  'build.js', 'check.js', 'serve.js', 'netlify.toml', 'vercel.json', 'skills-lock.json',
  'package.json', 'package-lock.json',
  'CONSEGNA_DEV',            // sorgente media (35 GB): non pubblicare in dist/
  'stampa',                  // sorgenti e PDF della carta da stampa: non si pubblicano
  'content',                 // contenuti in JSON (menù degli eventi): entrano nelle pagine a build-time
]);
const SKIP_ANY = new Set(['.DS_Store', 'node_modules']);
// I documenti di lavoro si riconoscono dal nome: un pattern invece della
// lista a mano, che si dimenticava di aggiornare (PROMPT_CHECK_E_CORREZIONI.md,
// PROMPT_EVENTI_PASSATI.md, PROMPT_GLOBO_E_FARFALLE.md e PROMPT_ORB_RESTYLE.md
// finivano pubblicati in dist/).
const SKIP_ROOT_PATTERNS = [
  /^Screenshot /,
  /^dist \d+$/,                  // "dist 2", "dist 4"…: duplicati creati da iCloud
  /^(?:PROMPT|REPORT)_.*\.md$/,  // documenti di lavoro
];

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

// Due marker, risolti nello STESSO giro:
//   <!-- @include:<nome> -->  →  partials/<nome>.html
//   <!-- @menu:<slug> -->     →  content/eventi/<slug>.menu.json, reso in HTML
// Il nome ammette solo [a-z0-9-], quindi un marker non può uscire da
// partials/ o da content/eventi/ (niente path traversal) e un nome scritto
// male resta non risolto invece di leggere un file a caso.
// DUE regex e non una: MARKER_RE è globale, e .test() su una regex
// globale avanza lastIndex — riusarla per il controllo farebbe saltare
// un file su due.
const MARKER_RE = /<!--\s*@(include|menu):([a-z0-9-]+)\s*-->/g;
const HAS_MARKER = /<!--\s*@(?:include|menu):/;

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

// ── Menù degli eventi, da file di contenuto ──
// Il menù di un evento cambia più spesso della pagina (una conferma della
// cucina, una parola del foglio scritto a mano letta male): sta in un JSON
// che si corregge senza toccare l'HTML. Si rende QUI, a build-time, e mai
// con JavaScript nel browser: lo scraper Open Graph di Facebook e i crawler
// AI non eseguono JS. Formato (nota facoltativa):
//   { "portate": [ { "corso": "Primi", "piatti": ["…", "…"] } ],
//     "nota": "Vino della casa incluso" }
// Un JSON rotto o incompleto NON pubblica la pagina: la build esce con 1 e
// dice file e campo. Anche le chiavi sconosciute sono un errore, così un
// "piatto" scritto al posto di "piatti" non fa sparire una portata in silenzio.
// Contratto delle classi, il CSS vive nella landing:
//   .menu-lista > .menu-voce > h3.menu-corso + p.menu-piatto (ripetibile)
//   p.menu-nota
function testoMenu(s) {
  // Chi scrive il JSON non deve conoscere l'HTML: apostrofo tipografico,
  // poi escape dei caratteri che romperebbero il markup.
  return s.trim()
    .replace(/'/g, '’')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function menu(slug) {
  const rel = `content/eventi/${slug}.menu.json`;
  const errore = (msg) => new Error(`menù non valido: ${rel}: ${msg}`);
  const pieno = (v) => typeof v === 'string' && v.trim() !== '';
  const oggetto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

  let dati;
  try {
    dati = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (e) {
    throw errore(e.code === 'ENOENT' ? 'file mancante' : `JSON non valido (${e.message})`);
  }
  if (!oggetto(dati)) throw errore('atteso un oggetto con "portate"');
  for (const k of Object.keys(dati)) {
    if (k !== 'portate' && k !== 'nota') throw errore(`chiave sconosciuta "${k}" (ammesse: portate, nota)`);
  }
  if (!Array.isArray(dati.portate) || !dati.portate.length) throw errore('"portate" deve essere una lista non vuota');
  if ('nota' in dati && !pieno(dati.nota)) throw errore('"nota" vuota: si scrive il testo o si toglie la chiave');

  const voci = dati.portate.map((p, i) => {
    if (!oggetto(p)) throw errore(`portate[${i}] deve essere un oggetto con "corso" e "piatti"`);
    for (const k of Object.keys(p)) {
      if (k !== 'corso' && k !== 'piatti') throw errore(`portate[${i}]: chiave sconosciuta "${k}" (ammesse: corso, piatti)`);
    }
    if (!pieno(p.corso)) throw errore(`portate[${i}].corso mancante o vuoto`);
    if (!Array.isArray(p.piatti) || !p.piatti.length) throw errore(`portate[${i}].piatti deve essere una lista non vuota`);
    const piatti = p.piatti.map((piatto, j) => {
      if (!pieno(piatto)) throw errore(`portate[${i}].piatti[${j}] mancante o vuoto`);
      return `    <p class="menu-piatto">${testoMenu(piatto)}</p>`;
    });
    return ['  <div class="menu-voce">', `    <h3 class="menu-corso">${testoMenu(p.corso)}</h3>`, ...piatti, '  </div>'].join('\n');
  });

  return [
    `<!-- portate da ${rel}: si correggono lì, non qui -->`,
    '<div class="menu-lista">',
    ...voci,
    '</div>',
    ...('nota' in dati ? [`<p class="menu-nota">${testoMenu(dati.nota)}</p>`] : []),
  ].join('\n');
}

let copied = 0;
let withInclude = 0;
let menus = 0;
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
      if (HAS_MARKER.test(raw)) {
        // Funzione come replacement: il contenuto inserito non passa
        // dai pattern speciali ($&, $1…) di String.replace.
        // Un solo giro, niente ricorsione: se un partial contenesse a sua
        // volta un marker, il controllo qui sotto lo trasforma in errore
        // rumoroso invece di risolverlo a sorpresa. Per citare un marker
        // dentro un commento si scrive <!━━ @include:nome ━━>, come già
        // fanno partials/header.html e partials/footer.html.
        const problemi = [];
        let menuPagina = 0;
        MARKER_RE.lastIndex = 0;
        const html = raw.replace(MARKER_RE, (marker, tipo, name, offset, testo) => {
          try {
            if (tipo === 'menu') {
              // il blocco reso prende il rientro della riga del marker
              const inizioRiga = testo.lastIndexOf('\n', offset - 1) + 1;
              const rientro = testo.slice(inizioRiga, offset);
              const reso = menu(name);
              menuPagina++;
              return /^[ \t]*$/.test(rientro) ? reso.split('\n').join('\n' + rientro) : reso;
            }
            return partial(name);
          } catch (e) {
            problemi.push(tipo === 'menu' ? e.message : `partial mancante o illeggibile: partials/${name}.html`);
            return marker;
          }
        });
        let rotta = false;
        for (const problema of problemi) {
          console.error(`✗ ${problema} — richiesto da ${path.relative(ROOT, src)}`);
          failed = rotta = true;
        }
        if (!problemi.length && HAS_MARKER.test(html)) {
          console.error(`✗ marker @include/@menu non risolto in ${path.relative(ROOT, src)} (nome fuori da [a-z0-9-])`);
          failed = rotta = true;
        }
        // La pagina col marker aperto non si scrive affatto: la build
        // esce comunque con 1, ma così dist/ non contiene mai una pagina
        // mutila da servire per sbaglio in locale.
        if (rotta) continue;
        fs.writeFileSync(out, html);
        withInclude++;
        menus += menuPagina;
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
  console.error('build FALLITA: marker non risolti o menù non validi.');
  process.exit(1);
}
console.log(`build ok → dist/ · ${copied} file copiati · ${withInclude} con include · ${PARTIALS.size} partial usati · ${menus} menù da content/`);
