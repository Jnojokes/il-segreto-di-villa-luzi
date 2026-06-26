# PROMPT PER CLAUDE CODE — Verifica implementazione + Correzioni (globo, concierge, form lead, palette)

> Copia tutto ciò che segue (dal blocco "CONTESTO") e incollalo in Claude Code dalla **root** del repo `il-segreto-di-villa-luzi`.
>
> **Obiettivo in due fasi:** (1) **VERIFICA** che quanto già implementato (globo home, transizione, concierge, palette) sia corretto e funzionante, producendo un report PASS/FAIL; (2) **APPLICA LE CORREZIONI** elencate sotto. Lavora con cautela: gran parte del codice esiste già, non riscrivere ciò che funziona — correggi in modo mirato.

---

## CONTESTO (leggi PRIMA i file reali, poi agisci)

Sito **Villa Luzi 1737**, statico multipagina. Stato attuale rilevante (leggilo):
- **Globo home:** `assets/js/orb.js`, `assets/css/orb.css`, markup in `index.html` (sezione `.orb-section`, lista `.orb-world` con i nodi `.orb-node`, ~righe 112–134; CSS/JS linkati con `?v=3`).
- **Transizione:** `assets/js/transition.js` (attualmente è la "boule de neige" a particelle).
- **Concierge:** `assets/js/concierge.js` (~1050 righe), `assets/css/concierge.css`; wiring in `partials/footer.html` (launcher `#vlc-launcher`, pannello `#vlc-panel`, script `?v=3`). Contiene un oggetto `CONFIG`/dizionari `it`/`en` in cima.
- **Palette:** `assets/css/site.css` → `:root` contiene già `--ottanio*`, `--oro*`, `--avorio*`, `--rosa-rame`, `--corallo*`, e la base chiara `--panna*`, più token glass.
- **Pattern form lead già nel repo (riferimento da riusare):** `eventi/white-party/lista/index.html` (form `#formLista`, ~righe 618–690) usa un **endpoint configurabile** via fetch (commento: Google Apps Script Web App **oppure** Formspree). È il modo "zero-backend" già adottato qui.

### Vincoli tecnici NON negoziabili
1. **Statico MPA, zero framework, zero dipendenze npm, zero CDN.** Vanilla JS in IIFE.
2. **Build a zero dipendenze:** `build.js` inietta `partials/header.html`/`footer.html` nei marker e copia in `dist/`. Dopo le modifiche, `node build.js` deve completare senza errori.
3. **Hosting attivo = Vercel** (`vercel.json`: `buildCommand: node build.js`, `outputDirectory: dist`, `trailingSlash: true`). **Niente Netlify Forms** (non funzionano su Vercel): per i lead usa il pattern endpoint-configurabile già presente (sopra).
4. **Due pagine standalone** (`il-segreto/index.html`, `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`) NON usano i partial: eventuali interventi globali vanno cablati a mano e con cautela (aggiungi, non riscrivere gli inline).
5. **Crawler AI non eseguono JS:** navigazione e contenuti reali devono restare in HTML statico. Globo e concierge sono *progressive enhancement*.
6. **Rispetta `prefers-reduced-motion` e `Save-Data`** ovunque.

---

# FASE 1 — VERIFICA (produci un report PASS/FAIL prima di correggere)

Leggi i file e verifica, segnando per ognuno PASS/FAIL + nota:
- **Globo:** la sezione appare sotto la hero; ruota; i nodi sono link; esiste una `<nav>`/lista reale di fallback nel sorgente; comportamento con `prefers-reduced-motion` (statico) e JS off.
- **Transizione:** uscita/entrata funzionano; intercetta solo link interni; salta `_blank`/`download`/`mailto`/`tel`/`wa.me`/ancore/clic modificati; safety timeout; bfcache (`pageshow` persisted) non lascia lo schermo coperto; nessun doppio velo con `.home-loader`.
- **Concierge:** launcher unico (nessun doppio fluttuante con `sticky-cta`); apertura/chiusura; persistenza stato tra pagine (`sessionStorage`); messaggio WhatsApp ben formato (IT/EN); accessibilità (focus, Esc, focus-visible).
- **Palette:** dove sono usati ottanio/oro/panna/rosa/corallo oggi (mappa sintetica): serve a guidare il rebalance della Fase 2.
- **Build:** `node build.js` ok; nessun errore console su home + una pagina interna.

Riporta il tutto in cima al report finale, poi procedi con le correzioni.

---

# FASE 2 — CORREZIONI

## C1. GLOBO (la "boule de neige")
1. **I link devono funzionare.** I nodi del globo sono **navigazione pura** verso le pagine reali (niente trigger del concierge sui nodi). Il clic naviga (con la transizione di pagina).
2. **Niente "regalo/Gift card" nel globo.** Rimuovi quel nodo.
3. **Nodi corretti = sezioni del sito.** Sostituisci l'attuale lista (che mischia pilastri/concierge e **non ha "La Villa"**) con le sezioni reali, in `index.html` e nel CONFIG di `orb.js`:
   - **La Villa** → `/la-villa/`
   - **Il Segreto** *(ristorante)* → `/il-segreto/`
   - **Esperienze** → `/esperienze/`
   - **Eventi** → `/eventi/`
   - **Matrimoni** → `/matrimoni/`
   - **Contatti** → `/contatti/`
   Aggiorna anche la `<nav>` di fallback nel sorgente con questi stessi link.
4. **Hover → anteprima foto (come una card che si apre).** Al passaggio del mouse (puntatore fine) su un nodo, mostra un'**anteprima fotografica** che si apre con un'animazione "card" elegante (scala/fade in `--ease-lux`). Usa le cover esistenti in `/assets/img/covers/`:
   - La Villa → `la-villa.webp` · Il Segreto → `menu.webp` · Esperienze → `esperienze.webp` · Eventi → `eventi.webp` · Matrimoni → `matrimoni.webp` · Contatti → `contatti.webp`
   `loading="lazy"`, `decoding="async"`, `alt` sensato. Su touch/`prefers-reduced-motion` niente preview al hover (resta il tap che naviga).
5. **Base/piedistallo che sostiene la sfera.** Manca: aggiungi sotto la sfera una **base** (piedistallo/cuscinetto) su cui il globo **ruota** — la sfera gira, la base resta ferma e la "regge" (ombra di contatto, leggera prospettiva). Solo CSS.
6. **Più particelle "dreamy" attorno.** Aumenta le particelle **attorno** al globo (non solo dentro): pulviscolo luminoso diffuso, soffuso e sognante (bassa opacità, glow morbido, deriva lenta), nello stile di `wow-dust`. Mantieni **cap** sul numero, **DPR cap 2**, RAF unico, pausa su `visibilitychange`, e fallback (statico) con `prefers-reduced-motion`/`Save-Data`. La leggibilità delle etichette resta prioritaria.

## C2. CONCIERGE — forma, posizione, natura
1. **Non è un "chatbot a destra".** Rimuovi qualsiasi aggancio/dock sul lato destro.
2. **Launcher = frase-CTA centrata in basso, non un pulsante.** Sostituisci il bottoncino `#vlc-launcher` con un **invito testuale (CTA-interaction) centrato in basso** (floating, bottom-center), che inviti a iniziare (es. *"Da dove cominciamo?"* / *"Esplora la villa con noi"* — sobrio, niente emoji). Resta **un solo** controllo fluttuante (continua ad assorbire la `sticky-cta`). All'apertura il pannello si presenta **centrato** (o si espande dal centro-basso), **non** a lato.
3. **Gli step possono cambiare pagina (esplorazione + conversione).** Il concierge non è solo un quiz multi-step verso la conversione: è anche una **guida che aiuta a esplorare il sito**. Mentre si avanza, deve poter **navigare alle pagine** pertinenti (con la transizione) e poi **riaprirsi nello stesso stato** sulla pagina d'arrivo (persistenza `sessionStorage`). Verifica e **fai funzionare davvero** questo flusso "avanzo → cambio pagina → il concierge prosegue". Integra suggerimenti di navigazione (porta l'ospite a La Villa, Il Segreto, ecc.) accanto al percorso di prenotazione.
4. **Via il nome "Sonia".** Rimuovi **ogni** riferimento a "Sonia" e a "Scrivi a Sonia" nei testi visibili e nei messaggi (oggi è in più punti: intro messaggio `it/en` "Ciao Sonia, scrivo da…", ledi "Pronti per Sonia"/"arriverà a Sonia", label "Aggiungi una nota per Sonia", ecc.). Riscrivi neutro, es. messaggio IT: *"Buongiorno, scrivo da villaluzi.it. Vorrei…"* / EN: *"Hello, I'm writing from villaluzi.it. I'd like…"*. La label nota → "Aggiungi una nota" / "Add a note".
5. **CTA finale = "Invia richiesta", sempre verso WhatsApp.** La CTA di handoff diventa **"Invia richiesta"** (IT) / **"Send request"** (EN), e apre sempre `https://wa.me/393452419263?text=…` (per i rami che restano su WhatsApp — vedi C3). Sostituisci le stringhe attuali "Scrivici per il tuo posto"/"Save your place".

## C3. FORM LEAD su EVENTI/MATRIMONI · WhatsApp per il RISTORANTE
1. **Form di lead** (raccolta contatti) su: **`/eventi/`**, **`/eventi/eventi-privati/`**, **`/matrimoni/`**. **Riusa il pattern già nel repo** (`eventi/white-party/lista/index.html`, form `#formLista`): endpoint **configurabile** via fetch (Google Apps Script o Formspree), in **un solo punto** facile da editare; validazione, stati di successo/errore, honeypot anti-spam, no dipendenze. Campi: nome, email, telefono, data/periodo, tipo (evento privato / corporate / matrimonio), n. ospiti, messaggio. I lead vanno notificati a `villaluzi1737@gmail.com` (tramite il servizio scelto).
2. **Il ristorante resta su WhatsApp** (Domenica al Segreto, aperitivo, wellness → `wa.me/393452419263`, "Invia richiesta").
3. **Nel concierge**, il ramo **"Un evento o un matrimonio"** non deve finire nel messaggio WhatsApp: deve **portare al form** della pagina giusta (deep-link a `/eventi/`, `/eventi/eventi-privati/` o `/matrimoni/`, alla sezione del form) — oppure mostrare il form dentro il pannello, riusando lo stesso endpoint. Aggiorna di conseguenza la logica del CONFIG (oggi `i_eventi`/`i_matrimonio` sono "interest" che entrano nel messaggio).
> **DA COMPLETARE da Francesco:** l'**endpoint reale** del form (Apps Script o Formspree). Lascialo come placeholder configurabile e segnalalo nel report.

## C4. PALETTE — rebalance (meno confusione)
Oggi ottanio + oro + panna + rosa + corallo convivono ovunque: troppo. Riordina con questa gerarchia, lavorando su `:root` e poi component-by-component in `site.css` (e dove serve negli altri CSS):
1. **Ottanio scuro = SOLO navbar e footer** (il "chrome" scuro ai due estremi). Niente grandi campiture ottanio nel corpo.
2. **Oro = accento SOLO in navbar e footer**, e reso **più lieve/discreto** (filetti, micro-dettagli, opacità contenute; non campiture). **Fuori da navbar/footer non usare oro.**
3. **Ritara l'oro** perché stia in palette col **corallo/rosa**: da `--oro:#C9A86A` a un oro più caldo/rosato (champagne rose-gold), **proposta `#C9A079`** (taràbile) — verificalo sul fondo ottanio scuro di navbar/footer.
4. **Corpo del sito = panna + rosa.** Base `--panna`; il **rosa** (`--rosa-rame`) come tono caldo; il **corallo** come **CTA primaria/azione**.
5. **CTA secondaria:** usa **l'oro ritarato** come secondo stile di CTA (es. outline/ghost oro), **se sta bene** sul chiaro; altrimenti usa rosa/inchiostro. Primaria = corallo, secondaria = oro ritarato.
6. **Coerenza:** verifica contrasto **AA** ovunque dopo lo spostamento; elenca i punti limite. Le 2 pagine standalone hanno palette inline proprie: riallineale con cautela o segnala se le lasci.

## C5. (DA CONFERMARE) Transizione
La transizione attuale è la **boule de neige a particelle**. In una decisione precedente era emersa l'idea **farfalle full-screen**. Poiché non l'hai richiesta in questo giro, la **lascio com'è (particelle)**: se vuoi le farfalle, dimmelo e la converto. Verifica solo che funzioni bene (Fase 1).

---

## COSA NON TOCCARE
Logica/marker di `build.js`; `vercel.json`/`netlify.toml`; nodi **JSON-LD**; slug `/il-segreto`; gli script inline delle 2 pagine standalone (aggiungi, non riscrivere). Niente "casa" nei testi nuovi; niente "prenota ora"; niente emoji.

## CHECKLIST FINALE (eseguila e riportala)
1. `node build.js` ok; `dist/` rigenerato; nessun errore console (home + pagina interna).
2. **Globo:** link **navigano** alle 6 sezioni reali; **nessun** nodo regalo; **La Villa** presente; **hover → preview foto** (card); **base** sotto la sfera che la regge mentre ruota; **particelle dreamy** attorno; fallback statico ok.
3. **Concierge:** launcher = **frase-CTA centrata in basso** (non bottone, non dock destro); pannello centrato; **step→cambio pagina** funziona con stato persistente; **zero "Sonia"**; CTA = **"Invia richiesta"** → WhatsApp.
4. **Form:** lead form su eventi / eventi-privati / matrimoni (pattern white-party, endpoint configurabile, validazione, honeypot); ristorante resta WhatsApp; il ramo eventi del concierge porta al form.
5. **Palette:** ottanio + oro **solo** navbar/footer (oro lieve e ritarato `#C9A079`); corpo panna + rosa + corallo; CTA primaria corallo, secondaria oro; contrasto AA verificato.
6. Fallback `prefers-reduced-motion`/`Save-Data` ok su globo e transizione.

## OUTPUT ATTESO
- Report **Fase 1** (PASS/FAIL) in cima.
- File toccati in **Fase 2** (mirati): `index.html` + `orb.js`/`orb.css` (globo), `concierge.js`/`concierge.css` (forma, copy, ramo eventi), pagine `eventi`/`eventi-privati`/`matrimoni` (form), `site.css` (palette), `partials/footer.html` (launcher), e le 2 standalone se ritocchi la palette.
- **Decisioni da confermare a Francesco:** endpoint reale del form; conferma dell'oro `#C9A079`; farfalle sì/no (C5); testo esatto della frase-CTA del concierge.

Procedi: prima la VERIFICA (report), poi le CORREZIONI mirate. In caso di ambiguità reale, scegli l'opzione più sobria e coerente col brand e annotala.
