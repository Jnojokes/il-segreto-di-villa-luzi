# REPORT_BLOCCHI — Villa Luzi 1737

_Ampliamento libreria blocchi & boost esperienza._ Data: 2026-06-25.

## 1. Censimento sequenze ATTUALI (prima dell'intervento)

Diagnosi confermata: quasi ogni pagina ripeteva `hero → lead → info-grid → split → info-grid → … → closing`. `info-grid` compariva 2–4× per pagina; `closing` identica ovunque. Da qui la sensazione di "tutto uguale".

| Pagina | Sequenza attuale |
|---|---|
| index.html (home) | hero → lead → info-grid → feature-grid → info-grid → info-grid → closing |
| la-villa | hero → info-grid ×… → closing |
| il-luogo | hero → info-grid → info-grid → split → info-grid → prose → closing |
| journal | hero → tile-grid → info-grid → closing |
| journal/i-ventuno-luoghi | hero → lead → split → info-grid → prose → closing |
| journal/cucina-del-segreto | hero → lead → split → info-grid → info-grid → closing |
| soggiornare | hero → lead → info-grid → split → split → info-grid → tile-grid → closing |
| soggiornare/camere | hero → lead → info-grid → info-grid → info-grid → closing |
| soggiornare/camere/room-villa | hero → lead → split → split → info-grid → tile-grid → closing |
| soggiornare/camere/suite-villa | hero → lead → info-grid → split → info-grid → tile-grid → closing |
| offerte | hero → info-grid → info-grid → prose → closing |
| il-segreto/menu | hero → lead → (sezioni menu custom) → closing |
| esperienze | hero → lead → info-grid → split → info-grid → info-grid → closing |
| esperienze/aperitivi-in-erba | hero → lead → info-grid → split → info-grid → faq → closing |
| esperienze/yoga-e-benessere | hero → lead → info-grid → split → info-grid → prose → info-grid → closing |
| esperienze/il-parco | hero → lead → info-grid → split → info-grid → info-grid → closing |
| eventi | hero → info-grid → info-grid → tile-grid → info-grid → closing |
| eventi/matrimoni | hero → lead → info-grid → split → info-grid → prose → info-grid → closing |
| eventi/eventi-privati | hero → info-grid → info-grid → split → info-grid ×3 → tile-grid → closing |
| eventi/corporate | hero → info-grid → info-grid → split → info-grid → tile-grid → info-grid → closing |
| matrimoni-nelle-marche | hero → lead → info-grid → info-grid → info-grid → prose → closing |
| contatti | hero → lead → info-grid → info-grid → info-grid → feature-grid → closing |
| come-arrivare | hero → info-grid → info-grid → split → info-grid → info-grid → closing |
| informazioni-utili | hero → info-grid → info-grid → info-grid → info-grid → prose → closing |
| faq | hero → lead → faq ×5 → closing |

_(BLOCCATE escluse byte-per-byte: `il-segreto/index.html`, `…/2-giugno-2026/`. Landing d'archivio con design proprio FUORI rework: `eventi/white-party/`, `eventi/white-party/lista/`, `eventi/la-domenica/`.)_

## 2. Nuova libreria (vedi §3 del prompt) — IMPLEMENTATA in `site.css` (righe 1484–1884)

Tutti i 10 blocchi del catalogo sono in `assets/css/site.css`, classi NUOVE e isolate (le pagine bloccate non linkano questo foglio):

| § | Blocco | Classe CSS | Media |
|---|---|---|---|
| 3.1 | editorial-feature | `.editorial-feature` (`--right`/`--bottom`) | 1 foto orizzontale full-bleed + parallax |
| 3.2 | gallery-mosaic | `.gallery-mosaic` (`.g-big`/`.g-wide`/`.g-tall`) | 6–8 foto |
| 3.3 | media-band | `.media-band` (`.media-band-bg` img/video) | video loop o 1 foto |
| 3.4 | stat-strip | `.stat-strip` (`.stat` + `data-count`) | nessuno (counter JS) |
| 3.5 | timeline-steps | `.timeline` (`.timeline-step`/`.timeline-num`) | opzionale 1 foto/step |
| 3.6 | quote-feature | `.quote-feature` (`.no-portrait`) | 1 ritratto opzionale |
| 3.7 | card-offset | `.offset-row` (`.offset-media`/`.offset-panel`, zig-zag) | 1 foto/riga |
| 3.8 | pillars | `.pillars` (`.pillar` + `.pillar-icon` svg) | icone inline |
| 3.9 | cta-split-image | `.cta-split` (`.cta-split-media`/`.cta-split-panel`) | 1 foto |
| 3.10 | marquee / pull-gallery | `.marquee`+`.marquee-track` / `.pull-gallery` | nastro di foto |

Motion in `site.js` (tutto dietro `prefers-reduced-motion: no-preference`): reveal stagger (`.reveal-group` + `--reveal-i`), counter (`[data-count]`), parallax leggero (`[data-parallax]`), marquee clone+pausa-hover, guardia autoplay video (`video[data-autoplay]` + save-data). Blocco CSS `@media (prefers-reduced-motion: reduce)` annulla tutto.

**Pagina pilota già completata:** `la-villa/index.html` = `hero → lead → stat-strip → editorial-feature → tile-grid → gallery-mosaic → prose → info-grid → cta-split`. È il riferimento d'oro per HTML/voce/media.

## 3. Piano sequenze NUOVE per pagina (anti-ripetizione §5)

Regole applicate: ogni pagina mantiene `hero (h1) + breadcrumb + lead`, poi **corpo variato**; ogni pagina usa **≥2 blocchi nuovi**; **pagine-sorelle differiscono** sul primo blocco di corpo e sull'intera sequenza; **chiusure alternate** `cta-split` (CTA) ↔ `closing` sobria (CL); dopo un blocco denso (prose/info/timeline) un blocco respiro (quote/gallery/band/stat). Legenda blocchi nuovi: EF·GM·MB·SS·TL·QF·CO·PI·CTA·MQ/PG.

| # | Pagina | Sequenza corpo (dopo hero+breadcrumb+lead) | Blocchi nuovi | Media |
|---|---|---|---|---|
| — | la-villa ✅ | SS → EF → tile-grid → GM → prose → info → CTA | SS,EF,GM,CTA | gallery/la-villa, covers |
| 1 | index (home) | PI → MB → tile-grid → SS → CTA | PI,MB,SS,CTA | home-hero video, covers, gallery |
| 2 | il-luogo | MB(video) → EF → GM → PI → info → CL | MB,EF,GM,PI | band-il-luogo.mp4, gallery/il-luogo(8) |
| 3 | journal | CO(articoli) → PG → CTA | CO,PG,CTA | covers articoli, gallery/menu |
| 4 | journal/i-ventuno-luoghi | TL(tappe) → QF → EF → CL | TL,QF,EF | gallery/il-luogo, covers |
| 5 | journal/cucina-del-segreto | EF → QF(chef) → GM(menu) → CTA | EF,QF,GM,CTA | chef-jan-paul-kana, gallery/menu |
| 6 | soggiornare | SS → EF → tile-grid → GM → CTA | SS,EF,GM,CTA | gallery/soggiornare, covers |
| 7 | soggiornare/camere | CO(room+suite) → PI(servizi) → QF → CL | CO,PI,QF | covers room/suite, gallery/soggiornare |
| 8 | soggiornare/camere/room-villa | EF → SS → PG → info → CTA | EF,SS,PG,CTA | gallery/soggiornare, cover room-villa |
| 9 | soggiornare/camere/suite-villa | MB(foto) → TL(giornata) → QF → info → CL | MB,TL,QF | cover suite-villa, gallery/soggiornare |
| 10 | offerte | CO(combinazioni) → SS → QF → CTA | CO,SS,QF,CTA | covers affini, gallery |
| 11 | il-segreto/menu | QF(chef) → [carte EXISTING preservate] → GM(menu) → CTA | QF,GM,CTA | chef, gallery/menu, dish/carta |
| 12 | esperienze | MB → tile-grid → GM → PI → CTA | MB,GM,PI,CTA | gallery/esperienze, covers |
| 13 | esperienze/aperitivi-in-erba | EF → TL(come funziona) → QF → info → CL | EF,TL,QF | gallery/esperienze, cover |
| 14 | esperienze/yoga-e-benessere | QF → CO(pratiche) → SS → CTA | QF,CO,SS,CTA | gallery/esperienze, cover yoga |
| 15 | esperienze/il-parco | GM → EF → TL(21 luoghi) → info → CL | GM,EF,TL | gallery/esperienze, gallery/il-luogo |
| 16 | eventi | PI(3 tipi) → MB → tile-grid → SS → CTA | PI,MB,SS,CTA | gallery/eventi, covers |
| 17 | eventi/matrimoni | MB(video) → EF → GM → TL(flusso) → CL | MB,EF,GM,TL | band-matrimoni.mp4, gallery/eventi |
| 18 | eventi/eventi-privati | EF → CO(tipi feste) → SS → QF → CTA | EF,CO,SS,QF,CTA | gallery/eventi, covers |
| 19 | eventi/corporate | SS → PI(servizi) → EF → info → CL | SS,PI,EF | gallery/eventi, cover corporate |
| 20 | matrimoni-nelle-marche | EF → QF → CO(perché Marche) → PI → CTA | EF,QF,CO,PI,CTA | cover, gallery/eventi, band-matrimoni |
| 21 | contatti | PI(modi) → EF → info(recapiti) → CTA | PI,EF,CTA | cover contatti, gallery |
| 22 | come-arrivare | TL(auto/treno/aereo) → SS(distanze) → EF → info → CL | TL,SS,EF | cover come-arrivare, gallery/il-luogo |
| 23 | informazioni-utili | PI(categorie) → SS → CO → info → CTA | PI,SS,CO,CTA | cover, gallery affini |
| 24 | faq | MB → faq(visibile) → QF → CTA | MB,QF,CTA | cover faq, gallery |

**Differenziazione sorelle verificata:** soggiornare{SS} / camere{CO} / room{EF} / suite{MB}; esperienze{MB} / aperitivi{EF} / yoga{QF} / il-parco{GM}; eventi{PI} / matrimoni{MB} / privati{EF} / corporate{SS}; journal{CO} / 21-luoghi{TL} / cucina{EF}; come-arrivare{TL} / informazioni-utili{PI}; la-villa{SS} vs il-luogo{MB}; matrimoni-nelle-marche{EF} vs eventi/matrimoni{MB}. Nessun primo-blocco-di-corpo ripetuto tra sorelle.

## 4. Stato applicazione — COMPLETO (24/24 pagine)

Tutte le 24 pagine non-bloccate sono state rilavorate secondo il piano §3 (la-villa era già la pilota). Censimento blocchi nuovi effettivamente presenti per pagina (≥2 richiesti):

| Pagina | n. blocchi nuovi | Blocchi |
|---|---|---|
| index (home) | 4 | pillars, media-band, stat-strip, cta-split |
| il-luogo | 4 | media-band(video), editorial-feature, gallery-mosaic, pillars |
| journal | 3 | card-offset, pull-gallery, cta-split |
| journal/i-ventuno-luoghi | 3 | timeline, quote-feature, editorial-feature |
| journal/cucina-del-segreto | 4 | editorial-feature, quote-feature(chef), gallery-mosaic, cta-split |
| soggiornare | 4 | stat-strip, editorial-feature, gallery-mosaic, cta-split |
| soggiornare/camere | 3 | card-offset, pillars, quote-feature |
| soggiornare/camere/room-villa | 4 | editorial-feature, stat-strip, pull-gallery, cta-split |
| soggiornare/camere/suite-villa | 3 | media-band, timeline, quote-feature |
| offerte | 4 | card-offset, stat-strip, quote-feature, cta-split |
| il-segreto/menu | 3 | quote-feature(chef), gallery-mosaic, cta-split (carte/piatti preservati) |
| esperienze | 4 | media-band, gallery-mosaic, pillars, cta-split |
| esperienze/aperitivi-in-erba | 3 | editorial-feature, timeline, quote-feature |
| esperienze/yoga-e-benessere | 4 | quote-feature, card-offset, stat-strip, cta-split |
| esperienze/il-parco | 3 | gallery-mosaic, editorial-feature, timeline |
| eventi | 4 | pillars, media-band, stat-strip, cta-split |
| eventi/matrimoni | 4 | media-band(video), editorial-feature, gallery-mosaic, timeline |
| eventi/eventi-privati | 5 | editorial-feature, card-offset, stat-strip, quote-feature, cta-split |
| eventi/corporate | 3 | stat-strip, pillars, editorial-feature |
| matrimoni-nelle-marche | 5 | editorial-feature, quote-feature, card-offset, pillars, cta-split |
| contatti | 3 | pillars, editorial-feature, cta-split |
| come-arrivare | 3 | timeline, stat-strip, editorial-feature |
| informazioni-utili | 4 | pillars, stat-strip, card-offset, cta-split |
| faq | 3 | media-band, quote-feature, cta-split (14 Q&A visibili, niente accordion) |
| la-villa (pilota) | 4 | stat-strip, editorial-feature, gallery-mosaic, cta-split |

**Esecuzione:** workflow `villa-luzi-blocchi` (pipeline rework→verifica, 24 pagine). 17 pagine rework+verifica passate dagli agent; 7 (esperienze, eventi/matrimoni, eventi/corporate, matrimoni-nelle-marche, come-arrivare, informazioni-utili, faq) hanno raggiunto il limite di sessione in fase di verifica ma il rework era completo: **verificate manualmente una per una** (check.js verde, fatti preservati, [DA CONFERMARE] intatti, voce coerente, blocchi corretti) — nessuna correzione necessaria. Unica correzione fatta da un agent: rimosso un nome di luogo non documentato («Vialetto Amore») in journal.

**Blocchi della libreria usati nel sito:** 10/11 varianti (tutte tranne `marquee`, di cui resta usata l'alternativa `pull-gallery`, equivalente §3.10 e migliore senza JS). Coerenza brand mantenuta (palette/tipografia/spacing invariati: variano solo layout e media).

## 5. Verifica finale — TUTTO VERDE

- ✅ `node build.js` → 170 file, 29 con include, nessun marker irrisolto.
- ✅ `node check.js` → **28 PASS + 2 BLOCCATA·soft, 0 FAIL** (exit 0). Restano solo i warning `[DA CONFERMARE]` attesi (dati da confermare col cliente).
- ✅ Pagine BLOCCATE invariate byte-per-byte (`git diff` vuoto su `il-segreto/index.html` e `…/2-giugno-2026/`).
- ✅ Menu invariato: `partials/header.html` mostra solo l'aggiunta non-menu `has-js` (+4 righe); link di menu 56→56 identici; `partials/footer.html` invariato.
- ✅ Ogni pagina usa ≥2 (in pratica 3–5) blocchi nuovi; nessuna sequenza identica alla sorella (primo blocco di corpo sempre diverso); chiusure alternate cta-split ↔ closing fra pagine adiacenti.
- ✅ 0 media orfani (95/95 referenziati); `CONSEGNA_DEV/` assente da `dist/`.
- ✅ Pulizia produzione: `PROMPT_BLOCCHI_DINAMICI.md` e `REPORT_BLOCCHI.md` finivano in `dist/` → aggiunti a `SKIP_ROOT` in `build.js` (come gli altri doc di lavoro). Ora `dist/` = 168 file, senza documenti interni.
- ✅ **No-JS fix**: `.reveal`/`.reveal-group` ora si nascondono solo con `.has-js` (toggle inline nel partial header), così a JS disattivato tutto il contenuto resta visibile (progressive enhancement, §6). `prefers-reduced-motion` già gestito (blocco CSS dedicato + guardie JS).
- ✅ CLS controllato via CSS (grid a righe fisse per i mosaici, `aspect-ratio` su offset/cta/portrait, media full-bleed in `position:absolute`); media non-hero con `loading="lazy" decoding="async"`; video band leggeri con poster + guardia autoplay/save-data.

