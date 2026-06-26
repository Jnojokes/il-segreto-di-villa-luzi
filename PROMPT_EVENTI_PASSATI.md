# PROMPT PER CLAUDE CODE — Eventi: sostituire le foto della sposa + "Eventi passati" immersivi

> Copia tutto ciò che segue (dal blocco "CONTESTO") e incollalo in Claude Code dalla **root** del repo `il-segreto-di-villa-luzi`.
>
> **Obiettivo (3 cose):** (1) **togliere le foto della "ragazza del matrimonio" (sposa/coppia)** dalla sezione eventi/matrimoni e metterne altre on-brand; (2) aggiungere su `/eventi/` una sezione **"Eventi passati"** con **selezione immersiva** (card che diventa glassmorphica + tocco "boule de neige"); (3) far **puntare quelle card alle vecchie landing** già esistenti.

---

## CONTESTO (leggi PRIMA i file reali, poi agisci)

Sito **Villa Luzi 1737**, statico multipagina. File rilevanti:
- `eventi/index.html` — pagina Eventi (hero, intro, tile Matrimoni/Privati/Corporate, media-band, cifre, cta-split). Oggi usa soprattutto foto di sale allestite (`gallery/eventi/1–6.webp`, `covers/eventi*.webp`, `heroes/eventi.webp`).
- `matrimoni/index.html` — pagina Matrimoni: **qui ci sono le foto della sposa/coppia** (vedi C1).
- `assets/css/site.css` — design system. **Token glass già esistenti**: `--glass-bg`, `--glass-edge`, `--glass-solid` (riusali per il glassmorphismo). Particelle: `wow-dust` (in `site.js`) e il globo `orb.js` — riferimento per il tocco "boule de neige".
- `assets/js/transition.js` — transizione di pagina (le card devono navigare con questa).
- `build.js` inietta `partials/header.html`/`footer.html` e copia in `dist/`. Dopo le modifiche, `node build.js` deve completare senza errori.

### Vincoli NON negoziabili
1. **Statico MPA, zero dipendenze, zero CDN.** Vanilla JS in IIFE.
2. **Crawler AI non eseguono JS:** le card "eventi passati" devono essere **link reali nel sorgente** (l'immersività è enhancement sopra).
3. **Niente volti AI.** Regola del brief: i volti generati in AI sono inaffidabili → per le sostituzioni usa **foto reali già nel repo** (spazi, parco, tavole, dettagli), non immagini AI con volti.
4. **Due pagine standalone** (`il-segreto/index.html`, `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`) hanno inline propri: non riscriverle (eventuali ritocchi con cautela).
5. **Rispetta `prefers-reduced-motion` e `Save-Data`.** Tono: sobrio, niente emoji, niente "casa" (usa dimora/villa).

---

## C1. Togliere le foto della sposa/ragazza e metterne altre

**Cosa sostituire** (foto che ritraggono la sposa/coppia — "la ragazza del matrimonio"):
- `assets/img/covers/matrimoni.webp` — *"Sposi nel salone affrescato… la sposa in avorio"* (usata in `matrimoni/index.html`).
- `assets/img/covers/matrimoni-nelle-marche.webp` — *"Sposi abbracciati sotto un ciliegio"* (usata in `matrimoni/index.html` e in `matrimoni-nelle-marche/`).
- **Video hero** `assets/video/band-matrimoni.mp4` + poster `assets/video/band-matrimoni-poster.webp` — hero di `matrimoni/index.html` (e tile "Eventi" nella home `index.html`): se mostra la sposa/coppia in primo piano, sostituiscilo.

**Come sostituire:**
- Cerca in **tutta** la sezione eventi/matrimoni (`eventi/`, `matrimoni/`, `matrimoni-nelle-marche/`, e il tile Eventi della home) ogni immagine/video che ha come soggetto **una sposa o una coppia** (controlla `alt`/poster/nomi file) e **sostituiscila** con un'immagine **on-brand senza modella/sposa**: spazi della dimora, parco, tavole allestite, dettagli floreali, mise en place.
- Attingi dal **pool reale già presente**: `assets/img/gallery/eventi/1–6.webp`, `assets/img/gallery/la-villa/*`, `assets/img/covers/eventi.webp`, `covers/eventi-privati.webp`, `covers/corporate.webp`, `heroes/eventi.webp`. Aggiorna gli `alt` di conseguenza (descrittivi e coerenti).
- Per l'hero video di matrimoni, se va rimosso, usa un'immagine/clip di **ambiente** (salone, loggiato, parco) già disponibile, oppure lascia un **placeholder commentato** se manca un'alternativa adatta (e segnalalo nel report).
- **Non** generare volti AI. Se servono scatti nuovi reali, indicane il bisogno nel report (li gestiamo a parte).

> **DA CONFERMARE da Francesco:** se "la ragazza del matrimonio" è **una foto specifica** non elencata qui, indicala. In assenza, sostituisci tutte le foto sposa/coppia come sopra.

## C2. Sezione "Eventi passati" su `/eventi/`

Aggiungi in `eventi/index.html` una nuova sezione **"Eventi passati"** (archivio), prima della cta-split finale. Sono **card che puntano alle vecchie landing già esistenti**:

| Evento | Data | Link (landing esistente) | Immagine |
|---|---|---|---|
| **White Party** | venerdì 19 giugno 2026, 20:30 | `/eventi/white-party/` | `assets/whiteparty/hero-1.jpg` (o `og-image.jpg`) |
| **Aperitivi in erba · 2 Giugno** — Pic Nic in Villa | 2 giugno 2026 | `/esperienze/aperitivi-in-erba/2-giugno-2026/` | `assets/img/covers/aperitivi-in-erba.webp` |
| **La Domenica al Segreto** *(ricorrente — includila solo se ha senso come "format", non come data passata)* | — | `/eventi/la-domenica/` | scegli una cover coerente già presente |

- Ordina dal più recente; mostra **data + titolo + una riga** (asciutta). Ogni card è un **link reale** (`<a href>`) alla landing → naviga con la transizione di pagina esistente.
- Metti i dati in un piccolo array in cima allo script (facile da aggiornare quando si aggiungono eventi). Determina "passato" dalla data rispetto a oggi, oppure tienilo statico se più semplice.
- Eyebrow/titolo sezione coerenti (es. *"Già successo"* / *"Le stagioni passate"*), tono sobrio.

## C3. Selezione immersiva (glassmorphica + "boule de neige")

Unisci le due idee che hai citato (card glass **e** tocco boule de neige):
- **Hover/focus:** la card prende il **trattamento glassmorphico** riusando i token esistenti (`--glass-bg`, `--glass-edge`, `--glass-solid`, `backdrop-filter: blur`), con `@supports` di fallback (fondo panna semi-opaco dove il blur non è supportato).
- **Selezione (clic):** **espansione immersiva** — la card cresce/diventa un pannello glass più ampio, con un **tocco di particelle "boule de neige"** (riusa lo stile `wow-dust`/`orb.js`: pulviscolo luminoso oro/avorio/corallo, glow morbido) **oppure** una breve **animazione SVG** legata al motivo della sfera; poi naviga alla landing.
- **Coerenza motivo:** le particelle/animazione richiamano la sfera della home (stessa palette e *feel*), così l'esperienza è riconoscibile.
- **Performance:** un solo RAF per l'effetto particelle, **cap** sul numero, **DPR cap 2**, pausa su `visibilitychange`.
- **Fallback `prefers-reduced-motion`/`Save-Data`:** niente espansione/particelle animate — la card resta statica (glass leggero o piatto) e **linka comunque**.
- **Accessibilità:** la card è un link reale, focalizzabile da tastiera, `:focus-visible` evidente; l'espansione **non** intrappola il focus e non blocca la navigazione.

---

## COSA NON TOCCARE
Logica/marker di `build.js`; nodi **JSON-LD**; le vecchie landing in sé (ci si **punta**, non si riscrivono); gli script inline delle 2 pagine standalone. Niente volti AI, niente emoji, niente "casa".

## CHECKLIST FINALE (eseguila e riportala)
1. `node build.js` ok; `dist/` rigenerato; nessun errore console.
2. **Foto:** nessuna foto della sposa/coppia resta nella sezione eventi/matrimoni (covers/matrimoni*.webp e hero video gestiti); sostituite con immagini on-brand reali; `alt` aggiornati; **nessun volto AI** introdotto.
3. **Eventi passati:** sezione presente su `/eventi/`; card = **link reali** alle landing (White Party, Aperitivi 2 giugno, ed eventuale La Domenica); funzionano e navigano con la transizione.
4. **Immersività:** hover → glass (token esistenti, con `@supports`); selezione → espansione + tocco boule de neige/SVG coerente con la sfera home; fallback reduced-motion/Save-Data ok.
5. A11y: card focalizzabili, `:focus-visible`, nessuna trappola di focus.

## OUTPUT ATTESO
- File toccati: `eventi/index.html` (sezione Eventi passati + eventuali foto), `matrimoni/index.html` e `matrimoni-nelle-marche/` (sostituzione foto sposa), home `index.html` (tile Eventi se usa il video sposa), `assets/css/site.css`/`home.css` (stili card immersive, riuso token glass), eventuale `assets/js/*` per l'effetto particelle delle card.
- Report con: foto sostituite (da → a) e relativi `alt`; se serve un asset nuovo reale (placeholder segnalato); voci dell'archivio "Eventi passati"; assunzioni prese.
- **Decisioni da confermare a Francesco:** se "la ragazza del matrimonio" è una foto specifica non elencata; se includere "La Domenica" tra gli eventi passati; stile dell'immersione (glass-expand vs animazione SVG) se preferisci uno solo.

Procedi. In caso di ambiguità reale, scegli l'opzione più sobria e coerente col brand e annotala nel report.
