# PROMPT — Landing Candle Experience (11 settembre 2026)

Prompt da incollare in Claude Code aperto sulla root della repo `il-segreto-di-villa-luzi`.

---

## Obiettivo

Crea la landing ads standalone `eventi/candle-experience/index.html` per la serata
**Candle Experience — Piano Solo · Music for Movies** di **venerdì 11 settembre 2026**,
seguendo esattamente le convenzioni di `eventi/cena-spettacolo-jazz/index.html`.

Quella pagina è il modello: leggila per prima e replicane l'impianto (struttura delle sezioni,
sistema CSS, barra sticky mobile, Meta Pixel, `data-cta`, JSON-LD). Non introdurre framework,
build step o dipendenze: HTML statico con CSS e JS inline, come tutte le landing eventi.

## Regole non negoziabili della landing ads

- **Un solo obiettivo di conversione**: il click su WhatsApp. Niente nav, niente header/footer
  globali, nessun link interno al sito. La pagina è la locandina che si può prenotare.
- **Canonical sul dominio live**: `https://www.villaluzi1737.com/eventi/candle-experience/`.
  Il `.it` è NXDOMAIN e romperebbe `og:image` nelle anteprime Meta.
- **Meta Pixel** `5285830348309655`: `PageView` in head + evento `Lead` su ogni click `a[href*="wa.me"]`,
  con `method: 'whatsapp'` e il `data-cta` come `content_name`, come nel jazz.
- **Un solo `<h1>`**, gerarchia heading senza salti, `alt` descrittivo su ogni `<img>` non decorativa,
  nessun accordion su contenuto sostanziale.
- **`<title>`** a pattern `… · Villa Luzi 1737 · Treia, Marche` e **meta description tra 150 e 160
  caratteri** (`check.js` fallisce fuori range).
- **Numero WhatsApp: `393803643888`** (Luana) — ⚠️ **non** il `393452419263` del ristorante usato
  in tutte le altre landing: le prenotazioni di questa serata passano da Luana. Verifica di non
  aver copiato il numero vecchio da `cena-spettacolo-jazz`. Testo precompilato dedicato alla
  serata, URL-encoded.

## I fatti della serata

Fonte: messaggio di Luana del 26/08/2026. **Nessun dato va inventato**: quello che manca resta
`[DA CONFERMARE]` (`check.js` fa il censimento di quei marker come warn, è il comportamento corretto).

| | Orario | Quota | Cosa comprende |
|---|---|---|---|
| Solo concerto | dalle 20,00 | € 20 | ingresso, calice di vino e fritto |
| Cena e concerto | dalle 21,00 | € 35, bevande escluse | menu 4 portate + dj set a seguire |

- Artista: **Franco Di Donatantonio**, pianoforte. Piano solo, colonne sonore da film.
- Il concerto è nel parco, a lume di candela.
- Menu della cena:
  - Antipasto — Flan di zucca, parmigiano e pancetta croccante
  - Primo — Ravioli ripieni di porcini e patate, crema al gorgonzola e mandorle
  - Secondo — Arista di maiale in foglie di vite, salsa all'uva, bieta rossa ripassata
  - Dolce
- Luogo: Il Segreto, Villa Luzi 1737 — Contrada Chiaravalle 49, 62010 Treia (MC).
- Prenotazione obbligatoria — WhatsApp **380 364 3888** (Luana).

### ⚠️ Ambiguità sull'orario — chiedi prima di scrivere

La locandina stampata dice **INIZIO ORE 20,30**; il messaggio dice ingresso concerto **ore 20**
e cena **ore 21**. La lettura che le riconcilia: ingresso 20,00 → concerto 20,30 → cena 21,00.
**Chiedi conferma all'utente** prima di fissare `startDate` e `doorTime` nello schema. Se non
risponde, usa quella lettura e segnala la scelta nel riepilogo finale.

## Palette e tipografia di questa serata

Il jazz è bordeaux e oro. Questa serata è **notte e oro**, coerente con la locandina:

```css
:root {
  --notte:       #080D1A;
  --blu:         #101B33;
  --blu-chiaro:  #1B2A4A;
  --oro:         #C5AB74;
  --oro-chiaro:  #E4CC94;   /* testo sopra le arti: serve più luce per l'AA */
  --oro-velato:  rgba(197, 171, 116, 0.42);
  --avorio:      #F4ECDC;
  --ambra:       #E9A94F;   /* il caldo delle candele, per gli accenti */
  --velo:        rgba(244, 236, 220, 0.78);
  --wa:          #25D366;
  --wa-ink:      #05301A;
}
```

`theme-color`: `#080D1A`. Font: gli stessi tre del jazz — Cinzel 400, Cormorant Garamond 400 +
italic, Inter 400/600 — caricati con preload + `display=swap` e fallback `<noscript>`.
Verifica il contrasto AA del testo oro sulle immagini: sopra le candele accese serve `--oro-chiaro`.

## Asset

Già in repo: `assets/candle-experience/locandina-candle-experience-1080x1350.jpg` e
`…-1805x2256.jpg` (4:5, logo Il Segreto in testata).

**Tutti gli asset sono già in `assets/candle-experience/` — non devi generarne nessuno:**

- `bg-candele-440.webp`, `-880.webp`, `-1240.webp` — banda pulita del campo di candele con villa e
  pianoforte, senza tipografia dentro (il testo va in HTML, mai in immagine).
- `og-cover.jpg` — 1200×628, già composta con titolo, data e le due quote.
- `logo-ls-320.webp` — lo stesso lockup delle altre serate.
- `locandina-candle-experience-1080x1350.jpg` e `-1805x2256.jpg` — la locandina del carosello,
  usala per il manifesto nel nastro di `eventi/index.html`.

Preload dell'hero con `imagesrcset`/`imagesizes` e `fetchpriority="high"`, come nel jazz.

## Struttura della pagina

1. **hero** — logo, occhiello `CANDLE EXPERIENCE`, titolo `PIANO SOLO`, sottotitolo
   `Music for Movies`, nome dell'artista, data e orario, le due quote, bottone WhatsApp
   (`data-cta="hero"`).
2. **le due formule** — due blocchi affiancati, non un listino: cosa comprende ciascuna,
   quota, orario. È la sezione che decide la conversione, va sopra il menu.
3. **il menù della cena** — le 4 portate con `portata` / `piatto` / `descrizione` come nel jazz,
   quota € 35 e la nota `bevande escluse`. Bottone WhatsApp (`data-cta="menu"`).
4. **la serata** — 3-4 righe di racconto: il pianoforte nel parco, le candele, il dj set a seguire.
   Registro dell'avviso del 27–28 agosto: si apre su un fatto concreto, nessun superlativo,
   nessun "scopri di più".
5. **le informazioni** — data e orari, le due quote, indirizzo completo, bottone WhatsApp
   (`data-cta="chiusura"`) e la nota `Si prenota con un messaggio.`
6. **barra sticky mobile** con il bottone WhatsApp (`data-cta="sticky"`).

## JSON-LD

Due blocchi, come nel jazz:

- **`MusicEvent`** — `name: "Candle Experience — Piano Solo"`, `startDate` con offset `+02:00`,
  `doorTime`, `eventAttendanceMode: OfflineEventAttendanceMode`, `eventStatus: EventScheduled`,
  `image` con l'URL assoluto della og-cover, `location` → `Place` con `PostalAddress` completo,
  `organizer` → `Organization` Villa Luzi 1737, `performer` → `Person` "Franco Di Donatantonio".
  **Due `Offer`** in array: `20` (solo concerto, `name: "Ingresso concerto"`) e `35`
  (`name: "Cena e concerto"`), `priceCurrency: "EUR"`, `availability: InStock`, `url` della landing.
- **`BreadcrumbList`** — Villa Luzi → Eventi → Candle Experience.

## Registrazioni da aggiornare

1. **`eventi/index.html`** — il nastro del tempo:
   - nel JSON-LD `ItemList`: porta `numberOfItems` da 7 a 8 e aggiungi la `ListItem` position 8
     con `startDate` e `url` della nuova landing;
   - nel markup: un nuovo `<li class="nastro-nodo">` in coda, con `<span class="nastro-mese">Settembre</span>`
     (è il primo nodo del mese), manifesto con `srcset` 440/880, `serata-quando`
     "Venerdì 11 settembre 2026", `serata-nome` "Candle Experience", una riga di sintesi.
2. **`llms.txt`** — riga "Serate in arrivo": togli le serate passate (agosto) e inserisci questa
   con data, orari, le due quote e cosa comprendono, nello stesso stile delle altre.
3. **`check.js`** — aggiungi `'eventi/candle-experience/index.html'` al set `BLOCKED`, nel gruppo
   "Landing ads standalone": senza questo il check fallisce su nav e link interni mancanti.
4. **`build.js`** — aggiungi `'PROMPT_LANDING_CANDLE_EXPERIENCE.md'` a `SKIP_ROOT`.
   ⚠️ Nota a margine: `PROMPT_CHECK_E_CORREZIONI.md`, `PROMPT_EVENTI_PASSATI.md`,
   `PROMPT_GLOBO_E_FARFALLE.md` e `PROMPT_ORB_RESTYLE.md` **finiscono pubblicati in `dist/`**
   perché non sono in `SKIP_ROOT`. Segnalalo e proponi di aggiungerli (o di sostituire la
   lista di nomi con un match su `/^(PROMPT|REPORT)_.*\.md$/`).

## Verifica prima di consegnare

```bash
node build.js && node check.js
```

Poi:
- apri `dist/eventi/candle-experience/index.html` e controlla che i tre bottoni WhatsApp e la barra
  sticky puntino a `wa.me/393803643888` con il testo precompilato giusto;
- valida i due JSON-LD (parsabili e senza campi vuoti);
- verifica che la nuova landing **non** sia in `dist/` con asset mancanti (il check li segnala);
- conta i caratteri della meta description: deve stare tra 150 e 160;
- controlla che `eventi/index.html` mostri il nuovo nodo in coda al nastro, con l'etichetta Settembre.

Chiudi con un riepilogo: file creati, file modificati, eventuali `[DA CONFERMARE]` rimasti e le
scelte fatte sugli orari.
