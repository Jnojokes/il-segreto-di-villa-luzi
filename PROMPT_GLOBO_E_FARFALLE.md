# PROMPT PER CLAUDE CODE — Globo di navigazione in home + Transizione "farfalle"

> Copia tutto ciò che segue (dal blocco "CONTESTO") e incollalo in Claude Code dalla **root** del repo `il-segreto-di-villa-luzi`.
>
> **Ambito di questo prompt:** SOLO due cose — (A) un **globo** interattivo sotto la hero della home che fa da navigazione alle sezioni del sito; (B) la nuova **transizione di pagina a farfalle** a tutto schermo. Il concierge e il restyle della palette **non** fanno parte di questo intervento (li riprenderemo dopo: vedi `PROMPT_AI_CONCIERGE.md`).
>
> **Decisioni già prese:** globo **stilizzato 2.5D, zero-dipendenze** (CSS/canvas, niente three.js/CDN); dentro il globo **particelle brillanti** (NON neve); transizione **a farfalle full-screen** che chiudono e aprono lo schermo.
>
> **Nota:** questa transizione a farfalle **sostituisce** la "transizione boule de neige a particelle" descritta nella Parte B di `PROMPT_AI_CONCIERGE.md`. Quando riprenderemo il concierge, la transizione di riferimento sarà questa.

---

## CONTESTO DEL PROGETTO (leggi prima di scrivere codice)

Sito di **Villa Luzi 1737** (`villaluzi1737.it`), dimora storica + ristorante *Il Segreto*. Prima di toccare qualsiasi file, **leggi** lo stato reale:

- `build.js` — build a **zero dipendenze**: copia la repo in `dist/` sostituendo i marker `<!-- @include:header -->` / `<!-- @include:footer -->` con `partials/header.html` / `partials/footer.html`. I file **senza** marker sono copiati byte-per-byte. `partials/` non viene pubblicata. Build: `node build.js`.
- `index.html` — la home (linka `assets/css/home.css` e `assets/js/home.js`; ha il `.home-loader` cinematografico). La prima sezione dopo la hero è `#scopri` (il lead che spiega cos'è Villa Luzi).
- `partials/footer.html` — incluso a build-time in (quasi) tutte le pagine: è il punto giusto per cablare la transizione globale.
- `assets/css/site.css` — design system + **token** in `:root`. `assets/css/home.css` — stili specifici della home.
- `assets/js/site.js` — comportamenti condivisi + un sistema di **particelle canvas già esistente** (`wow-dust`): **usalo come riferimento** di stile e performance per le particelle del globo e per le farfalle.
- `assets/js/home.js` — gestisce `.home-loader`: la transizione deve **convivere** con questo loader.

### Vincoli tecnici NON negoziabili
1. **Statico multipagina (MPA), zero framework, zero dipendenze npm, zero CDN.** Vanilla JS in IIFE, come `site.js`.
2. **Non rompere `build.js`**: dopo le modifiche `node build.js` deve completare senza errori.
3. **Due pagine "standalone"** NON usano i partial e NON linkano `site.css`/`site.js` (CSS+JS inline, copiate byte-per-byte): `il-segreto/index.html` e `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`. Per la transizione globale vanno cablate **a mano** (vedi B5).
4. **I crawler AI non eseguono JS.** Globo e transizione sono *progressive enhancement*: la navigazione e i contenuti reali restano in HTML statico anche senza JS (il globo deve avere link veri nel sorgente).
5. **Rispetta `prefers-reduced-motion` e `navigator.connection.saveData`** ovunque, come fa già `site.js`.

### Token e font (riusali, non reinventarli)
Palette in `:root` di `site.css`: `--ottanio #0E3B3E`, `--ottanio-deep #0a2d2f`, `--verde-notte #081E20`, `--oro #C9A86A` (+ `--oro-soft`/`--oro-bright`), `--avorio #F4ECDC`, `--rosa-rame #D49785`, `--corallo #EA7275`, `--inchiostro #1A1A1A`; ease `--ease-lux`, `--ease-wow`; `--dur-fast`, `--dur-mid`. Font già caricati: Playfair Display, Inter, Cormorant Garamond. *(In questo intervento la palette resta quella attuale: niente restyle.)*

### Tono (per le poche etichette/testi nuovi)
Registro **evocativo ma asciutto**, lusso sobrio. Niente emoji, niente "prenota ora". "menù" con accento. Etichette di navigazione semplici e nobili.

---

# PARTE A — GLOBO DI NAVIGAZIONE IN HOME

## A1. Cos'è e dove va
Una **sfera interattiva** in stile *boule de neige* — vetro, riflessi, profondità — ma riempita di **particelle brillanti** (luccichio dorato/avorio/corallo) **al posto della neve**. La sfera **ruota dolcemente** e mostra le **sezioni del sito** come nodi cliccabili: cliccando un nodo si va alla pagina (innescando la transizione a farfalle della Parte B).

**Posizione:** una **nuova sezione dedicata in `index.html`, subito sotto la hero** (cioè dopo `</section>` della `.hero`, prima o in sostituzione/integrazione del lead `#scopri` — scegli l'innesto più pulito mantenendo il lead testuale per i crawler). Sezione a tutta larghezza, centrata, con un po' di respiro verticale.

## A2. Sezioni (nodi) — CONFIG in cima al file
Metti l'elenco in **un solo posto** (oggetto in cima a `assets/js/orb.js`), facile da editare:
- **La Villa** → `/la-villa/`
- **Il Segreto** *(ristorante)* → `/il-segreto/`
- **Esperienze** → `/esperienze/`
- **Eventi** → `/eventi/`
- **Matrimoni** → `/matrimoni/`
- **Contatti** → `/contatti/`

*(Verifica che gli slug esistano nel repo. Se vuoi aggiungere "Il menù" `/il-segreto/menu/` o "Offerte" `/offerte/`, basta aggiungerli al CONFIG.)*

## A3. Comportamento
- **Rotazione automatica** lenta e continua; al **hover/drag** (pointer) l'utente la fa girare, con leggera inerzia; ripresa dell'auto-rotazione quando è inattiva.
- I nodi sono **etichette cliccabili** (vere `<a>`): hover → evidenziazione (scala o glow in `--oro`/`--corallo`); profondità resa con **opacità e scala in base alla z** (i nodi "dietro" più piccoli e tenui).
- **Particelle brillanti** dentro la sfera: piccoli punti che luccicano (alpha che pulsa) con leggero **glow**, in deriva lenta, confinati al cerchio del globo (mask circolare). Densità misurata; **non** devono coprire la leggibilità delle etichette.
- Clic su un nodo → naviga alla pagina (la transizione a farfalle parte da sola perché intercetta i link interni; vedi B).

## A4. Tecnica (zero dipendenze)
- **Disposizione sferica dei nodi** con CSS 3D: distribuisci i nodi sulla sfera (es. *Fibonacci sphere*), posizionali con `transform: translate3d(...)`, e ruota un contenitore interno (rotX/rotY aggiornati via `requestAnimationFrame`, oppure animazione CSS per l'auto-rotazione + override JS durante il drag). Ogni etichetta fa da *billboard* (contro-ruota per restare frontale e leggibile). Usa `perspective` sul contenitore.
- **Vetro del globo**: puro CSS — cerchio con gradienti radiali per luce/ombra, *rim light*, riflesso speculare in alto, ombra morbida sotto. Deve leggersi come una sfera di vetro.
- **Particelle brillanti**: un `<canvas>` dietro i nodi, **clippato a cerchio**, sullo stile di `wow-dust` (motes con `shadowBlur`, alpha che oscilla con `sin`, colori `201,168,106` oro / `234,114,117` corallo / `244,236,220` avorio). Cap sul numero, **DPR cap a 2**.
- Tutto **home-scoped**: niente impatti globali.

## A5. Responsive
- **Desktop:** globo ampio e centrato sotto la hero.
- **Mobile:** globo più piccolo, **trascinabile** col tocco; se lo spazio è poco o la performance è critica, degrada alla griglia statica (A6).

## A6. Accessibilità, SEO, fallback (requisito)
- Nel sorgente HTML ci deve essere un **`<nav>`/lista di link reali** alle sezioni (i crawler e il "no-JS" vedono questo). Il globo è il layer di *enhancement* sopra questa lista.
- **Tastiera:** ogni nodo focalizzabile in ordine logico, `:focus-visible` evidente, Invio attiva il link.
- **`prefers-reduced-motion`:** la sfera **non ruota**, le particelle si fermano/spariscono; mostra una **griglia/lista statica** elegante con gli stessi link.
- **`saveData`:** riduci o disattiva le particelle.
- **Performance:** un solo RAF per il globo, **pausa su `visibilitychange`**, nessun lavoro pesante su `scroll`/`resize` senza throttling.

## A7. File e wiring (home-only)
- Nuovo: `assets/js/orb.js` (comportamento globo + canvas particelle), linkato **solo in `index.html`** (dopo `home.js`, `defer`).
- Stili: aggiungi in `assets/css/home.css` (è la home).
- Markup della sezione globo direttamente in `index.html`, con la `<nav>` di link reali dentro (fallback).

---

# PARTE B — TRANSIZIONE DI PAGINA "FARFALLE" (full-screen)

## B1. Concept
A ogni cambio pagina, **uno sciame di farfalle riempie lo schermo**: in **uscita** le farfalle arrivano dai bordi e **chiudono** (coprono) tutta la viewport con un velo; in **entrata**, sulla pagina nuova, le farfalle si **aprono** (si disperdono volando via, come ali che si schiudono) e rivelano il contenuto. Elegante e breve: l'effetto deve impreziosire, non rallentare.

## B2. Tecnica (MPA, niente router SPA) — in `assets/js/transition.js`
Overlay fisso a tutto schermo `#vl-transition` con un `<canvas>`, `z-index` alto (sopra il contenuto, sotto eventuali alert), `aria-hidden="true"`, `pointer-events` attivi solo durante la transizione.

- **Farfalle su canvas**: ogni farfalla = corpo sottile + **due ali** (forme bezier/ellissi speculari) che **sbattono** (oscillazione dello *scale* orizzontale delle ali con `cos`, per simulare il volo 3D), con leggera rotazione lungo la direzione di moto e colore in palette (gradiente oro→corallo o avorio). Stile **raffinato**, non cartoon. Cap sul numero (es. ~60 desktop / ~28 mobile), **DPR cap a 2**.
- **Uscita:** genera farfalle dai bordi che convergono e si infittiscono fino a coprire lo schermo, mentre un **velo** (tinta tra `--ottanio` e `--verde-notte`) sale d'opacità fino a coprire del tutto; poi `window.location.href = href`.
- **Entrata:** sulla pagina nuova parti coperto e fai **dispersione** — il velo si dissolve e le farfalle volano via verso i bordi e svaniscono; poi disattiva l'overlay.
- Durate: uscita ~500–700ms, entrata ~500–700ms; totale percepito ≤ ~1.3s. Curve `--ease-wow`.

## B3. Intercettazione link (uscita)
Intercetta i clic sugli `<a>` **stesso-origine** verso un'altra pagina → `preventDefault`, anima la chiusura, poi naviga. **NON intercettare** (lascia il comportamento nativo): `target="_blank"`, `download`, `rel*="external"`, schemi `mailto:`/`tel:`/`https://wa.me`, ancore pure `#...` sulla stessa pagina, e clic con `metaKey/ctrlKey/shiftKey/altKey` o tasto centrale del mouse. **Safety timeout:** se la navigazione non parte entro ~1s, forza `window.location.href`.

## B4. Entrata, bfcache, loader home
- Su `pageshow`/`DOMContentLoaded` esegui l'entrata. Usa un flag in `sessionStorage` (es. `vl_nav`) settato in uscita: l'entrata "piena" parte **solo dopo una navigazione interna**; in atterraggio diretto/refresh fai entrata minima o nulla.
- **bfcache:** su `pageshow` con `event.persisted === true`, assicura l'overlay nascosto (niente schermo bloccato tornando "indietro").
- **Loader home:** al **primo** caricamento della home lascia lavorare `.home-loader` (niente doppio velo); le navigazioni *verso* la home da altre pagine non devono sovrapporre due coperture.

## B5. Wiring globale
- In `partials/footer.html`: aggiungi il markup dell'overlay `#vl-transition` e `<script src="/assets/js/transition.js" defer></script>` (più eventuale CSS, se non lo tieni inline nel JS). Così è attivo su tutte le pagine che usano i partial.
- **A mano** sulle 2 pagine standalone (`il-segreto/index.html`, `esperienze/aperitivi-in-erba/2-giugno-2026/index.html`): aggiungi overlay + script prima di `</body>`.

## B6. Fallback (obbligatori)
`prefers-reduced-motion` e `saveData` → **niente farfalle**: sostituisci con una **dissolvenza** rapida e sobria del solo velo (o transizione nulla). Ferma il RAF a fine transizione; pausa su `visibilitychange`. Nessun layout shift (overlay `position:fixed; inset:0`). A JS spento: navigazione normale.

---

## PERFORMANCE E QUALITÀ
Vanilla puro, nessuna dipendenza, `<script defer>`. Un solo `<canvas>` per il globo e uno per la transizione; un RAF attivo per volta ciascuno; pausa quando la tab è nascosta. Niente regressioni Lighthouse evidenti. Commenti in italiano, stile coerente con `site.js`.

## COSA NON TOCCARE
Logica e marker di `build.js`; nodi **JSON-LD**; lo slug di route `/il-segreto`; gli script inline delle 2 pagine standalone (per la transizione **aggiungi**, non riscrivere). Non introdurre "casa" nei testi nuovi; niente "prenota ora"; niente emoji.

## CHECKLIST DI VERIFICA (eseguila e riportala)
1. `node build.js` completa senza errori e rigenera `dist/`.
2. **Globo:** appare sotto la hero in `index.html`; ruota; i nodi sono **link reali** alle sezioni (presenti nel sorgente come `<nav>` di fallback); clic → naviga; hover/drag funzionano; particelle brillanti confinate al cerchio, leggibilità preservata.
3. **Globo a11y:** con `prefers-reduced-motion`/JS off diventa griglia/lista statica con gli stessi link; tastiera + `:focus-visible` ok.
4. **Transizione farfalle:** uscita (chiusura) + entrata (apertura) fluide su link interni; esterni/`wa.me`/`mailto`/`tel`/`target=_blank`/ancore/clic-modificati **non** intercettati; safety timeout ok; bfcache (back) non lascia lo schermo coperto; nessun doppio velo con il loader della home.
5. **Fallback:** con `prefers-reduced-motion`/`saveData` globo e transizione degradano a versioni sobrie (statica / dissolvenza).
6. Nessun errore in console (desktop + mobile emulato); RAF fermati a riposo.

## OUTPUT ATTESO
- Nuovi: `assets/js/orb.js`, `assets/js/transition.js`.
- Modificati: `index.html` (sezione globo + nav fallback + link a `orb.js`), `assets/css/home.css` (stili globo), `partials/footer.html` (overlay transizione + script globale), e le 2 pagine standalone (wiring transizione a mano).
- Report finale con: file toccati; come tarare i parametri (densità/colori particelle del globo, numero/durata farfalle, velocità rotazione); come editare le sezioni dal CONFIG di `orb.js`; assunzioni prese.

Procedi. In caso di ambiguità reale, scegli l'opzione più sobria e coerente col brand e annotala nel report.
