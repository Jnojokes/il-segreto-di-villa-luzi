# REPORT_CHECK — Villa Luzi 1737

_Check di implementazione, allineamento, ordinamento sitemap e popolamento media._
Data: 2026-06-25 · Esito finale: **`node build.js && node check.js` → 0 FAIL** (28 PASS, 2 BLOCCATA·soft).

---

## 0. Sintesi esecutiva

| Fase | Esito |
|---|---|
| Fix build (bug critico) | ✅ `CONSEGNA_DEV` (35 GB) non viene più copiata in `dist/` |
| Fase 1 — Check baseline | ✅ censito (vedi §1) |
| Fase 2 — Navbar/stile | ✅ già allineata su tutte le pagine canoniche; solo le landing sparse erano fuori |
| Fase 3 — Ordinamento sitemap | ✅ 3 landing spostate sotto `/eventi/` + 301 |
| Fase 4 — Popolamento media | ✅ 8 hero + 24 cover (webp) + 2 loop video, su 25 pagine |
| Fase 5 — Pulizia | ✅ `assets/assets/` rimossa + 14 orfani eliminati |
| Fase 6 — Verifica finale | ✅ 0 FAIL, 0 asset mancanti, verifica visiva desktop+mobile |

---

## 1. Fase 1 — Check baseline (stato di partenza)

**Bug critico trovato subito:** `build.js` non escludeva `CONSEGNA_DEV` da `SKIP_ROOT`, quindi copiava 35 GB di sorgenti media in `dist/` → **disco pieno (ENOSPC), build in crash**. Era impossibile completare anche un solo build. Risolto come prima cosa (vedi §6.6 del prompt).

Dopo il fix, baseline `check.js`: **1 solo FAIL** = `/19-giugno/` (landing White Party, target annunci Meta — titolo/description/canonical/breadcrumb fuori standard + pixel Facebook `<img>` senza alt). Tutte le altre pagine PASS, con soli warning `[DA CONFERMARE]`.

- **Navbar/include:** tutte le pagine canoniche usavano già correttamente `<!-- @include:header -->` / `<!-- @include:footer -->`. Le uniche senza navbar erano le 3 landing sparse (`19-giugno`, `white-party-lista.html`, `la-domenica.html`) — gestite in Fase 3.
- **HEIC:** la cartella `_HEIC_ORIGINALI` contiene in realtà `.jpg`; **nessun file `.heic`** nel progetto → nessuna conversione HEIC necessaria.
- **Placeholder media:** ~42 `<div>` a gradiente dentro `.tile-media`/`.feature-card-media`/`.split-media` (molti sono tile di navigazione fra sezioni, riusabili) + hero senza sfondo fotografico.

---

## 2. Fase 2 — Navbar e stile

- Navbar = invariata. **`partials/header.html` e `partials/footer.html` non toccati** (verificato: `git diff` vuoto). Nessuna voce di menu aggiunta/rimossa/rinominata/riordinata.
- Le pagine relocate (Fase 3) sono state avvolte nella navbar/footer globali via marker `@include` + `assets/css/site.css`, mantenendo il loro design.
- Nessuna logica navbar spostata in JS: tutte le voci restano nel sorgente HTML servito.

---

## 3. Fase 3 — Ordinamento sitemap (landing sparse → /eventi/)

Scelta utente: **spostare sotto `/eventi/`** come pagine d'archivio (eventi ormai passati), allineate allo stile del sito, **senza toccare le voci di menu**.

| Prima | Dopo (cartella `index.html`) | Redirect 301 |
|---|---|---|
| `19-giugno/index.html` | `eventi/white-party/` | `/19-giugno` e `/19-giugno.html` → `/eventi/white-party/` (force) |
| `white-party-lista.html` | `eventi/white-party/lista/` | `/white-party-lista.html` → `/eventi/white-party/lista/` |
| `la-domenica.html` | `eventi/la-domenica/` | `/la-domenica.html` → `/eventi/la-domenica/` |

Per ognuna: `site.css` caricato, titolo a pattern, meta description 150–160, canonical/OG al nuovo URL, `BreadcrumbList`, ≥3 link interni contestuali, alt corretti. **Pixel/script Meta rimossi** (pagine d'archivio: niente tracking + risolve l'`<img>` pixel senza alt). I redirect 301 preservano l'eventuale traffico residuo degli annunci Meta verso `/19-giugno`.

Note cosmetiche (design landing, non bloccanti): su White Party il pill "Prenota ora" appare bianco anziché oro (la landing ridefinisce `.topbar-cta` nel proprio `<style>`); su La Domenica lo splash introduttivo a tutto schermo copre la navbar per ~2,6 s all'avvio (animazione originale della pagina).

---

## 4. Fase 4 — Popolamento media

**Selezione con criterio** (NON tutti i file): un agente per sezione ha ispezionato visivamente le cartelle `CONSEGNA_DEV/FOTO_WEB` e scelto gli scatti più forti per qualità/composizione/coerenza cromatica. **Conversione/ottimizzazione** in `.webp` (cwebp/sips): hero ≤2000px, cover ≤1280px, mai upscaling. **Video** (ffmpeg): loop hero senza audio + poster.

### Asset prodotti
- `assets/video/home-hero.mp4` (3.0M) + `.webm` (6.3M) + `home-hero-poster.webp` — aereo della villa fra i pini (`VL_AERO_VILLA-COLLINE_LATER`).
- `assets/video/hero-bg.mp4` (2.0M) + `.webm` (2.3M) — tavola apparecchiata del ristorante; **risolve l'hero rotto della pagina BLOCCATA `/il-segreto/`** (file referenziati ma mancanti) **senza modificarne il markup**.
- `assets/img/heroes/` — 8 hero: la-villa, soggiornare, il-luogo, esperienze, eventi, menu, contatti, come-arrivare.
- `assets/img/covers/` — 24 cover per i tile/feature-card di tutte le sezioni e sottopagine.

### Pagine popolate (25)
Home (hero video + 3 feature-card), la-villa (hero + 3 tile), il-luogo, journal (+ cucina-del-segreto, i-ventuno-luoghi), soggiornare (+ camere, room-villa, suite-villa), offerte, il-segreto/menu, esperienze (+ aperitivi-in-erba, yoga-e-benessere, il-parco), eventi (+ matrimoni, eventi-privati, corporate), matrimoni-nelle-marche, contatti, come-arrivare, informazioni-utili, faq.

Per ogni pagina: i `<div>` a gradiente sostituiti con `<img …loading="lazy" decoding="async">` (cornice `.photo-frame` mantenuta), hero dotato di sfondo fotografico (`<img class="hero-bg-img">` o `<video>` per la home) con overlay per la leggibilità, `og:image` aggiornato a un media reale. Le `<img>` reali già presenti (es. `dish-tartare.png`, `chef-villa-luzi.png`) sono state lasciate intatte. **0 placeholder a gradiente residui** nelle pagine non bloccate.

Tutti gli `alt` sono descrittivi e in italiano (testo derivato dall'ispezione reale dell'immagine).

---

## 5. Fase 5 — Pulizia media

- **`assets/assets/`** (24 file, duplicato 1:1 della root, **referenziato da nessuno**) → rimossa.
- **14 orfani** eliminati (nessun riferimento in HTML/CSS/JS): `assets/cena-in-bianco/*` (8, promo evento passato), `assets/img/locandina_popup.jpg`, `assets/logo.svg` (la pagina usa `logo.webp`), `assets/whiteparty/alternates/champagne-lifestyle-9x16.jpg`, `assets/.DS_Store`, e 3 cover generate ma non usate (`home`, `il-segreto`, `la-villa-interni` — gli slot avevano già immagini reali).
- Tutte le eliminazioni sono **recuperabili da git**. `CONSEGNA_DEV/` resta intatta come archivio sorgente (esclusa dal build).
- Risultato: 0 asset mancanti referenziati; `assets/` 53M, `dist/` 61M.

---

## 6. Fase 6 — Definition of Done

- [x] `node build.js && node check.js` → **0 FAIL** (28 PASS, 2 BLOCCATA·soft).
- [x] `dist/` **non** contiene `CONSEGNA_DEV/` né file `.heic`.
- [x] **Navbar identica** alla fonte: `partials/header.html` non modificato, nessuna voce cambiata, menu nel sorgente HTML.
- [x] **Pagine BLOCCATE intatte** (`il-segreto/index.html`, `…/2-giugno-2026/index.html`): `git diff` vuoto. (L'hero di `/il-segreto/` ora funziona perché i video referenziati esistono, senza toccare il markup.)
- [x] **Nessun placeholder a gradiente residuo** nelle pagine non bloccate dove era previsto un media.
- [x] Ogni `<img>` ha `alt`; **nessun asset 404**; `og:image` puntano a media reali.
- [x] Link interni contestuali ≥3/pagina; sitemap ordinata; landing sistemate sotto `/eventi/` + 301.
- [x] Peso ragionevole: immagini `.webp` ottimizzate, hero con poster, loop video <6.5M.
- [x] **Verifica visiva** (Chrome headless, desktop 1440px + mobile 390px): home, la-villa, il-luogo, soggiornare, esperienze, eventi, contatti, menu, white-party, la-domenica — hero fotografici leggibili, tile popolati, navbar/drawer corretti.

### Warning residui (non bloccanti, attesi)
- **48 `[DA CONFERMARE: …]`**: testi/dati da confermare col cliente (orari, tariffe, capienze, date). Sono volutamente warning, non FAIL: vanno risolti con i contenuti reali quando disponibili, non inventati.
- **2 asset soft sulla pagina BLOCCATA `/il-segreto/`**: `baroque_card.jpg` / `editorial_web.jpg` (referenziati nel markup freezato della pagina `2-giugno-2026` e `il-segreto`). Non si toccano per via del design freeze; restano warning soft.

---

## 7. File modificati (sintesi)

- `build.js` — `CONSEGNA_DEV` + documenti di lavoro aggiunti a `SKIP_ROOT`.
- `netlify.toml` — 4 redirect 301 per le landing relocate.
- 24 pagine `index.html` popolate con media reali.
- 3 landing relocate (`git mv`, history preservata): `eventi/white-party/`, `eventi/white-party/lista/`, `eventi/la-domenica/`.
- Nuovi: `assets/img/heroes/`, `assets/img/covers/`, `assets/video/`.
- Rimossi: `assets/assets/` (24) + 14 orfani.

> Niente commit/push eseguito. `CONSEGNA_DEV/` resta in repo come archivio (non pubblicata).
