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
     <!-- @chi-siamo:<parte> --> →  content/il-segreto/chi-siamo.json
                                   (vedi chiSiamo() più sotto)
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

// Quattro famiglie di marker, risolte nello STESSO giro:
//   <!-- @include:<nome> -->     →  partials/<nome>.html
//   <!-- @menu:<slug> -->        →  content/eventi/<slug>.menu.json, reso in HTML
//   <!-- @carta-…:<sezione> -->  →  una parte di content/menu/carta.json
//   <!-- @chi-siamo:<parte> -->  →  content/il-segreto/chi-siamo.json
// Il nome ammette solo [a-z0-9-], quindi un marker non può uscire da
// partials/ o da content/eventi/ (niente path traversal) e un nome scritto
// male resta non risolto invece di leggere un file a caso. Il "+" serve
// solo a @carta-conta, che somma più sezioni: altrove è un errore.
// DUE regex e non una: MARKER_RE è globale, e .test() su una regex
// globale avanza lastIndex — riusarla per il controllo farebbe saltare
// un file su due.
const MARKER_RE = /<!--\s*@(include|menu|carta-[a-z-]+|chi-siamo):([a-z0-9-]+(?:\+[a-z0-9-]+)*)\s*-->/g;
const HAS_MARKER = /<!--\s*@(?:include|menu|carta-[a-z-]+|chi-siamo):/;

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
//     "coperto": 3,
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
//   @carta-coperto:qr|segreto  il coperto, nel formato prezzi della pagina
// Una nota assente non rende niente. Il coperto invece si scrive sempre,
// perché il cliente deve saperlo prima di sedersi: "coperto": null se non
// si fa pagare, e se la chiave manca (un carta_sito.json vecchio ricopiato
// qui) la build si ferma invece di toglierlo in silenzio. Una pagina che usa uno stile deve
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

// Mai un segnaposto di testo online: dopo il "[DA CONFERMARE: quale dolce]"
// finito sulla Candle Experience, un testo con parentesi quadre, "DA
// SPOSTARE", "Lorem" e simili ferma la build invece di finire in pagina.
// Vale per la carta e per Chi siamo. Un campo che non c'è ancora si lascia
// vuoto (null): la pagina lo salta.
const SEGNAPOSTO_RE = /[[\]]|\bda (?:spostare|confermare|definire)\b|\blorem\b|\bipsum\b|\bTODO\b|\bTBD\b|\bXXX\b|^\s*(?:null|undefined|nan)\s*$/i;
const segnaposto = (s) => typeof s === 'string' && SEGNAPOSTO_RE.test(s);

function carta() {
  if (cartaLetta) return cartaLetta;
  const errore = (msg) => new Error(`carta non valida: ${CARTA_REL}: ${msg}`);
  const pieno = (v) => typeof v === 'string' && v.trim() !== '';
  const oggetto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const testoOpzionale = (v, dove) => {
    if (v !== undefined && v !== null && typeof v !== 'string') return false;
    if (segnaposto(v)) throw errore(`${dove}: "${v}" sembra un segnaposto, non un testo da pubblicare`);
    return true;
  };
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
  soloChiavi(dati, ['aggiornato', 'coperto', 'sezioni'], '');
  if (dati.coperto !== undefined && dati.coperto !== null) {
    const cent = dati.coperto * 100;
    if (typeof dati.coperto !== 'number' || !Number.isFinite(dati.coperto) || dati.coperto <= 0 || Math.abs(cent - Math.round(cent)) > 1e-6) {
      throw errore('"coperto" deve essere un numero in euro maggiore di zero, al massimo con i centesimi (o null)');
    }
  }
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
    if (!pieno(s.titolo) || !testoOpzionale(s.titolo, `${dove}.titolo`)) throw errore(`${dove}.titolo mancante o vuoto`);
    if (!testoOpzionale(s.nota, `${dove}.nota`)) throw errore(`${dove}.nota deve essere un testo (o null)`);
    if (!Array.isArray(s.piatti)) throw errore(`${dove}.piatti deve essere una lista`);

    const piatti = [];
    s.piatti.forEach((p, j) => {
      const qui = `${dove}.piatti[${j}] (${s.id})`;
      if (!oggetto(p)) throw errore(`${qui} deve essere un oggetto con "nome" e "prezzo"`);
      soloChiavi(p, ['nome', 'descrizione', 'prezzo', 'unita'], `${qui}: `);
      if (!pieno(p.nome) || !testoOpzionale(p.nome, `${qui}.nome`)) throw errore(`${qui}.nome mancante o vuoto`);
      if (!testoOpzionale(p.descrizione, `${qui}.descrizione`)) throw errore(`${qui}.descrizione deve essere un testo (o null)`);
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
  cartaLetta = { aggiornato: dati.aggiornato, coperto: dati.coperto, sezioni };
  return cartaLetta;
}

function testoEsatto(s) {
  // Carta e Chi siamo si scrivono come nel JSON, apostrofi compresi:
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

// Una parentesi breve non si spezza a fine riga: a 390px "(solo / la
// domenica)" andava a capo a metà. Gli spazi dentro diventano non
// separabili (a video identici); le parentesi lunghe restano libere, per
// non uscire dalla colonna stretta dell'accordion.
const legaParentesi = (html) => html.replace(/\(([^()]{1,24})\)/g, (m, dentro) => `(${dentro.replace(/ /g, '&nbsp;')})`);
const testoPiatto = (s) => legaParentesi(testoEsatto(s));

function piattiQr(sezione) {
  return sezione.piatti.map((p) => [
    '<div class="piatto">',
    `  <p class="piatto-nome">${testoPiatto(p.nome)}</p>`,
    ...(p.descrizione ? [`  <p class="piatto-dettaglio">${testoPiatto(p.descrizione)}</p>`] : []),
    `  <p class="piatto-prezzo">${prezzoQr(p)}</p>`,
    '</div>',
  ].join('\n')).join('\n');
}

function piattiSegreto(sezione) {
  return sezione.piatti.map((p) => {
    const principale = p.descrizione
      ? ['  <div class="menu-item-main">',
        `    <span class="menu-item-name">${testoPiatto(p.nome)}</span>`,
        `    <span class="menu-item-desc">${testoPiatto(p.descrizione)}</span>`,
        '  </div>']
      : [`  <div class="menu-item-main"><span class="menu-item-name">${testoPiatto(p.nome)}</span></div>`];
    return ['<div class="menu-item">', ...principale, `  <span class="menu-item-price">${prezzoSegreto(p)}</span>`, '</div>'].join('\n');
  }).join('\n');
}

const CARTA_MARKER = {
  'carta-qr': { stile: 'qr', parte: 'piatti', rendi: piattiQr },
  'carta-qr-nota': { stile: 'qr', parte: 'note', rendi: (s) => (s.nota ? `<p class="categoria-nota">${testoEsatto(s.nota)}</p>` : '') },
  'carta-segreto': { stile: 'segreto', parte: 'piatti', rendi: piattiSegreto },
  'carta-segreto-nota': { stile: 'segreto', parte: 'note', rendi: (s) => (s.nota ? `<p>${testoEsatto(s.nota)}</p>` : '') },
};

// Quello che una pagina ha chiesto alla carta e a Chi siamo, per il
// controllo finale.
function usoCarta() {
  return { usata: false, firmata: false, conta: [], qr: { piatti: [], note: [] }, segreto: { piatti: [], note: [] }, chiSiamo: [] };
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
  if (tipo === 'carta-coperto') {
    if (c.coperto === undefined) throw new Error(`carta: manca "coperto" in ${CARTA_REL} (il prezzo del coperto, o null se non si fa pagare)`);
    if (c.coperto === null) return '';
    const p = { prezzo: c.coperto, unita: '' };
    if (nome === 'qr') return `<p class="coperto">Coperto ${prezzoQr(p)}</p>`;
    if (nome === 'segreto') return `Coperto ${prezzoSegreto(p)}<br>`;
    throw new Error(`@carta-coperto:${nome}: stile sconosciuto (ammessi: qr, segreto)`);
  }
  const def = CARTA_MARKER[tipo];
  if (!def) throw new Error(`marker @${tipo} sconosciuto (ammessi: ${[...Object.keys(CARTA_MARKER), 'carta-conta', 'carta-coperto'].map((t) => '@' + t).join(', ')})`);
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

// ── Chi siamo, su /il-segreto/, da file di contenuto ──
// L'introduzione delle titolari e le schede delle persone del ristorante
// (settembre 2026, su richiesta di Luana). Se cambiano i testi o arrivano
// nomi e foto si tocca solo content/il-segreto/chi-siamo.json. Formato:
//   { "intro": { "titolo": "…", "testo": ["paragrafo", "…"], "firma": null },
//     "persone": [ { "id": "sonia", "nome": "…", "ruolo": "…", "ruolo_riga2": "…",
//                    "testo": "…" (o una lista di paragrafi), "foto": null } ] }
// Regole:
// - una scheda compare se ha nome e ruolo; riga 2 del ruolo e testo sono
//   facoltativi. Il nome che non è ancora arrivato si lascia a null: la
//   scheda resta fuori, e non va mai scritto un nome finto;
// - "foto": null → al posto della foto il riquadro con le iniziali
//   (decorativo, aria-hidden, nessuna scritta). "foto": "/assets/…-800.webp"
//   → la foto vera; le sorelle -<larghezza> dello stesso formato nella stessa
//   cartella (es. -480, -800, -1200) diventano il srcset da sole;
// - la firma dell'intro non si mostra: i nomi sono già nel titolo;
// - intro vuota → la sezione non esiste e dove stava lo chef torna la sua
//   sezione di prima, fatta con i dati della scheda "chef".
// Marker: @chi-siamo:sezione subito dopo l'hero, @chi-siamo:chef dove stava
// la sezione dello chef; tutti e due, una volta sola.
// Contratto delle classi (il CSS vive nella pagina):
//   section.chi-siamo > .chi-siamo-intro > h2.chi-siamo-titolo + .chi-siamo-testo > p
//                     + .persone > article.persona > .persona-foto (img, o .persona-foto-vuota
//                       > .persona-iniziali) + h3.persona-nome + p.persona-ruolo > span + span
//                       + .persona-testo > p
//   la sezione dello chef di prima: section.chef > .chef-card > … (come era scritta a mano)
const CHI_SIAMO_REL = 'content/il-segreto/chi-siamo.json';
// Larghezza delle schede, per il sizes delle foto (vedi .persona nel CSS).
const PERSONA_SIZES = '(min-width: 1000px) 265px, (min-width: 700px) 320px, calc((100vw - 56px) / 2)';
let chiSiamoLetto = null;

function chiSiamo() {
  if (chiSiamoLetto) return chiSiamoLetto;
  const errore = (msg) => new Error(`chi siamo non valido: ${CHI_SIAMO_REL}: ${msg}`);
  const oggetto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const soloChiavi = (o, ammesse, dove) => {
    for (const k of Object.keys(o)) {
      if (!ammesse.includes(k)) throw errore(`${dove}chiave sconosciuta "${k}" (ammesse: ${ammesse.join(', ')})`);
    }
  };
  // un testo facoltativo: '' se manca, errore se non è un testo o è un segnaposto
  const testo = (v, dove) => {
    if (v === undefined || v === null) return '';
    if (typeof v !== 'string') throw errore(`${dove} deve essere un testo (o null)`);
    if (segnaposto(v)) throw errore(`${dove}: "${v}" sembra un segnaposto, non un testo da pubblicare`);
    return v.trim();
  };
  const paragrafi = (v, dove) => {
    if (Array.isArray(v)) return v.map((x, i) => testo(x, `${dove}[${i}]`)).filter(Boolean);
    const t = testo(v, dove);
    return t ? [t] : [];
  };
  const foto = (v, dove) => {
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string' || !/^\/assets\/[\w./-]+\.(?:webp|avif|jpe?g|png)$/i.test(v) || v.includes('..')) {
      throw errore(`${dove}: "${v}" non è il percorso di un'immagine in /assets/ (o null per il segnaposto)`);
    }
    if (!fs.existsSync(path.join(ROOT, v))) throw errore(`${dove}: ${v} non esiste nel repo`);
    // srcset dalle sorelle nome-<larghezza>.<formato>, se ci sono
    const m = path.basename(v).match(/^(.+)-(\d+)\.([a-z]+)$/i);
    if (!m) return { src: v, srcset: '' };
    const dir = path.posix.dirname(v);
    const esc = (x) => x.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
    const stessa = new RegExp('^' + esc(m[1]) + '-(\\d+)\\.' + esc(m[3]) + '$', 'i');
    const sorelle = fs.readdirSync(path.join(ROOT, dir))
      .map((f) => f.match(stessa))
      .filter(Boolean)
      .map((x) => ({ file: `${dir}/${x[0]}`, w: Number(x[1]) }))
      .sort((a, b) => a.w - b.w);
    return { src: v, srcset: sorelle.length > 1 ? sorelle.map((x) => `${x.file} ${x.w}w`).join(', ') : '' };
  };

  let dati;
  try {
    dati = JSON.parse(fs.readFileSync(path.join(ROOT, CHI_SIAMO_REL), 'utf8'));
  } catch (e) {
    throw errore(e.code === 'ENOENT' ? 'file mancante' : `JSON non valido (${e.message})`);
  }
  if (!oggetto(dati)) throw errore('atteso un oggetto con "intro" e "persone"');
  soloChiavi(dati, ['intro', 'persone'], '');

  let intro = null;
  if (dati.intro !== undefined && dati.intro !== null) {
    if (!oggetto(dati.intro)) throw errore('"intro" deve essere un oggetto (o null)');
    soloChiavi(dati.intro, ['titolo', 'testo', 'firma'], 'intro: ');
    const titolo = testo(dati.intro.titolo, 'intro.titolo');
    const corpo = paragrafi(dati.intro.testo, 'intro.testo');
    // la firma si accetta ma non si mostra
    if (testo(dati.intro.firma, 'intro.firma')) console.log('· chi siamo: la firma dell\'intro è compilata ma non si mostra');
    if (titolo || corpo.length) intro = { titolo, testo: corpo };
  }

  if (!Array.isArray(dati.persone)) throw errore('"persone" deve essere una lista');
  const visti = new Set();
  const persone = dati.persone.map((p, i) => {
    const dove = `persone[${i}]`;
    if (!oggetto(p)) throw errore(`${dove} deve essere un oggetto`);
    soloChiavi(p, ['id', 'nome', 'ruolo', 'ruolo_riga2', 'testo', 'foto'], `${dove}: `);
    if (typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id)) throw errore(`${dove}.id mancante o fuori da [a-z0-9-]`);
    if (visti.has(p.id)) throw errore(`${dove}.id "${p.id}" ripetuto`);
    visti.add(p.id);
    const qui = `${dove} (${p.id})`;
    const persona = {
      id: p.id,
      nome: testo(p.nome, `${qui}.nome`),
      ruolo: testo(p.ruolo, `${qui}.ruolo`),
      ruolo2: testo(p.ruolo_riga2, `${qui}.ruolo_riga2`),
      testo: paragrafi(p.testo, `${qui}.testo`),
      foto: foto(p.foto, `${qui}.foto`),
    };
    if (/^nome\b/i.test(persona.nome)) throw errore(`${qui}.nome: "${persona.nome}" sembra un segnaposto (il nome che non c'è si lascia a null)`);
    return persona;
  });

  chiSiamoLetto = { intro, persone, visibili: persone.filter((p) => p.nome && p.ruolo) };
  return chiSiamoLetto;
}

const attr = (s) => testoEsatto(s).replace(/"/g, '&quot;');
// "Sonia Ruggeri" → SR: prima lettera del primo e dell'ultimo nome
function iniziali(nome) {
  const parole = nome.split(/\s+/).filter(Boolean);
  const lettera = (w) => [...w][0].toLocaleUpperCase('it-IT');
  return parole.length > 1 ? lettera(parole[0]) + lettera(parole[parole.length - 1]) : lettera(parole[0]);
}
// «Sonia Ruggeri, titolare, Il Segreto di Villa Luzi»
const altPersona = (p) => `${p.nome}, ${p.ruolo.charAt(0).toLocaleLowerCase('it-IT')}${p.ruolo.slice(1)}, Il Segreto di Villa Luzi`;
const imgPersona = (p, chiusura) => `<img src="${attr(p.foto.src)}"${p.foto.srcset ? ` srcset="${attr(p.foto.srcset)}" sizes="${PERSONA_SIZES}"` : ''} alt="${attr(altPersona(p))}" loading="lazy" decoding="async"${chiusura}>`;
const vuotaPersona = (p, classi) => `<div class="${classi}" aria-hidden="true"><span class="persona-iniziali">${testoEsatto(iniziali(p.nome))}</span></div>`;

function sezioneChiSiamo(d) {
  const schede = d.visibili.map((p) => [
    `  <article class="persona reveal" data-persona="${p.id}">`,
    p.foto
      ? `    <div class="persona-foto">${imgPersona(p, '')}</div>`
      : `    ${vuotaPersona(p, 'persona-foto persona-foto-vuota')}`,
    `    <h3 class="persona-nome">${testoEsatto(p.nome)}</h3>`,
    `    <p class="persona-ruolo"><span>${testoEsatto(p.ruolo)}</span>${p.ruolo2 ? `<span>${testoEsatto(p.ruolo2)}</span>` : ''}</p>`,
    ...(p.testo.length ? ['    <div class="persona-testo">', ...p.testo.map((x) => `      <p>${testoEsatto(x)}</p>`), '    </div>'] : []),
    '  </article>',
  ].join('\n'));
  return [
    `<!-- CHI SIAMO: testi, nomi e foto da ${CHI_SIAMO_REL}, si cambiano lì -->`,
    '<section class="chi-siamo" id="chi-siamo">',
    '  <div class="chi-siamo-intro reveal">',
    ...(d.intro.titolo ? [`    <h2 class="chi-siamo-titolo">${testoEsatto(d.intro.titolo)}</h2>`] : []),
    ...(d.intro.testo.length ? ['    <div class="chi-siamo-testo">', ...d.intro.testo.map((x) => `      <p>${testoEsatto(x)}</p>`), '    </div>'] : []),
    '  </div>',
    ...(schede.length ? ['  <div class="persone">', ...schede.map((x) => x.replace(/^/gm, '  ')), '  </div>'] : []),
    '</section>',
  ].join('\n');
}

// La sezione dello chef com'era prima di Chi siamo, per quando l'intro è
// vuota: stessa struttura, dati dalla scheda "chef". Il ruolo va su due
// righe, senza il middot di una volta.
function sezioneChef(p) {
  const parole = p.nome.split(/\s+/);
  const nome = parole.length > 1
    ? `${testoEsatto(parole.slice(0, -1).join(' '))} <em>${testoEsatto(parole[parole.length - 1])}</em>`
    : testoEsatto(p.nome);
  return [
    `<!-- CHEF GLASSMORPHISM CARD: dati dalla scheda "chef" di ${CHI_SIAMO_REL} -->`,
    '<section class="chef" id="chef">',
    '  <div class="chef-card reveal">',
    '    <div class="chef-card-photo">',
    ...(p.foto
      ? [`      ${imgPersona(p, ' /')}`, '      <div class="photo-frame"></div>']
      : [`      ${vuotaPersona(p, 'persona-foto-vuota')}`]),
    '    </div>',
    '    <div class="chef-card-content">',
    '      <div class="section-eyebrow">',
    '        <span class="line"></span>',
    '        <span class="eyebrow">Lo Chef</span>',
    '      </div>',
    '',
    '      <h2 class="chef-name">',
    `        ${nome}`,
    '      </h2>',
    `      <p class="chef-role">${testoEsatto(p.ruolo)}${p.ruolo2 ? `<br>${testoEsatto(p.ruolo2)}` : ''}</p>`,
    ...(p.testo.length ? ['', '      <div class="chef-bio">', ...p.testo.map((x) => `        <p>${testoEsatto(x)}</p>`), '      </div>'] : []),
    '',
    '    </div>',
    '  </div>',
    '</section>',
  ].join('\n');
}

function markerChiSiamo(nome, uso) {
  const d = chiSiamo();
  uso.chiSiamo.push(nome);
  if (nome === 'sezione') return d.intro ? sezioneChiSiamo(d) : '';
  if (nome === 'chef') {
    if (d.intro) return '';
    const chef = d.visibili.find((p) => p.id === 'chef');
    return chef ? sezioneChef(chef) : '';
  }
  throw new Error(`marker @chi-siamo:${nome} sconosciuto (ammessi: @chi-siamo:sezione, @chi-siamo:chef)`);
}

function verificaChiSiamo(uso) {
  if (!uso.chiSiamo.length) return [];
  const problemi = [];
  for (const parte of ['sezione', 'chef']) {
    const n = uso.chiSiamo.filter((x) => x === parte).length;
    if (n !== 1) problemi.push(`chi siamo: il marker @chi-siamo:${parte} compare ${n} volte (atteso 1): con l'intro vuota ${parte === 'chef' ? 'lo chef sparirebbe' : 'la sezione non avrebbe posto'}`);
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
            } else if (tipo === 'chi-siamo') {
              reso = markerChiSiamo(name, uso);
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
        if (!problemi.length) problemi.push(...verificaCarta(uso), ...verificaChiSiamo(uso));
        let rotta = false;
        // Una carta rotta si ripeterebbe a ogni marker: un messaggio solo.
        for (const problema of new Set(problemi)) {
          console.error(`✗ ${problema} — richiesto da ${path.relative(ROOT, src)}`);
          failed = rotta = true;
        }
        if (!problemi.length && HAS_MARKER.test(html)) {
          console.error(`✗ marker @include/@menu/@carta/@chi-siamo non risolto in ${path.relative(ROOT, src)} (nome fuori da [a-z0-9-])`);
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
  console.error('build FALLITA: marker non risolti, menù, carta o Chi siamo non validi.');
  process.exit(1);
}
console.log(`build ok → dist/ · ${copied} file copiati · ${withInclude} con include · ${PARTIALS.size} partial usati · ${menus} menù da content/ · carta in ${carte} pagine`);
