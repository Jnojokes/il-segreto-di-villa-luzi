# PROMPT PER CLAUDE CODE — AI Concierge + Transizione "boule de neige"

> Copia tutto ciò che segue (dal blocco "CONTESTO" in poi) e incollalo in Claude Code, dalla **root del repo** `il-segreto-di-villa-luzi`. È scritto per essere eseguito così com'è. Le decisioni già prese sono: **concierge guidato a step** (nessun backend, deterministico), **bilingue IT/EN**, **launcher fluttuante globale**.

---

## CONTESTO DEL PROGETTO (leggi prima di scrivere codice)

Stai lavorando su **Villa Luzi 1737** (`villaluzi1737.it`), il sito della dimora storica e del ristorante *Il Segreto*. Prima di toccare qualsiasi file, **leggi** per capire lo stato reale:

- `build.js` — build a zero dipendenze. Copia la repo in `dist/` e sostituisce i marker `<!-- @include:header -->` e `<!-- @include:footer -->` con `partials/header.html` e `partials/footer.html`. I file **senza** marker vengono copiati byte-per-byte. La cartella `partials/` **non** viene pubblicata. Comando di build: `node build.js`.
- `partials/header.html`, `partials/footer.html` — header e footer globali, inclusi a build-time in (quasi) tutte le pagine.
- `assets/css/site.css` — design system condiviso. Contiene i **token** in `:root` (vedi sotto). NON duplicarli.
- `assets/js/site.js` — comportamenti condivisi (reveal, nav mobile, sticky CTA, parallax, e un sistema di **particelle canvas già esistente** chiamato `wow-dust`: usalo come riferimento di stile e performance).
- `assets/js/home.js` — include il **loader cinematografico** della home (`.home-loader`). La transizione di pagina dovrà **convivere** con questo loader, senza doppi overlay sulla home al primo caricamento.

### Architettura: vincoli tecnici NON negoziabili
1. **Sito statico multipagina (MPA), zero framework, zero dipendenze npm.** Vanilla JS in IIFE, come `site.js`. Niente React/Vue/bundler/build step nuovi. Niente CDN esterni.
2. **Non rompere `build.js`.** Dopo le modifiche, `node build.js` deve completare senza errori e rigenerare `dist/`.
3. **Due pagine "standalone"** NON usano i partial e NON linkano `site.css`/`site.js` (hanno CSS+JS inline e vengono copiate byte-per-byte). Sono:
   - `il-segreto/index.html` (landing ristorante, ha già un suo `sticky-cta` e un suo costruttore di messaggio WhatsApp inline)
   - `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`
   Su queste due dovrai cablare il concierge e la transizione **a mano** (vedi "Wiring").
4. **I crawler AI non eseguono JS.** Il concierge e la transizione sono *progressive enhancement*: tutta la navigazione e i contenuti reali devono restare raggiungibili in HTML statico anche senza JS. Il concierge non deve mai essere l'unico modo per arrivare a una pagina o a un'informazione.
5. **Rispetta `prefers-reduced-motion` e `navigator.connection.saveData`** ovunque, esattamente come fa già `site.js`.

### Token di stile (da `assets/css/site.css` — riusarli, non reinventarli)
```
--ottanio:#0E3B3E  --ottanio-deep:#0a2d2f  --verde-notte:#081E20
--oro:#C9A86A  --oro-soft:#b89855  --oro-bright:#d4b576
--avorio:#F4ECDC  --avorio-warm:#ece2cf  --rosa-rame:#D49785
--corallo:#EA7275  --inchiostro:#1A1A1A
--whisper / --whisper-soft / --whisper-faint (avorio a opacità scalari)
--ease-lux:cubic-bezier(0.16,1,0.3,1)  --ease-wow:cubic-bezier(0.19,1,0.22,1)
--dur-fast:0.35s  --dur-mid:0.6s  --topbar-h:88px
```
Font già caricati: **Playfair Display** (display/titoli), **Inter** (corpo), **Cormorant Garamond** (disponibile per i payoff evocativi). Usa lo stack esistente: non aggiungere font.

---

## OBIETTIVO

Costruisci **due cose**, coese tra loro:

**A) Un "AI Concierge" guidato** — un'esperienza a step, elegante e deterministica, che accompagna l'ospite attraverso tutti i mondi e i pacchetti della villa (ristorante, Domenica al Segreto, aperitivo in piscina, wellness e massaggi, pacchetti, soggiorno, eventi/matrimoni, gift card), gli fa **selezionare** ciò che gli interessa, e **converte tutto in un'unica richiesta WhatsApp** (chat di Sonia) con messaggio precompilato. Bilingue IT/EN.

**B) Una transizione tra le pagine "boule de neige"** — a ogni cambio pagina la pagina si "chiude" in una nuvola di **particelle** (effetto sfera di neve / globo che si agita e si posa), copre lo schermo, e la nuova pagina si "apre" mentre le particelle si disperdono.

---

## VINCOLI DI BRAND E TONO DI VOCE (vincolanti, valgono per tutti i testi del concierge)

Dal brief di campagna "Il Segreto dell'Estate". Concept ombrello: **"Il lusso è il tempo."**

- **Tono:** evocativo ma asciutto. **Seduzione, non vendita.**
- **Vietato:** la formula "prenota ora!"; le emoji; la "poesia da Pinterest"; i conteggi da brochure ("tre esperienze", "ben 4 mondi").
- **"menù"** sempre con l'accento.
- **Titolari** sempre in quest'ordine quando citate: **Sonia Ruggeri e Luana Salemi**. La chat WhatsApp è quella di **Sonia**.
- **Descrittore corretto:** "Il Segreto, ristorante all'interno della storica dimora Villa Luzi".
- **Mai chiamare la villa "casa".** Usa: *dimora, villa, il complesso, la residenza*. (Nota: in alcune pagine esistenti compare "casa" — non è il registro voluto dal brief. Nei testi NUOVI del concierge attieniti a dimora/villa.)
- **CTA canoniche** (usa queste, mai altre): *"Prenotazioni su WhatsApp"*, *"Scrivici per il tuo posto"*, *"Su prenotazione"*, *"Ti aspettiamo in dimora"*.
- Versione EN coerente con lo stesso registro: sobrio, evocativo. Es. payoff "Time is the real luxury." CTA: *"Write to us on WhatsApp"*, *"Save your place"*, *"By reservation"*, *"We'll be expecting you"*.

---

# PARTE A — AI CONCIERGE (guidato, bilingue, WhatsApp-first)

## A1. File da creare e wiring

Crea **tre** file nuovi (vanilla, commenti in italiano, stile coerente con `site.js`):
- `assets/css/concierge.css`
- `assets/js/concierge.js`
- `assets/js/transition.js` (Parte B)

**Wiring globale (la via principale):** in `partials/footer.html`, **prima** della chiusura, aggiungi:
- il `<link rel="stylesheet" href="/assets/css/concierge.css" />`
- il markup del **launcher** e del **contenitore del pannello** (montati vuoti; il contenuto lo costruisce il JS)
- `<script src="/assets/js/concierge.js" defer></script>` e `<script src="/assets/js/transition.js" defer></script>`

Così header/footer essendo inclusi a build-time, il concierge e la transizione compaiono automaticamente su **tutte le pagine che usano i partial**.

**Wiring manuale sulle 2 pagine standalone** (`il-segreto/index.html`, `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`): aggiungi a mano, prima di `</body>`, gli stessi `<link>`, il markup del launcher/pannello e i due `<script defer>`. Su `il-segreto/index.html` **coordina con lo sticky-cta inline esistente**: deve restare visibile **un solo** controllo fluttuante (vedi A3).

**Coerenza launcher unico:** il footer globale contiene già uno `sticky-cta` ("Prenota"). Non devono coesistere due bottoni fluttuanti. Fai sì che, quando il concierge è attivo, **il launcher del concierge sia l'unico elemento fluttuante** (nascondi/assorbi lo sticky-cta esistente via CSS/JS, sia quello globale del footer sia quello inline di `il-segreto`). Il concierge porta comunque a WhatsApp, quindi non perdi la conversione.

## A2. Single source of truth: oggetto CONFIG

In cima a `concierge.js`, definisci **un unico oggetto `CONFIG`** con tutti i contenuti (così il cliente aggiorna prezzi/testi senza toccare la logica). Tutti i testi in **IT ed EN**. Numeri e dati sono questi, presi dal brief — **non inventarne altri**:

**Recapiti / conversione**
- WhatsApp (chat di Sonia): `https://wa.me/393452419263`
- Email (secondaria): `villaluzi1737@gmail.com`
- Telefono: `+39 345 241 9263`

**I tre pilastri dell'estate**
1. **La Domenica al Segreto** — *pranzo dalle 12:30, piscina fino alle 18; menù d'autore di Chef Jan Paul Kana.* Prezzo **€ 55 a persona**. Campi richiesti: data, n. persone. Messaggio WhatsApp base: *"Ciao Sonia, vorrei prenotare la Domenica al Segreto per il [data], siamo in [n.]."*
2. **L'Aperitivo in piscina** — *l'ora dorata a bordo piscina, luce bassa sul parco.* **Formula e orari DA CONFERMARE** → questo è un caso "placeholder" (vedi A4). Messaggio base: *"Ciao Sonia, vorrei un tavolo per l'aperitivo in piscina."*
3. **Wellness e massaggi** — *centro estetico e massaggi nella dimora e nel parco; su prenotazione.* Fascia **da € 40 a € 95**. Messaggio base: *"Ciao Sonia, vorrei prenotare un trattamento wellness."*

**Listino wellness completo** (voce → prezzo; selezionabili singolarmente)
- Massaggio corpo relax o decontratturante (50/60 min) — € 85
- Trattamento viso completo (detersione, fiala, massaggio, maschera) — € 95
- Massaggio viso Sibilla — € 65
- Make-up — € 65
- Make-up sposa — su preventivo *(placeholder: nessun prezzo fisso)*
- Manicure con smalto — € 40
- Manicure semipermanente Shellac — € 50
- Pedicure con smalto — € 50
- Pedicure semipermanente Shellac — € 60

**Pacchetti (upselling)**
- **Domenica + Benessere** — pranzo della domenica con piscina + massaggio da 50 minuti — **€ 130** (anziché € 140)
- **Aperitivo + Cena** — aperitivo in piscina al tramonto che prosegue a cena — *su misura*
- **Giornata lenta** — trattamento al mattino, pranzo e pomeriggio in piscina — *su misura*

**Gift card dell'estate** (CTA dedicata: *"Regala un'estate"*)
- "Una Domenica per due" — € 110
- "Un'ora di benessere" — € 85
- "Aperitivo al tramonto per due" — su misura
- A valore libero — € 50 / € 100 / € 150

**Mondi della villa (navigazione completa, con link reali)**
- Soggiornare → `/soggiornare/` (Room Villa, Suite Villa: `/soggiornare/camere/`)
- Il Segreto · Ristorante → `/il-segreto/`; menù → `/il-segreto/menu/`
- Esperienze → `/esperienze/` (Aperitivi in erba, Yoga e benessere, Il parco)
- Eventi → `/eventi/` (Eventi privati, Corporate)
- Matrimoni → `/matrimoni/`
- Offerte → `/offerte/`
- Contatti / Come arrivare / FAQ → `/contatti/`, `/come-arrivare/`, `/faq/`

## A3. Launcher fluttuante (globale)

- Posizione: **basso a destra**, fisso, su tutte le pagine. Su mobile, sopra l'eventuale safe-area.
- Aspetto: pill/cerchio discreto, in palette (sfondo `--ottanio-deep`/vetro, bordo `--oro-soft`, icona/testo `--avorio`). Micro-interazione al hover coerente con `--ease-lux`. Niente emoji nell'icona: usa un'icona SVG inline sobria (es. una piccola "concierge bell" o una stella/diamante lineare, stroke `currentColor`).
- Etichetta: **"Concierge"** (IT) / **"Concierge"** (EN). Sottotitolo facoltativo molto sobrio ("Ti guido io" / "Let me guide you"). *Nota: per tono, evita di scrivere "AI" o "Chatbot" nei testi visibili; il cliente può rinominarlo dal CONFIG.*
- **Badge selezione:** quando l'ospite ha aggiunto elementi alla sua selezione, mostra un piccolo contatore sul launcher.
- Apertura: clic → apre il pannello. Accessibile da tastiera (è un `<button>`).

## A4. Flusso a step (deterministico)

Il pannello si apre come **side sheet** su desktop (colonna a destra, ~420–480px, sfondo `--ottanio` con grain coerente) e come **bottom sheet / full-screen** su mobile. Microcopy conversazionale ma asciutta; opzionale un leggerissimo effetto "comparsa" dei messaggi (disattivato con reduced-motion).

**Step 0 — Benvenuto.** Una riga evocativa + toggle lingua **IT / EN** (in alto). Es. IT: *"Il lusso è il tempo. Da dove cominciamo?"* — EN: *"Time is the real luxury. Where shall we begin?"*

**Step 1 — Intenzione** (selezione, anche multipla): cards/scelte
- Una Domenica al Segreto
- Un aperitivo in piscina
- Benessere e massaggi
- Un soggiorno in villa
- Un evento o un matrimonio
- Un regalo (gift card)
- Solo esplorare la villa

**Step 2 — Approfondimento per ramo.** In base alle scelte mostra dettagli + sotto-opzioni, **ognuna con un bottone "Aggiungi alla selezione"** (è questo il "bottone per restare lì": l'ospite tiene/parcheggia ciò che gli piace senza uscire dal flusso e senza prenotare subito). Comportamenti per ramo:
- **Domenica:** mostra € 55, campi *data* e *n. persone*, poi "Aggiungi".
- **Aperitivo (placeholder):** poiché formula/orari sono da confermare, **non** mostrare prezzi finti. Mostra una nota sobria ("Formula e orari da confermare") e un bottone placeholder **"Tienimi un posto"** che salva comunque l'interesse nella selezione. Il placeholder deve essere chiaramente uno stato "in arrivo", non un prezzo inventato.
- **Wellness:** elenco selezionabile dell'intero **listino**; ogni voce "Aggiungi" (per "Make-up sposa" mostra "su preventivo", nessun prezzo).
- **Pacchetti:** mostra i 3 pacchetti; "Domenica + Benessere" con € 130 (anziché € 140); gli altri "su misura".
- **Soggiorno / Eventi / Matrimoni:** scheda breve + **link reale** alla pagina relativa (deep link) + "Aggiungi alla selezione" per portarlo nella richiesta WhatsApp.
- **Gift card:** tagli pronti + valore libero; CTA "Regala un'estate".
- **Esplorare:** mini-mappa dei mondi con i link reali (A2) — utile anche a chi vuole solo navigare.

**Step 3 — La tua selezione** (riepilogo tipo "carrello", ma sobrio): elenco di ciò che ha aggiunto, **modificabile** (rimuovi voce, cambia data/persone), più un campo **note libere** ("Aggiungi una nota per Sonia"). Mostra eventuali prezzi accanto alle voci che ne hanno uno; per le voci "su misura/preventivo/placeholder" scrivi quello, non un numero.

**Step 4 — Handoff WhatsApp.** CTA principale **"Scrivici per il tuo posto"** (IT) / **"Save your place"** (EN) che apre `https://wa.me/393452419263?text=<messaggio precompilato>` (vedi A5). Secondari, più piccoli: **copia messaggio**, **email** (`mailto:` con stesso corpo), **telefono**. Chiudi con una riga calda in tono ("Ti aspettiamo in dimora." / "We'll be expecting you.").

## A5. Costruzione del messaggio WhatsApp (deterministica)

Assembla il testo dalla selezione, nella lingua scelta, indirizzato a Sonia. Usa `encodeURIComponent` (come fa già `il-segreto/index.html`). Regole:
- **Selezione singola** → usa il messaggio base del pilastro (A2), completato coi campi (data, persone).
- **Selezione multipla** → intro + elenco puntato pulito + note. Niente emoji.

Esempio IT (multipla):
```
Ciao Sonia, scrivo da villaluzi.it.
Vorrei organizzare:
- La Domenica al Segreto (€ 55) — 4 persone, domenica 12 luglio
- Massaggio corpo relax (€ 85)
- Aperitivo in piscina — tenetemi un posto (formula da confermare)
Note: arriviamo nel pomeriggio.
Grazie.
```
Esempio EN (singola):
```
Hello Sonia, I'm writing from villaluzi.it.
I'd like to book the Sunday at Il Segreto (€ 55) for 2 people, Sunday 12 July.
Thank you.
```
Metti il **template del messaggio nel CONFIG** (con segnaposto), così è modificabile.

## A6. Stato e persistenza (importante per un sito multipagina)

- La selezione e la lingua scelta **devono sopravvivere ai cambi pagina**: salvale in `sessionStorage` (es. chiave `vl_concierge`). Così l'ospite può aggiungere cose da pagine diverse mentre naviga, e ritrovare la selezione (il badge sul launcher riflette il conteggio ovunque).
- Niente `localStorage` per i dati di sessione di prenotazione (resta in `sessionStorage`); puoi usare `localStorage` solo per ricordare la **preferenza lingua** se vuoi renderla persistente tra visite.
- Gestisci con tolleranza i casi di `sessionStorage` non disponibile (private mode): degrada a stato in memoria.

## A7. Bilingue IT/EN

- Tutti i testi UI e i template messaggio vivono nel CONFIG con chiavi `it` / `en`.
- Default: `it` (coerente con `<html lang="it">`). Toggle visibile nello Step 0 e in testa al pannello.
- Quando cambia la lingua, ricostruisci i testi del pannello senza perdere la selezione.

## A8. Accessibilità (requisito, non opzionale)

- Pannello = dialog: `role="dialog"`, `aria-modal="true"`, `aria-label` adeguato; **focus trap** mentre è aperto; **Esc** chiude; al chiudere **restituisci il focus** al launcher.
- Tutte le scelte sono `<button>` operabili da tastiera, con `:focus-visible` evidente (anello in `--oro`).
- Contrasto AA su `--avorio` su `--ottanio`. Stati `aria-pressed` per le voci selezionate.
- Rispetta `prefers-reduced-motion`: niente comparse animate, transizioni ridotte a dissolvenze minime.
- Il pannello non deve intrappolare lo scroll della pagina sotto in modo rotto su mobile (gestisci `body.nav-open`-style lock come fa già `site.js` per la nav).

---

# PARTE B — TRANSIZIONE DI PAGINA "BOULE DE NEIGE"

## B1. Concept visivo

A ogni cambio pagina, la pagina corrente si **chiude in una nuvola di particelle**, come una **sfera di neve (boule à neige) che viene agitata**: le particelle (polvere dorata/avorio/rosa-rame, in palette) sciamano e vorticano fino a **coprire** lo schermo con un velo in `--ottanio`/`--verde-notte`; poi, sulla pagina nuova, le particelle si **disperdono/posano** e il velo si dissolve, rivelando il contenuto. Deve sembrare un'unica continuità tra le due metà (uscita → entrata), elegante e breve, non un caricamento pesante.

## B2. Tecnica (MPA, niente router SPA)

Implementa in `transition.js` (vanilla, IIFE). Un **overlay fisso a tutto schermo** `#vl-transition` con un `<canvas>` dentro, `z-index` alto (sopra il contenuto, sotto eventuali alert di sistema), `aria-hidden="true"`, `pointer-events` gestiti (attivi solo durante la transizione).

**Metà USCITA (al clic su link interno):**
- Intercetta i clic sugli `<a>` **stesso-origine** che portano a un'altra pagina. `preventDefault`, avvia l'animazione "chiusura" (particelle che sciamano + velo che entra, ~500–700ms), poi `window.location.href = href`.
- **Non intercettare** (lascia il comportamento nativo): link con `target="_blank"`, `download`, `rel*="external"`, schemi `mailto:`/`tel:`/`https://wa.me`, ancore pure `#...` sulla stessa pagina, e clic con tasto modificatore (`metaKey/ctrlKey/shiftKey/altKey`) o tasto centrale del mouse.
- **Safety timeout:** se per qualunque motivo la navigazione non parte entro ~1s, forza comunque `window.location.href`.

**Metà ENTRATA (al caricamento pagina nuova):**
- Su `pageshow`/`DOMContentLoaded`, parti con l'overlay **coperto** e suona la "dispersione": le particelle si diradano e il velo si dissolve (~500–700ms), poi disattiva l'overlay.
- Usa un flag in `sessionStorage` (es. `vl_nav`) settato nella metà uscita, così l'entrata "piena" parte solo dopo una navigazione interna; in atterraggio diretto/refresh fai un'entrata minima o nessuna.
- Gestisci il **bfcache**: su `pageshow` con `event.persisted === true`, assicurati che l'overlay sia nascosto (niente schermo bloccato tornando "indietro").

**Convivenza con il loader home:** sulla home c'è `.home-loader` (in `home.js`). Evita il doppio overlay: al **primo** caricamento della home lascia fare al loader esistente (l'entrata della transizione si salta o si fonde). Le navigazioni *verso* la home da altre pagine devono comunque funzionare senza due veli sovrapposti.

## B3. Parametri (mettili in cima al file, facili da tarare)

- Palette particelle: usa gli stessi RGB del sistema `wow-dust` esistente — oro `201,168,106`, rosa-rame/corallo `234,114,117`, avorio `244,236,220`.
- Densità adattiva al viewport (come fa `wow-dust`: ~`min(N, area/divisor)`), **cap** sul numero di particelle e **DPR cap a 2**.
- Velo: gradiente/tinta tra `--ottanio` e `--verde-notte`.
- Durata totale percepita ≤ ~1.2s (uscita + entrata). Curve in `--ease-wow`.

## B4. Edge cases e fallback (obbligatori)

- **`prefers-reduced-motion: reduce`** → niente particelle: sostituisci con una **dissolvenza** rapida e sobria (o transizione nulla). Stesso per **`saveData`**: riduci drasticamente le particelle o passa alla dissolvenza.
- **Ferma il canvas** (cancella RAF) appena la transizione finisce; pausa su `visibilitychange` quando la tab è nascosta.
- Non interferire con il concierge: se il pannello concierge è aperto, i suoi link interni devono comunque triggerare la transizione in modo pulito (o chiudersi prima).
- Niente *layout shift* (CLS): l'overlay è `position:fixed; inset:0`, non sposta nulla.
- Tutto deve funzionare anche a JS spento (semplicemente: nessuna transizione, navigazione normale).

---

## PERFORMANCE E QUALITÀ

- Vanilla puro, nessuna dipendenza, `defer` sugli script. Inizializzazione pigra; nessun lavoro su `scroll`/`resize` non regolato (usa `requestAnimationFrame`/debounce come `site.js`).
- Un solo `<canvas>` per la transizione; un solo RAF attivo per volta.
- Niente regressioni Lighthouse evidenti (performance/accessibilità). Niente font o asset nuovi pesanti.
- Stile e commenti in italiano, coerenti con il codice esistente.

## COSA NON TOCCARE

- La logica e i marker di `build.js`; i contenuti testuali/nav nei partial (oltre alle aggiunte richieste); i nodi **JSON-LD**; gli **script inline** e gli stili delle 2 pagine standalone (aggiungi soltanto, non riscrivere); lo slug della route `/il-segreto`.
- Non introdurre "casa" nei testi nuovi; non usare "prenota ora" né emoji.

## CHECKLIST DI VERIFICA FINALE (eseguila e riportala)

1. `node build.js` completa senza errori e rigenera `dist/`.
2. Su una pagina normale (es. `/la-villa/`), una pagina con partial speciali e **entrambe** le pagine standalone (`/il-segreto/`, `/esperienze/aperitivi-in-erba/2-giugno-2026/`): il **launcher** appare, è **unico** (nessun doppio bottone fluttuante), e apre il pannello.
3. Flusso completo: scelte → "Aggiungi alla selezione" → riepilogo modificabile → CTA che apre WhatsApp con il **messaggio precompilato corretto** (verifica IT ed EN, selezione singola e multipla, e il caso placeholder "aperitivo").
4. La **selezione persiste** cambiando pagina (badge aggiornato).
5. Transizione "boule de neige": uscita+entrata fluide su link interni; link esterni/`wa.me`/`mailto`/`tel`/`target=_blank`/ancore/clic con modificatori **non** vengono intercettati; tornando "indietro" (bfcache) non resta lo schermo coperto; safety timeout funziona.
6. `prefers-reduced-motion` e `saveData`: concierge e transizione degradano a versioni sobrie/dissolvenza.
7. Accessibilità: focus trap, Esc, focus restituito, `:focus-visible`, contrasto.
8. Nessun errore in console su desktop e mobile (emulato).

## OUTPUT ATTESO

- Nuovi: `assets/css/concierge.css`, `assets/js/concierge.js`, `assets/js/transition.js`.
- Modificati: `partials/footer.html` (wiring globale + markup launcher/pannello/overlay), `il-segreto/index.html` e `esperienze/aperitivi-in-erba/2-giugno-2026/index.html` (wiring manuale), ed eventuale piccolo coordinamento CSS dello sticky-cta.
- Un breve report finale con: file toccati, come tarare i parametri (particelle, durate), e come il cliente aggiorna prezzi/testi dal `CONFIG`.

Procedi. Se trovi un'ambiguità reale, scegli l'opzione più sobria e coerente col brand, e annotala nel report finale.
