#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · build.js — include a build-time, zero dipendenze.

   Copia la repo in dist/ sostituendo nei file .html i marker
     <!-- @include:header -->   →  partials/header.html
     <!-- @include:footer -->   →  partials/footer.html
     <!-- @menu:<slug> -->      →  content/eventi/<slug>.menu.json,
                                   reso in HTML (vedi menu() più sotto)
     <!-- @carta-…:<sezione> --> →  content/menu/carta.json, la carta del
                                   ristorante (vedi carta() più sotto)
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
  'content',                 // contenuti in JSON (menù degli eventi, carta): entrano nelle pagine a build-time
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

// Tre famiglie di marker, risolte nello STESSO giro:
//   <!-- @include:<nome> -->     →  partials/<nome>.html
//   <!-- @menu:<slug> -->        →  content/eventi/<slug>.menu.json, reso in HTML
//   <!-- @carta-…:<sezione> -->  →  una parte di content/menu/carta.json
// Il nome ammette solo [a-z0-9-], quindi un marker non può uscire da
// partials/ o da content/eventi/ (niente path traversal) e un nome scritto
// male resta non risolto invece di leggere un file a caso. Il "+" serve
// solo a @carta-conta, che somma più sezioni: altrove è un errore.
// DUE regex e non una: MARKER_RE è globale, e .test() su una regex
// globale avanza lastIndex — riusarla per il controllo farebbe saltare
// un file su due.
const MARKER_RE = /<!--\s*@(include|menu|carta-[a-z-]+):([a-z0-9-]+(?:\+[a-z0-9-]+)*)\s*-->/g;
const HAS_MARKER = /<!--\s*@(?:include|menu|carta-[a-z-]+):/;

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
// AI non eseguono JS. Formato completo, tutto facoltativo tranne portate:
//   { "portate": [
//       { "corso": "Primi",  "piatti": ["…", "…"] },            // più piatti
//       { "corso": "Dolce",  "piatto": "…", "vino": null }      // un piatto, col suo vino
//     ],
//     "musica": "Musica dal vivo tra una portata e l'altra",
//     "artisti": ["…"],
//     "nota": "Vino della casa incluso" }
// Il vino è { "nome": "Monte Circe", "denominazione": "Verdicchio … DOC" }.
//
// UN CAMPO VUOTO NON DIVENTA MAI UN SEGNAPOSTO IN PAGINA: vino null, artisti
// [], musica o nota assenti o vuote semplicemente non si rendono. Con
// "portate" vuoto si rende la sola riga d'attesa qui sotto: è la regola dopo
// il "[DA CONFERMARE: quale dolce]" finito online sulla Candle Experience.
// Un JSON rotto o una portata incompleta invece NON pubblicano la pagina: la
// build esce con 1 e dice file e campo. Anche le chiavi sconosciute sono un
// errore, così un "piatti" scritto al posto di "piatto" non fa sparire una
// portata in silenzio.
// Contratto delle classi, il CSS vive nella landing:
//   .menu-lista > .menu-voce > h3.menu-corso + p.menu-piatto (ripetibile)
//                              + p.menu-vino > span.menu-vino-nome + span.menu-vino-doc
//   p.menu-musica · p.menu-artisti · p.menu-nota · p.menu-attesa
const MENU_ATTESA = 'Il menù della serata sarà pubblicato qui a breve.';
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
  const AMMESSE = ['portate', 'musica', 'artisti', 'nota'];
  if (!oggetto(dati)) throw errore('atteso un oggetto con "portate"');
  for (const k of Object.keys(dati)) {
    if (!AMMESSE.includes(k)) throw errore(`chiave sconosciuta "${k}" (ammesse: ${AMMESSE.join(', ')})`);
  }
  if (!Array.isArray(dati.portate)) throw errore('"portate" deve essere una lista (vuota se il menù non c\'è ancora)');
  if ('artisti' in dati && dati.artisti !== null && !Array.isArray(dati.artisti)) throw errore('"artisti" deve essere una lista di nomi');

  // Menù non ancora arrivato: una riga sola, e nient'altro.
  if (!dati.portate.length) {
    return [`<!-- menù da ${rel}: appena arriva si riempie "portate", la pagina non si tocca -->`,
      `<p class="menu-attesa">${testoMenu(MENU_ATTESA)}</p>`].join('\n');
  }

  const voci = dati.portate.map((p, i) => {
    if (!oggetto(p)) throw errore(`portate[${i}] deve essere un oggetto con "corso" e "piatto" (o "piatti")`);
    for (const k of Object.keys(p)) {
      if (!['corso', 'piatto', 'piatti', 'vino'].includes(k)) {
        throw errore(`portate[${i}]: chiave sconosciuta "${k}" (ammesse: corso, piatto, piatti, vino)`);
      }
    }
    if (!pieno(p.corso)) throw errore(`portate[${i}].corso mancante o vuoto`);
    if ('piatto' in p && 'piatti' in p) throw errore(`portate[${i}]: o "piatto" o "piatti", non tutti e due`);

    let piatti;
    if ('piatti' in p) {
      if (!Array.isArray(p.piatti) || !p.piatti.length) throw errore(`portate[${i}].piatti deve essere una lista non vuota`);
      piatti = p.piatti.map((piatto, j) => {
        if (!pieno(piatto)) throw errore(`portate[${i}].piatti[${j}] mancante o vuoto`);
        return `    <p class="menu-piatto">${testoMenu(piatto)}</p>`;
      });
    } else {
      if (!pieno(p.piatto)) throw errore(`portate[${i}].piatto mancante o vuoto`);
      piatti = [`    <p class="menu-piatto">${testoMenu(p.piatto)}</p>`];
    }

    // Vino facoltativo: null o assente = nessuna riga, nemmeno vuota.
    let vino = [];
    if (p.vino !== null && p.vino !== undefined) {
      if (!oggetto(p.vino)) throw errore(`portate[${i}].vino deve essere un oggetto { nome, denominazione } oppure null`);
      for (const k of Object.keys(p.vino)) {
        if (k !== 'nome' && k !== 'denominazione') throw errore(`portate[${i}].vino: chiave sconosciuta "${k}" (ammesse: nome, denominazione)`);
      }
      if (!pieno(p.vino.nome)) throw errore(`portate[${i}].vino.nome mancante o vuoto (per togliere il vino si scrive "vino": null)`);
      if (!pieno(p.vino.denominazione)) throw errore(`portate[${i}].vino.denominazione mancante o vuota`);
      vino = [`    <p class="menu-vino"><span class="menu-vino-nome">${testoMenu(p.vino.nome)}</span> <span class="menu-vino-doc">${testoMenu(p.vino.denominazione)}</span></p>`];
    }

    return ['  <div class="menu-voce">', `    <h3 class="menu-corso">${testoMenu(p.corso)}</h3>`, ...piatti, ...vino, '  </div>'].join('\n');
  });

  const artisti = Array.isArray(dati.artisti) ? dati.artisti.filter((a) => pieno(a)).map((a) => testoMenu(a)) : [];
  const coda = [];
  if (pieno(dati.musica)) coda.push(`<p class="menu-musica">${testoMenu(dati.musica)}</p>`);
  if (artisti.length) coda.push(`<p class="menu-artisti">${artisti.join(', ')}</p>`);
  if (pieno(dati.nota)) coda.push(`<p class="menu-nota">${testoMenu(dati.nota)}</p>`);

  return [
    `<!-- portate da ${rel}: si correggono lì, non qui -->`,
    '<div class="menu-lista">',
    ...voci,
    '</div>',
    ...coda,
  ].join('\n');
}

// ── La carta del ristorante, da file di contenuto ──
// Una fonte sola per le due pagine che la mostrano: /menu/ (la pagina del
// QR sui tavoli) e la sezione #menu di /il-segreto/. Il JSON esce dallo
// stesso sorgente del menù stampato (carta_sito.json nella cartella
// menu_v12 del progetto) e si copia qui così com'è: quando cambia un
// piatto si tocca solo content/menu/carta.json. Formato (nota, descrizione
// e unita facoltative, prezzi in euro, "unita": "hg" = all'etto):
//   { "aggiornato": "2026-09-25",
//     "sezioni": [
//       { "id": "carni-al-taglio", "titolo": "Carni al taglio", "nota": "…",
//         "piatti": [ { "nome": "Wagyu", "descrizione": "…", "prezzo": 30, "unita": "hg" } ] } ] }
//
// UN PIATTO SENZA PREZZO NON SI PUBBLICA: con "prezzo": null il piatto non
// compare e non entra nei conteggi, e al suo posto non va niente (né "da
// definire" né "su richiesta"). Per il resto vale la regola dei menù degli
// eventi: JSON rotto, chiavi sconosciute, nomi vuoti o una sezione rimasta
// senza piatti fermano la build, e la pagina non si scrive.
//
// Le pagine tengono la loro grafica (titoli, icone, ordine delle sezioni,
// dove sta la nota) e al build chiedono solo i dati, con questi marker:
//   @carta-qr:<id>             piatti della sezione, stile /menu/
//   @carta-qr-nota:<id>        la nota della sezione, stile /menu/
//   @carta-segreto:<id>        piatti della sezione, stile accordion di /il-segreto/
//   @carta-segreto-nota:<id>   la nota della sezione, stile /il-segreto/
//   @carta-conta:<id>[+<id>…]  quanti piatti si pubblicano (la card delle
//                              pizze somma rosse e bianche)
// Una nota assente non rende niente. Una pagina che usa uno stile deve
// rendere OGNI sezione del JSON una volta sola e dare un posto a ogni nota:
// una sezione o una nota nuova nel JSON fermano la build finché la pagina
// non le accoglie, invece di sparire in silenzio.
// Contratto delle classi (il CSS vive nelle pagine):
//   qr       .piatto > p.piatto-nome + p.piatto-dettaglio + p.piatto-prezzo · p.categoria-nota
//   segreto  .menu-item > (.menu-item-main > span.menu-item-name + span.menu-item-desc)
//            + span.menu-item-price · <p> dentro .menu-card-body-inner per la nota
const CARTA_REL = 'content/menu/carta.json';
// L'unità accanto al prezzo, nel formato che ciascuna pagina usava a mano.
const CARTA_UNITA = { hg: { qr: " all'etto", segreto: ' / hg' } };
let cartaLetta = null;

function carta() {
  if (cartaLetta) return cartaLetta;
  const errore = (msg) => new Error(`carta non valida: ${CARTA_REL}: ${msg}`);
  const pieno = (v) => typeof v === 'string' && v.trim() !== '';
  const oggetto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const testoOpzionale = (v) => v === undefined || v === null || typeof v === 'string';
  const soloChiavi = (o, ammesse, dove) => {
    for (const k of Object.keys(o)) {
      if (!ammesse.includes(k)) throw errore(`${dove}chiave sconosciuta "${k}" (ammesse: ${ammesse.join(', ')})`);
    }
  };

  let dati;
  try {
    dati = JSON.parse(fs.readFileSync(path.join(ROOT, CARTA_REL), 'utf8'));
  } catch (e) {
    throw errore(e.code === 'ENOENT' ? 'file mancante' : `JSON non valido (${e.message})`);
  }
  if (!oggetto(dati)) throw errore('atteso un oggetto con "aggiornato" e "sezioni"');
  soloChiavi(dati, ['aggiornato', 'sezioni'], '');
  if (typeof dati.aggiornato !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dati.aggiornato)) {
    throw errore('"aggiornato" deve essere una data AAAA-MM-GG');
  }
  if (!Array.isArray(dati.sezioni) || !dati.sezioni.length) throw errore('"sezioni" deve essere una lista non vuota');

  const sezioni = new Map();
  const senzaPrezzo = [];
  dati.sezioni.forEach((s, i) => {
    const dove = `sezioni[${i}]`;
    if (!oggetto(s)) throw errore(`${dove} deve essere un oggetto con "id", "titolo" e "piatti"`);
    soloChiavi(s, ['id', 'titolo', 'nota', 'piatti'], `${dove}: `);
    if (typeof s.id !== 'string' || !/^[a-z0-9-]+$/.test(s.id)) throw errore(`${dove}.id mancante o fuori da [a-z0-9-]`);
    if (sezioni.has(s.id)) throw errore(`${dove}.id "${s.id}" ripetuto`);
    if (!pieno(s.titolo)) throw errore(`${dove}.titolo mancante o vuoto`);
    if (!testoOpzionale(s.nota)) throw errore(`${dove}.nota deve essere un testo (o null)`);
    if (!Array.isArray(s.piatti)) throw errore(`${dove}.piatti deve essere una lista`);

    const piatti = [];
    s.piatti.forEach((p, j) => {
      const qui = `${dove}.piatti[${j}] (${s.id})`;
      if (!oggetto(p)) throw errore(`${qui} deve essere un oggetto con "nome" e "prezzo"`);
      soloChiavi(p, ['nome', 'descrizione', 'prezzo', 'unita'], `${qui}: `);
      if (!pieno(p.nome)) throw errore(`${qui}.nome mancante o vuoto`);
      if (!testoOpzionale(p.descrizione)) throw errore(`${qui}.descrizione deve essere un testo (o null)`);
      if (p.unita !== undefined && p.unita !== null && !Object.hasOwn(CARTA_UNITA, p.unita)) {
        throw errore(`${qui}.unita "${p.unita}" sconosciuta (ammesse: ${Object.keys(CARTA_UNITA).join(', ')})`);
      }
      if (!('prezzo' in p)) throw errore(`${qui}.prezzo mancante (per non pubblicare il piatto: "prezzo": null)`);
      if (p.prezzo === null) {
        senzaPrezzo.push(`«${p.nome.trim()}» (${s.titolo.trim()})`);
        return;
      }
      const cent = p.prezzo * 100;
      if (typeof p.prezzo !== 'number' || !Number.isFinite(p.prezzo) || p.prezzo <= 0 || Math.abs(cent - Math.round(cent)) > 1e-6) {
        throw errore(`${qui}.prezzo deve essere un numero in euro maggiore di zero, al massimo con i centesimi (o null)`);
      }
      piatti.push({
        nome: p.nome.trim(),
        descrizione: pieno(p.descrizione) ? p.descrizione.trim() : '',
        prezzo: p.prezzo,
        unita: p.unita || '',
      });
    });
    if (!piatti.length) {
      throw errore(`${dove} (${s.id}): nessun piatto da pubblicare, le pagine mostrerebbero «${s.titolo.trim()}» senza piatti`);
    }
    sezioni.set(s.id, { id: s.id, titolo: s.titolo.trim(), nota: pieno(s.nota) ? s.nota.trim() : '', piatti });
  });

  for (const piatto of senzaPrezzo) console.log(`· carta: ${piatto} senza prezzo, non pubblicato`);
  cartaLetta = { aggiornato: dati.aggiornato, sezioni };
  return cartaLetta;
}

function testoCarta(s) {
  // Nomi e descrizioni si scrivono come nel JSON, apostrofi compresi:
  // solo l'escape dei caratteri che romperebbero il markup.
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Prezzi nel formato che ciascuna pagina usava a mano: /menu/ "€10" e
// "€8 all'etto" (i centesimi solo se ci sono), /il-segreto/ "€ 10,00" e
// "€ 8,00 / hg".
const centesimi = (n) => n.toFixed(2).replace('.', ',');
function prezzoQr(p) {
  return `€${Number.isInteger(p.prezzo) ? p.prezzo : centesimi(p.prezzo)}${p.unita ? CARTA_UNITA[p.unita].qr : ''}`;
}
function prezzoSegreto(p) {
  return `€ ${centesimi(p.prezzo)}${p.unita ? CARTA_UNITA[p.unita].segreto : ''}`;
}

function piattiQr(sezione) {
  return sezione.piatti.map((p) => [
    '<div class="piatto">',
    `  <p class="piatto-nome">${testoCarta(p.nome)}</p>`,
    ...(p.descrizione ? [`  <p class="piatto-dettaglio">${testoCarta(p.descrizione)}</p>`] : []),
    `  <p class="piatto-prezzo">${prezzoQr(p)}</p>`,
    '</div>',
  ].join('\n')).join('\n');
}

function piattiSegreto(sezione) {
  return sezione.piatti.map((p) => {
    const principale = p.descrizione
      ? ['  <div class="menu-item-main">',
        `    <span class="menu-item-name">${testoCarta(p.nome)}</span>`,
        `    <span class="menu-item-desc">${testoCarta(p.descrizione)}</span>`,
        '  </div>']
      : [`  <div class="menu-item-main"><span class="menu-item-name">${testoCarta(p.nome)}</span></div>`];
    return ['<div class="menu-item">', ...principale, `  <span class="menu-item-price">${prezzoSegreto(p)}</span>`, '</div>'].join('\n');
  }).join('\n');
}

const CARTA_MARKER = {
  'carta-qr': { stile: 'qr', parte: 'piatti', rendi: piattiQr },
  'carta-qr-nota': { stile: 'qr', parte: 'note', rendi: (s) => (s.nota ? `<p class="categoria-nota">${testoCarta(s.nota)}</p>` : '') },
  'carta-segreto': { stile: 'segreto', parte: 'piatti', rendi: piattiSegreto },
  'carta-segreto-nota': { stile: 'segreto', parte: 'note', rendi: (s) => (s.nota ? `<p>${testoCarta(s.nota)}</p>` : '') },
};

// Quello che una pagina ha chiesto alla carta, per il controllo finale.
function usoCarta() {
  return { usata: false, firmata: false, conta: [], qr: { piatti: [], note: [] }, segreto: { piatti: [], note: [] } };
}

function markerCarta(tipo, nome, uso) {
  const c = carta();
  uso.usata = true;
  const sezione = (id) => {
    const s = c.sezioni.get(id);
    if (!s) throw new Error(`carta: la pagina chiede la sezione "${id}", che in ${CARTA_REL} non c'è (ci sono: ${[...c.sezioni.keys()].join(', ')})`);
    return s;
  };
  if (tipo === 'carta-conta') {
    const ids = nome.split('+');
    uso.conta.push(...ids);
    return String(ids.reduce((n, id) => n + sezione(id).piatti.length, 0));
  }
  const def = CARTA_MARKER[tipo];
  if (!def) throw new Error(`marker @${tipo} sconosciuto (ammessi: ${[...Object.keys(CARTA_MARKER), 'carta-conta'].map((t) => '@' + t).join(', ')})`);
  if (nome.includes('+')) throw new Error(`@${tipo}:${nome}: una sezione sola, il "+" vale solo per @carta-conta`);
  const reso = def.rendi(sezione(nome));
  uso[def.stile][def.parte].push(nome);
  if (def.parte === 'piatti' && !uso.firmata) {
    uso.firmata = true;
    return `<!-- piatti e prezzi da ${CARTA_REL} (aggiornato ${c.aggiornato}): si cambiano lì, non qui -->\n${reso}`;
  }
  return reso;
}

// Dopo il giro dei marker: ogni sezione resa una volta sola per stile, ogni
// nota al suo posto, ogni sezione contata una volta sola.
function verificaCarta(uso) {
  const problemi = [];
  if (!uso.usata) return problemi;
  const c = carta();
  const quante = (lista, id) => lista.filter((x) => x === id).length;
  for (const [id, s] of c.sezioni) {
    const chi = `«${s.titolo}» (${id})`;
    for (const stile of ['qr', 'segreto']) {
      const u = uso[stile];
      if (!u.piatti.length && !u.note.length) continue;
      const n = quante(u.piatti, id);
      if (n === 0) problemi.push(`carta: manca la sezione ${chi}: aggiungi il suo blocco con il marker @carta-${stile}:${id}`);
      if (n > 1) problemi.push(`carta: la sezione ${chi} è resa ${n} volte`);
      const k = quante(u.note, id);
      if (s.nota && k === 0) problemi.push(`carta: la nota di ${chi} non ha un posto: aggiungi @carta-${stile}-nota:${id} dove deve comparire`);
      if (k > 1) problemi.push(`carta: la nota di ${chi} è resa ${k} volte`);
    }
    if (uso.conta.length && quante(uso.conta, id) !== 1) {
      problemi.push(`carta: la sezione ${chi} entra ${quante(uso.conta, id)} volte nei conteggi @carta-conta (attesa 1)`);
    }
  }
  return problemi;
}

let copied = 0;
let withInclude = 0;
let menus = 0;
let carte = 0;
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
        const uso = usoCarta();
        MARKER_RE.lastIndex = 0;
        const html = raw.replace(MARKER_RE, (marker, tipo, name, offset, testo) => {
          try {
            if (tipo !== 'carta-conta' && name.includes('+')) {
              throw new Error(`@${tipo}:${name}: il "+" vale solo per @carta-conta`);
            }
            if (tipo === 'include') return partial(name);
            let reso;
            if (tipo === 'menu') {
              reso = menu(name);
              menuPagina++;
            } else {
              reso = markerCarta(tipo, name, uso);
              if (tipo === 'carta-conta') return reso; // un numero, in riga
            }
            // il blocco reso prende il rientro della riga del marker
            const inizioRiga = testo.lastIndexOf('\n', offset - 1) + 1;
            const rientro = testo.slice(inizioRiga, offset);
            return /^[ \t]*$/.test(rientro) ? reso.split('\n').join('\n' + rientro) : reso;
          } catch (e) {
            problemi.push(tipo === 'include' && !name.includes('+') ? `partial mancante o illeggibile: partials/${name}.html` : e.message);
            return marker;
          }
        });
        if (!problemi.length) problemi.push(...verificaCarta(uso));
        let rotta = false;
        // Una carta rotta si ripeterebbe a ogni marker: un messaggio solo.
        for (const problema of new Set(problemi)) {
          console.error(`✗ ${problema} — richiesto da ${path.relative(ROOT, src)}`);
          failed = rotta = true;
        }
        if (!problemi.length && HAS_MARKER.test(html)) {
          console.error(`✗ marker @include/@menu/@carta non risolto in ${path.relative(ROOT, src)} (nome fuori da [a-z0-9-])`);
          failed = rotta = true;
        }
        // La pagina col marker aperto non si scrive affatto: la build
        // esce comunque con 1, ma così dist/ non contiene mai una pagina
        // mutila da servire per sbaglio in locale.
        if (rotta) continue;
        fs.writeFileSync(out, html);
        withInclude++;
        menus += menuPagina;
        if (uso.usata) carte++;
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
  console.error('build FALLITA: marker non risolti, menù o carta non validi.');
  process.exit(1);
}
console.log(`build ok → dist/ · ${copied} file copiati · ${withInclude} con include · ${PARTIALS.size} partial usati · ${menus} menù da content/ · carta in ${carte} pagine`);
