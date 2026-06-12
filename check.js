#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   VILLA LUZI · check.js — validazioni Definition of Done (§8)
   su ogni index.html dentro dist/. Zero dipendenze.

   Pagine BLOCCATE (design freeze): solo controlli soft —
   JSON-LD parsabile e asset locali esistenti (warn, non fail).
   Tutte le altre pagine: checklist completa. Exit code 1 se
   almeno una pagina non bloccata fallisce.

   Uso:  node build.js && node check.js
   ───────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

const BLOCKED = new Set([
  'il-segreto/index.html',
  'esperienze/aperitivi-in-erba/2-giugno-2026/index.html',
]);

if (!fs.existsSync(DIST)) {
  console.error('dist/ non trovata: esegui prima `node build.js`.');
  process.exit(1);
}

// ── raccolta pagine ──
function collect(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, acc);
    else if (e.name === 'index.html') acc.push(p);
  }
  return acc;
}

// ── helper ──
const rel = (p) => path.relative(DIST, p).split(path.sep).join('/');

function stripChrome(html) {
  // Rimuove header/footer/aside globali, script e style: ciò che resta
  // è il contenuto contestuale della pagina.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');
}

function assetRefs(html) {
  const refs = new Set();
  const attrRe = /(?:src|href|poster|content)=["']([^"']+\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|css|js|woff2?))["']/gi;
  const urlRe = /url\(["']?([^"')]+\.(?:png|jpe?g|webp|avif|gif|svg))["']?\)/gi;
  let m;
  while ((m = attrRe.exec(html))) refs.add(m[1]);
  while ((m = urlRe.exec(html))) refs.add(m[1]);
  return [...refs].filter((r) => r.startsWith('/') && !r.startsWith('//'));
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);
  return blocks;
}

// ── checks ──
let anyFail = false;

for (const file of collect(DIST).sort()) {
  const page = rel(file);
  const html = fs.readFileSync(file, 'utf8');
  const blocked = BLOCKED.has(page);
  const errors = [];
  const warns = [];

  // JSON-LD parsabile (tutte le pagine, anche bloccate)
  const types = [];
  for (const [i, block] of jsonLdBlocks(html).entries()) {
    try {
      const data = JSON.parse(block);
      for (const node of Array.isArray(data) ? data : [data]) {
        if (node['@type']) types.push(String(node['@type']));
        if (Array.isArray(node['@graph'])) {
          for (const sub of node['@graph']) if (sub['@type']) types.push(String(sub['@type']));
        }
      }
    } catch (e) {
      errors.push(`JSON-LD #${i + 1} non parsabile: ${e.message}`);
    }
  }

  // Asset locali esistenti (fail per pagine nuove, warn per bloccate)
  for (const ref of assetRefs(html)) {
    const target = path.join(DIST, ref.split('#')[0].split('?')[0]);
    if (!fs.existsSync(target)) {
      (blocked ? warns : errors).push(`asset mancante: ${ref}`);
    }
  }

  if (!blocked) {
    // Contenuto contestuale: senza chrome (header/footer/aside), script, style.
    const body = stripChrome(html);

    // 1. Un solo <h1>
    const h1s = body.match(/<h1[\s>]/gi) || [];
    if (h1s.length !== 1) errors.push(`trovati ${h1s.length} <h1> (atteso 1)`);

    // 2. Gerarchia heading senza salti in discesa (solo contenuto: il
    //    chrome ha i suoi h4 di colonna footer, che non sono outline di pagina)
    const seq = [...body.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] > seq[i - 1] + 1) {
        errors.push(`salto di heading: h${seq[i - 1]} → h${seq[i]}`);
        break;
      }
    }

    // 3-4. <title> a pattern e meta description 150–160
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
    if (!title.includes('Villa Luzi 1737')) errors.push(`<title> senza "Villa Luzi 1737": "${title}"`);
    if (page !== 'index.html' && !/Villa Luzi 1737 · Treia, Marche/.test(title)) {
      errors.push(`<title> fuori pattern "{Pagina} · Villa Luzi 1737 · Treia, Marche": "${title}"`);
    }
    const descTag = (html.match(/<meta[^>]*name=["']description["'][^>]*>/i) || [])[0];
    // Cattura il valore di content fino alla virgoletta DELLO STESSO tipo che
    // l'ha aperto (backreference \1): così un apostrofo letterale dentro un
    // attributo fra doppi apici — es. "ritiri d'impresa" — non tronca il match.
    const descMatch = descTag && descTag.match(/content=(["'])([\s\S]*?)\1/i);
    const desc = descMatch ? descMatch[2] : undefined;
    if (desc == null) errors.push('meta description assente');
    else if (desc.length < 150 || desc.length > 160) {
      errors.push(`meta description di ${desc.length} caratteri (attesi 150–160)`);
    }

    // 5. canonical, OG, lang (regex insensibili all'ordine degli attributi)
    const canonTag = (html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];
    if (!canonTag || !/href=["']https:\/\/villaluzi1737\.it\//i.test(canonTag)) {
      errors.push('canonical assoluto assente');
    }
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
      if (!new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*>`, 'i').test(html)) {
        errors.push(`${prop} assente`);
      }
    }
    if (!/<html[^>]*lang=["']it["']/i.test(html)) errors.push('lang="it" assente');

    // 6. BreadcrumbList su ogni pagina tranne HOME
    if (page !== 'index.html' && !types.includes('BreadcrumbList')) {
      errors.push('BreadcrumbList assente nel JSON-LD');
    }

    // 7. ≥3 link interni contestuali (fuori da header/footer/aside/script)
    const internal = new Set(
      [...body.matchAll(/href=["'](\/[^"'#]*)["'#]/g)].map((m) => m[1].replace(/\/$/, '') || '/')
    );
    internal.delete('/' + page.replace(/\/?index\.html$/, '').replace(/\/$/, '') || '/');
    const contextual = [...internal].filter((h) => !/\.(css|js|png|jpe?g|webp|svg|ico|mp4|webm|xml|txt)$/.test(h));
    if (contextual.length < 3) {
      errors.push(`solo ${contextual.length} link interni contestuali (attesi ≥3)`);
    }

    // 8. Niente accordion/tab su contenuto sostanziale
    if (/<details[\s>]/i.test(body) || /class=["'][^"']*\b(accordion|tabs?)\b/i.test(body)) {
      errors.push('rilevato accordion/tab/details su contenuto');
    }

    // 9. img con alt descrittivo
    for (const img of body.match(/<img[^>]*>/gi) || []) {
      if (!/alt=["'][^"']+["']/.test(img)) {
        errors.push(`img senza alt descrittivo: ${img.slice(0, 80)}…`);
      }
    }
  }

  // 10. Censimento [DA CONFERMARE] (warn, mai fail: è il comportamento corretto)
  for (const m of html.matchAll(/\[DA CONFERMARE:?\s*([^\]]*)\]/g)) {
    warns.push(`[DA CONFERMARE: ${m[1].trim()}]`);
  }

  // ── report pagina ──
  // Nota: per le pagine bloccate gli unici "errors" possibili sono JSON-LD
  // non parsabile — segno che la build le ha corrotte: fail anche per loro.
  const tag = blocked ? (errors.length ? 'BLOCCATA·FAIL' : 'BLOCCATA·soft') : errors.length ? 'FAIL' : 'PASS';
  console.log(`${errors.length ? '✗' : '✓'} [${tag}] /${page}`);
  for (const e of errors) console.log(`    ERROR  ${e}`);
  for (const w of warns) console.log(`    warn   ${w}`);
  if (errors.length) anyFail = true;
}

process.exit(anyFail ? 1 : 0);
