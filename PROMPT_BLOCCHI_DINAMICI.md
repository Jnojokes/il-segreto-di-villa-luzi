# PROMPT — Ampliamento libreria blocchi & boost dell'esperienza (Villa Luzi 1737)

> **Cosa devi consegnare:** non un semplice "ritocco", ma un **ampliamento della libreria di blocchi/sezioni** del sito statico `il-segreto-di-villa-luzi`, con l'obiettivo di **eliminare la monotonia** (oggi troppe pagine usano gli stessi 3-4 blocchi identici), **valorizzare al massimo i media** (foto e video della cartella `CONSEGNA_DEV`) e **aumentare la dinamicità dell'esperienza** di navigazione — **senza mai toccare la pagina del Segreto**.
>
> Lavora sul codice reale del repository. Ogni blocco nuovo deve essere riutilizzabile, accessibile, SEO/AI-crawler friendly e deve continuare a far passare `check.js`.

---

## 0. Ruolo e obiettivo

Sei uno **sviluppatore frontend + designer di sistema** che interviene su un sito statico HTML/CSS/JS a zero dipendenze.

Obiettivo in una frase: **trasformare un sito che "risulta confusionario perché troppe informazioni sono uguali e i blocchi sono noiosi" in un sito vario, ritmato e media-first**, dove ogni pagina ha una propria identità visiva pur restando coerente con il brand.

Non stai riscrivendo i contenuti né cambiando l'architettura: stai **aumentando il vocabolario di sezioni disponibili** e **ridistribuendo i media** in modo che nessuna pagina assomigli alla precedente.

---

## 1. Vincoli inviolabili (NON NEGOZIABILI)

1. **NON toccare la pagina del Segreto.** I file BLOCCATI restano intatti, byte per byte:
   - `il-segreto/index.html`
   - `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`
   Non modificarne HTML, CSS inline, script inline o media collegati. Se un nuovo blocco/stile globale rischia di alterarne la resa, **isola lo stile** (classi nuove, mai modifica di selettori già usati da quelle pagine).
2. **NON cambiare le voci del menu** (`partials/header.html` e drawer mobile): label, ordine e link dei 6 dropdown restano identici. Puoi aggiungere link contestuali *dentro le pagine*, mai nella navbar.
3. **La navbar resta nell'HTML sorgente**, non iniettata via JS (crawler GPTBot/ClaudeBot/PerplexityBot non eseguono JS). Stesso principio per i contenuti dei nuovi blocchi: **il testo e i link reali devono stare nell'HTML**, mai generati solo a runtime.
4. **Zero dipendenze.** Niente npm install, niente framework, niente librerie esterne. Solo HTML, CSS e il `assets/js/site.js` esistente (puoi estenderlo, vedi §6). Niente CDN.
5. **Non rompere la build.** I marker `<!-- @include:header -->` / `<!-- @include:footer -->` restano funzionanti; `node build.js` deve completare senza marker irrisolti.
6. **`check.js` deve continuare a passare** su tutte le pagine non-BLOCCATE (vedi §7 — Definition of Done). In particolare: **niente `accordion`, `tab` o `<details>` su contenuti sostanziali** — la varietà si ottiene con layout e media, non nascondendo informazioni.
7. **`CONSEGNA_DEV/` non finisce mai in `dist/`.** È solo la sorgente dei media: i file scelti vanno ottimizzati e copiati in `assets/img/` (o `assets/video/`), poi referenziati.
8. **Una sola `<h1>` per pagina**, gerarchia heading senza salti, `alt` su ogni immagine, `prefers-reduced-motion` rispettato (vedi §6).

---

## 2. Diagnosi dello stato attuale (perché il sito annoia)

La libreria di blocchi oggi esistente in `assets/css/site.css` è limitata e ripetuta quasi identica su ogni pagina:

| Blocco esistente | Classe | Problema |
|---|---|---|
| Hero | `.hero`, `.hero--compact` | Sempre stessa struttura: eyebrow + titolo + tagline + CTA. |
| Split testo/media | `.split` (`.split-media` + `.split-body`) | Onnipresente, sempre 50/50, sempre lo stesso ritmo. |
| Griglia tile | `.tile-grid` (`.tile`) | Card uguali ovunque, media spesso placeholder gradiente. |
| Griglia feature | `.feature-grid` (`.feature-card`) | Variante quasi identica della tile. |
| Griglia info | `.info-grid` (`.info-cell`) | Tabellina di dati ripetuta. |
| Prosa | `.prose` | Muro di testo. |
| Chiusura/CTA | `.closing` | Identica su tutte le pagine. |
| FAQ | `.faq` | Ok ma usata come riempitivo. |

**Conseguenza:** scorrendo due pagine qualunque si vede la stessa sequenza `hero → split → tile-grid → closing`. È questo il "confusionario perché tutto è uguale" segnalato. **L'intervento principale è dare ritmo e varietà**, non aggiungere testo.

> Prima di iniziare, fai un censimento: per ogni pagina non-BLOCCATA elenca la sequenza di blocchi attuale. Salva la tabella in `REPORT_BLOCCHI.md`. Servirà per garantire che **nessuna pagina ripeta la stessa sequenza della pagina sorella** (§5).

---

## 3. Nuova libreria di blocchi (catalogo da implementare)

Implementa i blocchi seguenti come **componenti CSS riutilizzabili** in `assets/css/site.css` (nuove classi, mai sovrascrivere quelle usate dalle pagine BLOCCATE). Ogni blocco deve essere **media-first**, responsive e degradare in modo elegante senza JS.

Per ciascun blocco: definisci la classe, l'HTML di riferimento, le regole responsive e dove si usa. Non serve usarli tutti su ogni pagina — servono come **palette** da cui pescare per dare varietà.

### 3.1 `editorial-feature` — figura editoriale full-bleed
Immagine grande a tutta larghezza (o quasi) con blocco testo sovrapposto/affiancato in posizione asimmetrica. Spezza il ritmo dello split 50/50.
- Varianti: testo a sinistra-basso, a destra-alto, su overlay scuro.
- Media: foto orizzontali di alta qualità (es. esterni Villa, parco).

### 3.2 `gallery-mosaic` — mosaico fotografico irregolare
Griglia a masonry/CSS-grid con celle di dimensioni diverse (1×1, 2×1, 1×2). Sostituisce la `tile-grid` quando il contenuto è prevalentemente visivo.
- Niente lightbox JS obbligatorio; se aggiunto, dev'essere progressive enhancement.
- Ogni `<img>` con `alt`, `loading="lazy"`, `decoding="async"`.

### 3.3 `media-band` — fascia immersiva con video o foto di sfondo
Fascia full-width con **video di sfondo** (dove `CONSEGNA_DEV/VIDEO/<sezione>` lo fornisce) o foto fissa, testo breve centrato. `muted`, `loop`, `playsinline`, `autoplay` solo se leggero; **fallback poster** sempre presente. Disattiva l'autoplay con `prefers-reduced-motion`.

### 3.4 `stat-strip` — striscia di numeri/credenziali
Riga orizzontale di 3-4 dati forti (es. "1737 · anno di fondazione", "21 tappe", "X ettari di parco") con **counter animato** allo scroll (CSS/JS leggero). Rimpiazza l'`info-grid` quando i dati sono pochi ma d'impatto.

### 3.5 `timeline-steps` — percorso a tappe verticale/orizzontale
Per contenuti sequenziali (es. "le 21 tappe", il percorso esperienziale, il flusso di un matrimonio). Step numerati con micro-illustrazione o foto per tappa. **Contenuto sempre visibile** (niente accordion).

### 3.6 `quote-feature` — citazione/voce d'autore
Blocco tipografico ampio con citazione (chef, ospite, storia della Villa), foto ritratto a lato. Dà respiro tra due blocchi densi.

### 3.7 `card-offset` — card sfalsate (zig-zag)
Sequenza di 2-3 card alternate sinistra/destra con media grande: alternativa narrativa allo `split` ripetuto. Ogni card può avere CTA propria.

### 3.8 `pillars` — 3 colonne icona+claim
Per valori/servizi sintetici (es. "Soggiornare / Vivere / Celebrare"). Più arioso della `feature-grid`.

### 3.9 `cta-split-image` — chiusura ricca con immagine
Variante della `.closing` con metà immagine e metà invito all'azione, così la chiusura **non è identica** su ogni pagina. Mantieni comunque una `.closing` "sobria" come alternativa, per alternare.

### 3.10 `pull-gallery` / `marquee-strip` — nastro orizzontale di immagini
Striscia scorrevole (CSS animation o scroll-snap) di foto secondarie: ottima per "atmosfera" senza appesantire. Pausa on-hover, rispetta reduced-motion.

> **Regola di accessibilità per tutti:** ogni blocco deve essere navigabile da tastiera, avere contrasto adeguato sul testo sopra le immagini (overlay/gradient quando serve), e non veicolare informazione **solo** tramite movimento o colore.

---

## 4. Uso ottimale dei media (`CONSEGNA_DEV` → `assets/`)

Mappatura sezione → pagina (riusa quella già stabilita nel prompt di check). Per ogni pagina:

1. **Scegli i media migliori** dalla sottocartella corrispondente; non usarli tutti. Privilegia foto nitide, orizzontali per band/feature, verticali per mosaici.
2. **Converti gli originali HEIC** in `webp` (preferito) o `jpg` ottimizzato; risoluzioni multiple se il blocco lo richiede.
3. **Usa i video dove esistono** (`VIDEO/00_HOME`, `VIDEO/06_EVENTI`, ecc.) nei blocchi `media-band`/hero, sempre con poster di fallback e leggeri.
4. **Sostituisci i placeholder gradiente** (`.photo-frame`, `notice-placeholder`) con media reali dove disponibili. Pattern immagine reale:
   ```html
   <figure class="...-media">
     <img src="/assets/img/<sezione>/<file>.webp" alt="<descrizione concreta>" loading="lazy" decoding="async" width="..." height="..." />
   </figure>
   ```
   Imposta sempre `width`/`height` per evitare layout shift (CLS).
5. **Niente media non usati in `dist/`:** ottimizza solo ciò che referenzi; elimina dagli asset i file rimasti orfani a fine lavoro.
6. **Didascalie/`alt` significativi**, mai "immagine1". L'`alt` descrive la scena (luogo, soggetto), utile a SEO e screen reader.

> Per le pagine prive di foto dedicate in `FOTO_WEB` (es. Home e Eventi hanno solo VIDEO), usa i video come elemento dominante e attingi a foto coerenti da sezioni affini per i blocchi secondari, marcando con `[DA CONFERMARE: media]` se incerto.

---

## 5. Strategia anti-ripetizione (il cuore della richiesta)

Questa è la parte che risolve "tutto è uguale". Applica regole di **ritmo e differenziazione**:

1. **Budget per pagina:** ogni pagina usa 5-8 blocchi, di cui **almeno 3 tipi diversi** dalla pagina-sorella più vicina nel menu.
2. **Nessuna sequenza duplicata:** due pagine non possono aprire con lo stesso identico schema. Alterna l'apertura tra: hero classico, `media-band` video, `editorial-feature`.
3. **Alternanza obbligatoria di densità:** dopo un blocco "denso" (prosa, info, timeline) deve seguire un blocco "respiro" (quote, gallery, band). Mai due muri di testo consecutivi.
4. **Chiusura variata:** alterna `cta-split-image` e `.closing` sobria tra pagine adiacenti.
5. **Coerenza brand, non uniformità:** stessa palette, tipografia e spacing scale; varia **layout e media**, non l'identità.
6. **De-duplica i contenuti:** se la stessa informazione (es. indirizzo, claim, orari) compare identica su più pagine in blocchi pieni, lasciala una sola volta in forma estesa e altrove sintetizzala o linkala (link contestuale interno), così il sito smette di sembrare ripetitivo. Mantieni comunque ≥3 link interni contestuali per pagina (requisito `check.js`).

Documenta le scelte di sequenza per ogni pagina in `REPORT_BLOCCHI.md` (tabella: pagina → blocchi usati, in ordine).

---

## 6. Livello dinamico / motion (progressive enhancement)

Estendi `assets/js/site.js` (IIFE esistente) senza creare dipendenze. Le pagine BLOCCATE hanno script propri: **non toccarle**.

Comportamenti da aggiungere, tutti **CSS-first / arricchiti da JS**, e tutti dietro `@media (prefers-reduced-motion: no-preference)`:

1. **Reveal a stagger:** estendi l'IntersectionObserver `.reveal` esistente con un ritardo incrementale per figli (`--reveal-i`), così gallerie e griglie compaiono con cadenza.
2. **Counter animato** per `stat-strip` (conta fino al valore quando entra in viewport; valore reale presente nell'HTML come fallback testuale).
3. **Parallax leggero** (translateY sottile su media di band/feature) — solo transform, niente jank, disattivato in reduced-motion.
4. **Marquee/scroll-snap** per `pull-gallery` con pausa on-hover e on-focus.
5. **Micro-interazioni hover** su card/CTA (elevazione, reveal didascalia) via CSS.
6. **Hero/media-band video:** autoplay solo se `prefers-reduced-motion: no-preference` e connessione non `save-data`; altrimenti mostra il poster.

Regole motion: durate brevi (150-450ms), easing coerente (definisci 1-2 variabili CSS), nessun movimento che blocchi lo scroll o sposti il layout (CLS=0). Tutto deve funzionare e avere senso anche a JS disattivato.

---

## 7. Definition of Done (verifica finale)

Il lavoro è concluso quando **tutte** queste condizioni sono vere:

- [ ] `node build.js` completa senza errori e senza marker irrisolti.
- [ ] `node check.js` passa su **tutte** le pagine non-BLOCCATE (una sola `h1`, gerarchia heading, title/description/canonical/OG, lang="it", BreadcrumbList, ≥3 link interni, `alt` su ogni img, niente accordion/tab/`<details>` su contenuti sostanziali).
- [ ] Le 2 pagine BLOCCATE sono **invariate** (verifica con `git diff` — zero modifiche a `il-segreto/index.html` e `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`).
- [ ] Le voci di menu (header + drawer) sono **identiche** all'originale (`git diff partials/header.html` mostra solo eventuali aggiunte non-menu, idealmente nulla).
- [ ] Nessuna pagina ripete la stessa sequenza di blocchi della pagina-sorella (verifica con `REPORT_BLOCCHI.md`).
- [ ] Ogni pagina non-BLOCCATA usa **almeno 2 tipi di blocco nuovi** dalla §3.
- [ ] I placeholder gradiente sono sostituiti da media reali dove i media esistono; nessun media orfano in `assets/`; `CONSEGNA_DEV/` assente da `dist/`.
- [ ] `prefers-reduced-motion` rispettato; nessun layout shift visibile; il sito funziona con JS disattivato (contenuti e link presenti).
- [ ] Lighthouse/ispezione manuale: nessun calo evidente di performance (immagini con dimensioni, lazy-load, video leggeri).

---

## 8. Ordine di lavoro consigliato

1. **Censimento** blocchi attuali per pagina → `REPORT_BLOCCHI.md`.
2. **Implementa la libreria** §3 in `site.css` (classi nuove, isolate dalle pagine BLOCCATE) + estensioni motion §6 in `site.js`.
3. **Pianifica le sequenze** per pagina secondo §5 (alternanza, no-duplicati), annotandole nel report.
4. **Popola i media** §4: seleziona, converti, ottimizza, referenzia; sostituisci i placeholder.
5. **Applica i blocchi** pagina per pagina (escludendo sempre le BLOCCATE).
6. **Verifica** §7: build, check, `git diff` sulle pagine bloccate e sul menu, controllo visivo desktop+mobile, reduced-motion.
7. **Pulizia** media orfani e aggiornamento `REPORT_BLOCCHI.md` finale.

---

### Promemoria finale
- Più **varietà di layout e media**, non più testo.
- **Mai** la pagina del Segreto, **mai** le voci di menu.
- Tutto **nell'HTML sorgente**, zero dipendenze, `check.js` verde.
