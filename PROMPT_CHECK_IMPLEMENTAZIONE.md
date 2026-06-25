# PROMPT — Check di implementazione completo, allineamento stile/navbar, ordinamento sitemap e popolamento media (Villa Luzi 1737)

> **Come usare questo prompt:** incollalo per intero a un agente di sviluppo che lavora **dentro la cartella del progetto** `il-segreto-di-villa-luzi/`. È un documento di istruzioni operative: l'agente deve eseguire le attività descritte, non limitarsi a commentarle. Lavora a piccoli passi, fa il build dopo ogni gruppo di modifiche e non procede se i check falliscono.

---

## 0. Ruolo e obiettivo

Sei un agente di sviluppo front-end senior. Il sito **Villa Luzi 1737** (`https://villaluzi1737.it/`) è un sito **statico in HTML puro**, costruito con un sistema di build **a zero dipendenze** in Node.js. Il sito è graficamente curato ma **incompleto**: la navbar e lo stile sono **disallineati** in alcune pagine e **mancano quasi tutti i media reali** (al loro posto ci sono placeholder a gradiente CSS).

Il tuo obiettivo, in un'unica passata ordinata e verificabile, è:

1. **Check di implementazione generico** di tutto il sito.
2. **Allineare navbar e stile** in modo coerente su tutte le pagine — **senza mai cambiare le voci di menu**.
3. **Ordinare l'intera sitemap**: sistemare le pagine sparse nella struttura corretta, allineandone lo stile, **senza toccare la struttura del menu**.
4. **Popolare interamente il sito con i media reali** presi dalla cartella `CONSEGNA_DEV/`, sostituendo i placeholder a gradiente.
5. **Selezionare i media con criterio** (NON usarli tutti) ed **eliminare quelli non utilizzati** da `assets/`.

**Lingua:** tutti i contenuti del sito sono in italiano. Mantieni l'italiano in testi, `alt`, titoli, meta.

---

## 1. Vincoli inviolabili (NON negoziabili)

Leggi questa sezione prima di toccare qualunque file.

1. **Le voci di menu NON si toccano.** La navbar è la fonte di verità in `partials/header.html`. Struttura, etichette, ordine e `href` delle voci (e dei dropdown) **devono restare identici**. Puoi correggere markup/CSS/allineamento, **mai** aggiungere, rimuovere, rinominare o riordinare le voci.

2. **Pagine in “design freeze” (BLOCCATE) — non modificarle.** In `check.js` sono elencate in `BLOCKED`:
   - `il-segreto/index.html`
   - `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`

   Queste pagine hanno script/stili inline propri e subiscono solo controlli “soft”. **Non alterarne contenuto, stile o markup.** Se devi inserire media, fallo solo se strettamente necessario e senza rompere il loro layout; in caso di dubbio, lasciale come sono.

3. **La navbar resta nell'HTML sorgente, mai iniettata via JS.** I crawler AI (GPTBot, ClaudeBot, PerplexityBot) non eseguono JavaScript: tutte le voci devono restare nel sorgente HTML servito (tramite gli include build-time). Non spostare il menu in `site.js`.

4. **Non introdurre dipendenze.** Niente `npm install` di librerie a runtime, niente framework. Il build deve restare `node build.js` puro. Strumenti CLI per la conversione immagini (es. `sharp`, `ffmpeg`) sono ammessi **solo in fase di preparazione media**, non come dipendenze del sito.

5. **Non rompere il sistema di build.** I marker `<!-- @include:header -->` e `<!-- @include:footer -->` devono restare nelle pagine che li usano. Non sostituire gli include con copie statiche dell'header.

6. **`CONSEGNA_DEV/` è una sorgente, non parte del sito pubblicato.** Non deve mai finire in `dist/` (vedi §6).

---

## 2. Architettura del progetto (mappa mentale)

Prima di agire, assicurati di aver compreso questi file. Leggili.

- **`build.js`** — copia la repo in `dist/` sostituendo i marker `@include` con `partials/header.html` e `partials/footer.html`. Le pagine senza marker vengono copiate byte-per-byte.
  - `SKIP_ROOT` = cartelle/file esclusi dal primo livello: `.git`, `.gitignore`, `.claude`, `.agents`, `dist`, `partials`, `Tappe`, `build.js`, `check.js`, `netlify.toml`, `skills-lock.json`, `package.json`, `package-lock.json`.
  - `SKIP_ANY` = `.DS_Store`, `node_modules` (esclusi a ogni profondità).
  - `SKIP_ROOT_PATTERNS` = `[/^Screenshot /]`.
  - **PROBLEMA NOTO:** `CONSEGNA_DEV` **non** è in `SKIP_ROOT` → oggi viene copiata in `dist/`. Va esclusa (vedi §6).

- **`check.js`** — validatore “Definition of Done” su ogni `index.html` in `dist/`. Esegui sempre `node build.js && node check.js`. Le pagine BLOCCATE hanno solo check soft.

- **`partials/header.html`** — navbar (desktop `topbar` + drawer mobile `mobile-nav`). **Fonte di verità del menu.**

- **`partials/footer.html`** — footer globale.

- **`assets/`** — CSS (`assets/css/site.css`), JS (`assets/js/site.js`), immagini (`assets/img/`), video, audio. **Attenzione alla duplicazione** `assets/` vs `assets/assets/` (vedi §7).

- **`assets/js/site.js`** — comportamenti condivisi (scroll reveal, stato topbar, nav mobile, sticky CTA, marcatura voce attiva, newsletter stub). Le pagine BLOCCATE non lo usano.

- **`CONSEGNA_DEV/`** — sorgente dei media reali, divisa per sezione (vedi §5).

---

## 3. FASE 1 — Check di implementazione generico

Esegui questo censimento **prima** di modificare, e produci un breve report (`REPORT_CHECK.md` nella root) con l'esito.

1. **Build pulito:** `node build.js && node check.js`. Annota ogni `FAIL`, `warn`, e ogni `[DA CONFERMARE: ...]` censito.

2. **Inventario pagine:** elenca tutti gli `index.html` e tutte le pagine `.html` sparse nella root (es. `19-giugno*`, `la-domenica.html`, `white-party-lista.html`). Per ognuna annota: titolo, presenza marker `@include`, se è BLOCCATA, se ha media reali o placeholder.

3. **Coerenza Definition of Done** (replica le regole di `check.js`) per ogni pagina **non bloccata**:
   - un solo `<h1>`; gerarchia heading senza salti in discesa;
   - `<title>` contiene `Villa Luzi 1737`; pagine non-home seguono il pattern `{Pagina} · Villa Luzi 1737 · Treia, Marche`;
   - `meta description` 150–160 caratteri;
   - `<link rel="canonical">` assoluto su `https://villaluzi1737.it/`;
   - OG tag presenti: `og:title`, `og:description`, `og:image`, `og:url`;
   - `<html lang="it">`;
   - `BreadcrumbList` nel JSON-LD (tranne home);
   - ≥3 link interni contestuali;
   - nessun `accordion`/`tab`/`<details>` su contenuto sostanziale;
   - ogni `<img>` ha `alt` descrittivo.

4. **Censimento placeholder media:** trova tutti i `div` con `background:linear-gradient(...)` usati dentro `.feature-card-media`, `.tile-media`, `.split-media`, gli hero senza immagine/video, e ogni `<span class="photo-frame">` che non affianca un media reale. Questi sono i punti da popolare in Fase 4.

5. **Censimento `[DA CONFERMARE: ...]`:** elencali tutti. Sono testi/asset da confermare; non inventare contenuti — vanno trattati come segnaposto da risolvere con media reali dove possibile, altrimenti lasciati come warning.

---

## 4. FASE 2 — Allineamento navbar e stile

1. **Navbar:** verifica che **ogni** pagina non bloccata includa l'header via marker `<!-- @include:header -->` subito dopo `<body>` e il footer via `<!-- @include:footer -->`. Se una pagina ha una copia statica/disallineata dell'header, sostituiscila con il marker. **Non modificare le voci.**

2. **Stato attivo del menu:** assicurati che ogni link abbia il corretto `data-route` (già gestito da `site.js` per `aria-current="page"` e `.is-section`). Non duplicare la logica.

3. **Coerenza stile:** allinea le pagine al sistema visivo condiviso (`assets/css/site.css`) — variabili colore (`--oro`, `--oro-soft`, `--avorio`), classi media (`.feature-card-media`, `.split-media`, `.tile-media`, `.photo-frame`), classi `.reveal` per gli ingressi. Rimuovi stili inline ridondanti che divergono dal CSS globale, **eccetto** nelle pagine BLOCCATE.

4. **Responsive:** verifica topbar/drawer mobile, sticky CTA (`#sticky-cta`) e dropdown desktop (pura CSS hover/focus-within) su breakpoint principali.

---

## 5. FASE 3 — Ordinamento sitemap (pagine sparse)

Obiettivo: **mettere in ordine le pagine sparse senza cambiare il menu.** La navbar definisce la struttura canonica delle URL:

```
/                         (home)
/la-villa/                · /il-luogo/ · /journal/
/soggiornare/             · /soggiornare/camere/ · /soggiornare/camere/room-villa/ · /soggiornare/camere/suite-villa/ · /offerte/
/il-segreto/   (BLOCCATA) · /il-segreto/menu/
/esperienze/             · /esperienze/aperitivi-in-erba/ · /esperienze/yoga-e-benessere/ · /esperienze/il-parco/
/eventi/                 · /eventi/matrimoni/ · /eventi/eventi-privati/ · /eventi/corporate/ · /matrimoni-nelle-marche/
/contatti/               · /come-arrivare/ · /informazioni-utili/ · /faq/
```

Azioni:

1. **Pagine root sparse** (`19-giugno*`, `la-domenica.html`, `white-party-lista.html`, ed eventuali altre non collegate dal menu): per ciascuna decidi e annota nel report:
   - se è una pagina **evento/landing storica** ancora valida → riportala sotto la sezione corretta (tipicamente `/eventi/...`) con struttura a cartella `index.html`, allineandone lo stile;
   - se è **obsoleta/duplicata** → proponi la rimozione (non eliminare definitivamente senza che risulti chiaramente orfana e superata; in caso di dubbio, escludila dalla pubblicazione aggiungendola a `SKIP_ROOT` invece di cancellarla).
   - **Non** aggiungerle al menu: l'ordinamento riguarda la struttura dei file e i link contestuali interni, non le voci di navigazione.

2. **Link interni:** dopo aver spostato/ordinato, aggiorna i link contestuali rotti. Ogni pagina deve mantenere ≥3 link interni contestuali validi.

3. **Coerenza URL:** preferisci sempre il pattern a cartella (`/sezione/pagina/index.html`) coerente con il menu.

---

## 6. FASE 4 — Popolamento media da `CONSEGNA_DEV/` (attività centrale)

I media reali sono in `CONSEGNA_DEV/`, divisi per sezione in due rami: `FOTO_WEB/` e `VIDEO/`.

### 6.1 Mappa sezione → pagina

| Cartella CONSEGNA_DEV | Pagina/e di destinazione |
|---|---|
| `VIDEO/00_HOME` | `/` (home, hero/loop) |
| `FOTO_WEB/01_LA_VILLA`, `VIDEO/01_LA_VILLA` | `/la-villa/` |
| `FOTO_WEB/02_IL_LUOGO` (incl. `CAROSELLI_EXTRA`, `TAPPA II–VI`), `VIDEO/02_IL_LUOGO` | `/il-luogo/` |
| `FOTO_WEB/03_ESPERIENZE`, `VIDEO/03_ESPERIENZE` | `/esperienze/` (+ `WELLNESS_VILLA_LUZI` → `/esperienze/yoga-e-benessere/`) |
| `FOTO_WEB/04_IL_SEGRETO`, `VIDEO/04_IL_SEGRETO` | `/il-segreto/` **(BLOCCATA — non toccare)** |
| `FOTO_WEB/04b_MENU` | `/il-segreto/menu/` |
| `FOTO_WEB/05_MATRIMONI`, `VIDEO/05_MATRIMONI` | `/eventi/matrimoni/` e `/matrimoni-nelle-marche/` |
| `VIDEO/06_EVENTI` (incl. `INAUGURAZIONE_VIDEO`) | `/eventi/` |
| `FOTO_WEB/07_SOGGIORNARE`, `VIDEO/07_SOGGIORNARE` | `/soggiornare/` (+ `/camere/`, `room-villa`, `suite-villa`) |
| `FOTO_WEB/08_COME_ARRIVARE`, `VIDEO/08_COME_ARRIVARE` | `/come-arrivare/` |
| `FOTO_WEB/10_CONTATTI` | `/contatti/` |

> Nota: non esistono foto `00_HOME` né `06_EVENTI` in `FOTO_WEB` (solo VIDEO). Per home/eventi usa frame/poster estratti dai video o foto correlate dalla sezione tematica più vicina.

### 6.2 Selezione dei media (NON usarli tutti)

Le cartelle sono enormi (es. `TAPPE_VILLA` 276 file, `WELLNESS .../FOTO` 240, `INTERNI ...IPHONE` 227). **Seleziona con criterio:**

- per ogni slot di pagina scegli **poche immagini forti** (hero: 1; carosello: 6–12; griglia: 3–8) — qualità, nitidezza, composizione, coerenza cromatica con la palette (`--oro`/`--avorio`/verdi profondi);
- preferisci orientamento adatto allo slot (landscape per hero/split, ratio coerente per le griglie);
- evita duplicati quasi-identici, foto sfocate, scarti.

### 6.3 Conversione e ottimizzazione

- **HEIC:** `04_IL_SEGRETO/.../_HEIC_ORIGINALI` (227 file) e ogni `.heic` non sono utilizzabili dal web. Converti i selezionati in `.webp` (o `.jpg` di fallback). Non copiare HEIC nel sito.
- **Ottimizza:** ridimensiona alle larghezze d'uso reali (hero ~2000px, card ~1200px, thumb ~800px), comprimi in `.webp`. Genera un poster `.webp` per ogni video usato come sfondo.
- **Video:** usa formati `.mp4`/`.webm` già pronti dove presenti; per i loop hero imposta `muted playsinline loop` e un `poster`.

### 6.4 Destinazione e naming

- Copia i media **selezionati e ottimizzati** in `assets/img/` (e video in `assets/video/` se esiste, altrimenti coerente con la struttura attuale). Nomi descrittivi in kebab-case (es. `la-villa-facciata.webp`, `il-luogo-viale-cipressi.webp`).
- **Non** referenziare mai percorsi dentro `CONSEGNA_DEV/`.

### 6.5 Pattern di sostituzione placeholder → media reale

Sostituisci i `div` a gradiente con il media reale, mantenendo la cornice decorativa:

```html
<!-- PRIMA (placeholder) -->
<div class="feature-card-media">
  <div style="position:absolute;inset:0;background:linear-gradient(135deg,#0a2d2f 0%,#0E3B3E 50%,#081E20 100%);"></div>
  <span class="photo-frame" aria-hidden="true"></span>
</div>

<!-- DOPO (media reale) -->
<div class="feature-card-media">
  <img src="/assets/img/la-villa-facciata.webp"
       alt="Facciata settecentesca di Villa Luzi al tramonto"
       loading="lazy" decoding="async" />
  <span class="photo-frame" aria-hidden="true"></span>
</div>
```

Regole:
- ogni `<img>` ha `alt` descrittivo in italiano (richiesto da `check.js`), `loading="lazy"` (tranne l'hero above-the-fold, che può essere `eager`/`fetchpriority="high"`), `decoding="async"`;
- mantieni `<span class="photo-frame">` dove presente;
- per gli hero senza media, inserisci immagine o video di sfondo coerente con il layout esistente, senza stravolgere il CSS;
- aggiorna gli `og:image` con un media reale rappresentativo della pagina (URL assoluto `https://villaluzi1737.it/assets/img/...`).

### 6.6 `CONSEGNA_DEV` fuori dal sito pubblicato

Aggiungi `CONSEGNA_DEV` a `SKIP_ROOT` in `build.js` così non finisce in `dist/`:

```js
const SKIP_ROOT = new Set([
  '.git', '.gitignore', '.claude', '.agents', 'dist', 'partials', 'Tappe',
  'build.js', 'check.js', 'netlify.toml', 'skills-lock.json',
  'package.json', 'package-lock.json',
  'CONSEGNA_DEV',            // sorgente media: non pubblicare
]);
```

> `CONSEGNA_DEV` resta nella repo come archivio sorgente, ma **non** viene copiata in `dist/`.

---

## 7. FASE 5 — Pulizia media inutilizzati

Dopo aver popolato le pagine:

1. **In `assets/`:** individua i media **non più referenziati** da nessuna pagina (vecchi placeholder esportati, immagini non usate). Verifica con una ricerca dei riferimenti (`src=`, `href=`, `url(...)`, `poster=`, `content=`) su tutte le pagine. Elimina i media orfani per alleggerire il sito (rispettando la richiesta: "elimina pure quelli che non utilizza").
2. **Duplicazione `assets/` vs `assets/assets/`:** consolida su un'unica cartella `assets/`. Sposta i file utili da `assets/assets/` in `assets/`, aggiorna i riferimenti, poi rimuovi `assets/assets/` se rimane orfana. Fai questo **con attenzione**, verificando i riferimenti pagina per pagina e rifacendo il build dopo.
3. **In `CONSEGNA_DEV/`:** **non** è necessario cancellare i sorgenti (sono archivio). La richiesta di eliminazione riguarda i media non utilizzati che pesano sul **sito pubblicato** (`assets/`/`dist/`). Se preferisci ridurre anche la repo, proponi prima la lista nel report e procedi solo dopo conferma.

> Cautela: l'eliminazione di file è irreversibile. Prima di rimuovere, genera nel report l'elenco esatto dei file candidati con prova che sono orfani. Per i percorsi protetti, se il sistema blocca la cancellazione, segnalalo invece di forzare.

---

## 8. FASE 6 — Verifica finale (Definition of Done)

1. `node build.js && node check.js` → **0 FAIL**. I `warn` residui (asset BLOCCATE soft, `[DA CONFERMARE]`) vanno elencati e giustificati.
2. **`dist/` non contiene `CONSEGNA_DEV/`** né file `.heic`.
3. **Navbar identica** alla fonte (`partials/header.html`): nessuna voce cambiata; menu nel sorgente HTML, non via JS.
4. **Pagine BLOCCATE intatte.**
5. **Nessun placeholder a gradiente** residuo nelle pagine non bloccate dove era previsto un media (tutti sostituiti o giustificati).
6. **Ogni `<img>` ha `alt`**, i media caricano (nessun 404), gli `og:image` puntano a media reali.
7. **Link interni** validi (≥3 contestuali/pagina), sitemap ordinata, pagine sparse sistemate.
8. **Peso pagina** ragionevole (immagini ottimizzate `.webp`, hero con `poster`).
9. **Verifica visiva**: per le pagine principali (home, la-villa, il-luogo, soggiornare, esperienze, eventi, contatti) controlla il rendering reale (screenshot/anteprima) su desktop e mobile.

Aggiorna `REPORT_CHECK.md` con: pagine modificate, media inseriti per pagina, media convertiti (HEIC→webp), file eliminati, warning residui, e checklist §8 spuntata.

---

## 9. Ordine di lavoro consigliato

1. Leggi `build.js`, `check.js`, `partials/header.html`, `partials/footer.html`, `assets/css/site.css`, `assets/js/site.js`.
2. `node build.js && node check.js` → baseline nel report (Fase 1).
3. Aggiungi `CONSEGNA_DEV` a `SKIP_ROOT` (§6.6).
4. Allinea navbar/stile e include su tutte le pagine non bloccate (Fase 2).
5. Ordina la sitemap / pagine sparse (Fase 3).
6. Sezione per sezione: seleziona → converti/ottimizza → copia in `assets/` → sostituisci placeholder (Fase 4). Build+check dopo ogni sezione.
7. Pulisci media inutilizzati e consolida `assets/` (Fase 5).
8. Verifica finale e report (Fase 6).

Procedi a piccoli passi, fa il build dopo ogni gruppo di modifiche, e **non** considerare il lavoro concluso finché `node check.js` non passa con 0 FAIL e i vincoli §1 sono tutti rispettati.
