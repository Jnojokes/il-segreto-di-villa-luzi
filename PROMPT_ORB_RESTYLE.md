# PROMPT PER CLAUDE CODE — La "palla" (orb home): fix del click + restyle fotonico

> Copia tutto ciò che segue (dal blocco "CONTESTO") e incollalo in Claude Code dalla **root** del repo `il-segreto-di-villa-luzi`.
>
> **Ambito: SOLO la palla** (la sezione orb in home). Non toccare altro. Due cose: (1) **far funzionare il click** sui nodi (oggi naviga male / non naviga, appare solo la foto on hover); (2) un **upgrade estetico e di design notevole** — un vero **blocco fotonico** che fa scoprire i mondi della villa, con la **sfera disegnata** (non una palla vuota), **texture di sfondo che ricorda la dimora**, e profondità/luce da togliere il fiato — mantenendola **funzionale e a zero dipendenze**.

---

## CONTESTO (leggi PRIMA questi file, poi agisci)

- `index.html` → sezione `.orb-section` (~righe 112–134): `.orb-head` (eyebrow/titolo/lead), `.orb-stage` con la lista `<ul.orb-world>` di `<a.orb-node>` (ogni nodo ha `.orb-dot` + `.orb-label`), e l'hint `.orb-hint`. CSS/JS con `?v=3`.
- `assets/css/orb.css` (layer isolato `.orb-*`): griglia statica di fallback + **modalità sfera** `.orb-stage.is-orb` (tag-cloud 3D via CSS transforms), glassmorphism dei nodi, alone centrale `::before`, **base/piedistallo** `::after`, canvas `.orb-dust`, **anteprima foto** `.orb-preview`.
- `assets/js/orb.js` (zero-dip): distribuzione di Fibonacci dei nodi, RAF unico per rotazione + pulviscolo, drag/hover, anteprima foto on hover (`data-cover`), pausa su `visibilitychange`/fuori viewport, fallback a griglia.
- `assets/js/transition.js`: transizione di pagina; i link interni devono navigare passando da qui.

### Vincoli NON negoziabili
1. **Statico, zero dipendenze, zero CDN.** Vanilla JS in IIFE; CSS/SVG inline ok. Niente three.js/librerie.
2. **Crawler AI non eseguono JS:** i nodi restano `<a href>` reali nel sorgente; la sfera è enhancement. Senza JS / `prefers-reduced-motion` / `Save-Data` / no-3D → **griglia statica accessibile** (già prevista: non romperla).
3. **`node build.js`** deve completare senza errori.
4. **Niente volti AI** per eventuali immagini (usa foto reali già nel repo). Tono sobrio, niente emoji, mai "casa".
5. Performance: **un solo RAF**, **DPR cap 2**, cap sulle particelle, pausa fuori viewport — come già fa `orb.js`.

---

## PARTE 1 — FIX DEL CLICK (priorità, prima dell'estetica)

**Sintomo:** sui nodi appare l'anteprima foto al hover, ma **il clic non naviga** (o solo a volte).

**Causa probabile (verificala):** in `orb.js`, su `pointerdown` si fa `stage.setPointerCapture(e.pointerId)` su **tutto lo stage**: il puntatore resta catturato dallo stage e l'evento `click` non arriva più all'`<a>` → niente navigazione. Inoltre **non c'è una soglia** che distingua un *click* da un *drag*: anche micro-movimenti vengono trattati come trascinamento.

**Fix richiesto:**
- **Distingui click e drag con una soglia di movimento** (es. ~6px): registra la posizione al `pointerdown`; se al `pointerup` lo spostamento totale è sotto soglia → è un **click**, lascia che l'`<a>` navighi normalmente (la transizione di `transition.js` parte da sé). Se è sopra soglia → era un **drag**, e in quel caso (e solo allora) sopprimi il click.
- **Non rubare il click ai nodi:** evita `setPointerCapture` sullo stage per i click; se ti serve per il drag, applicalo **solo dopo** aver superato la soglia, e rilascialo correttamente. In alternativa, gestisci il drag senza pointer capture.
- Assicurati che `.orb-preview` e `.orb-dust` abbiano `pointer-events:none` (già così: verificalo) e che lo **stacking** (`z-index` per profondità) lasci il nodo frontale ricevere il puntatore (i nodi molto dietro restano `pointer-events:none`).
- **Verifica su:** clic desktop, **tap mobile**, e **tastiera** (focus sul nodo + Invio) → tutti devono **navigare** alla sezione giusta, con la transizione di pagina.

---

## PARTE 2 — RESTYLE: un "blocco fotonico" che fa scoprire i mondi

Oggi la sfera è **troppo eterea e il blocco è vuoto** (vedi: una palla pallida quasi invisibile in tanto spazio panna). Voglio un **oggetto di design ricco, luminoso e riconoscibile**, ancora elegante e sobrio (lusso, dimora del 1737), ma con **presenza** e **profondità**. Resta tutto **zero-dip**.

### 2.1 La sfera va DISEGNATA (non una palla vuota)
Dai alla sfera una **superficie disegnata**, non solo un alone:
- **SVG inline** sovrapposto alla sfera con **meridiani e paralleli** finissimi (stile **globo antico / incisione settecentesca**) in **oro/ottanio** a bassa opacità, che ruotano leggermente in sincrono con l'orb (o un layer interno in parallasse).
- Sulla superficie, una **mappa evocativa (non letterale) delle "zone" della dimora** — gli otto ettari, i luoghi del parco — resa come **line-art/incisione** tenue (sentieri, cipressi, la palazzina, la fontana): un *globo cartografico* della villa. Stilizzata e leggera, non una mappa reale.
- Vetro più **presente**: rim-light dorato sul bordo, riflesso speculare in alto, **glow interno** caldo, leggera rifrazione. La sfera deve leggersi chiaramente come oggetto di cristallo inciso, anche sul fondo panna.

### 2.2 "Fotonico" = luce + foto
- **Foto dei mondi** valorizzate: l'anteprima `.orb-preview` diventa una **card raffinata** (cornice a filo d'oro, didascalia elegante, ombra morbida, angoli giusti) che **fiorisce** con grazia al hover/focus del nodo. Valuta una **micro-thumbnail** discreta sul nodo a riposo (così il blocco è già "fotografico", non solo testo).
- **Luce/photonic:** bagliori soffusi attorno ai nodi, leggeri *light-leak*, bloom misurato, blend-mode dove serve. Il pulviscolo "dreamy" attorno alla sfera va **più denso ma morbido** (resta sotto i cap di performance).
- **Linee "costellazione"** sottili in oro che collegano i nodi alla sfera / tra loro, per legare il tutto e suggerire la navigazione.

### 2.3 Texture di sfondo che ricorda la villa
Il blocco non deve galleggiare nel vuoto: dagli uno **sfondo materico, sobrio, in palette panna/ottanio**, che evochi la dimora. Opzioni (scegli e combina con gusto, sempre **AA-safe** per il testo):
- una **foto reale della villa/parco** già nel repo (es. `assets/img/gallery/la-villa/*`, `assets/secret-garden.webp`, `assets/villa-hills.webp`, `assets/cipressi.webp`) **duotonata** in panna/ottanio a bassissima opacità;
- o una **texture/pattern SVG** (carta antica/incisione, foglie del parco, venatura marmo/affresco) molto tenue;
- più il **grain** coerente col resto del sito. Sfuma ai bordi verso la panna piena: niente stacchi netti. Il risultato è un **blocco coeso e immersivo**, non una sezione vuota.

### 2.4 Composizione e movimento
- Rendi la sezione un **blocco contenuto e ben ritmato** (riduci il vuoto eccessivo della versione attuale): titolo/eyebrow curati, la sfera come protagonista, hint "TRASCINA PER RUOTARE · TOCCA UN MONDO" raffinato.
- **Base/piedistallo** più convincente (riflesso/ombra di contatto migliori): la sfera **ruota**, la base la **regge**.
- Micro-interazioni eleganti (hover dei nodi, nodo frontale che respira), easing in `--ease-lux`/`--ease-wow`. Tutto fluido a 60fps.

### 2.5 Vincoli del restyle
- **Accessibilità:** nodi = link reali, tastiera, `:focus-visible` evidente; l'anteprima/effetti non intrappolano e non bloccano la navigazione; contrasto **AA** del testo sullo sfondo materico.
- **Reduced-motion / Save-Data / no-3D:** resta la **griglia statica** (no SVG animato, no pulviscolo, no parallasse) — ma può comunque avere lo sfondo materico statico e le card foto su tap.
- **Mobile:** sfera compatta e trascinabile; se troppo pesante, degrada con grazia; lo sfondo materico resta leggero.
- **Palette:** usa i token esistenti (panna base, corallo accento/azione, oro/ottanio per linee e dettagli). Niente colori nuovi a caso.

---

## COSA NON TOCCARE
Le altre sezioni della home e le altre pagine; `build.js`; i nodi JSON-LD; `transition.js` (la sfera ci si appoggia, non la riscrive). Non introdurre dipendenze/CDN. Non rompere la griglia di fallback né i comportamenti di pausa/performance.

## CHECKLIST FINALE (eseguila e riportala)
1. `node build.js` ok; nessun errore console.
2. **Click:** clic desktop, **tap mobile** e **Invio da tastiera** sui nodi **navigano** alla sezione giusta (con transizione); il **drag** ruota senza navigare; nessun click "rubato".
3. **Sfera disegnata:** superficie con meridiani/mappa incisa (SVG), vetro con rim-light/glow/rifrazione — la palla non è più "vuota".
4. **Fotonico:** anteprima foto come card raffinata che fiorisce al hover/focus; luce/bloom/pulviscolo dreamy più ricchi ma performanti; linee oro di collegamento.
5. **Sfondo:** texture/foto duotonata della villa, sobria e sfumata, blocco coeso (non vuoto); testo **AA**.
6. **Fallback:** reduced-motion/Save-Data/no-3D → griglia statica accessibile intatta; mobile fluido.
7. Un solo RAF, DPR cap 2, cap particelle, pausa fuori viewport: confermati.

## OUTPUT ATTESO
- File toccati: `assets/js/orb.js` (fix click drag/threshold + eventuale SVG/effetti), `assets/css/orb.css` (restyle completo), `index.html` `.orb-section` (markup SVG sfera/sfondo, eventuali `data-cover`/thumbnail). Niente nuovi file salvo necessità (es. un piccolo asset texture).
- Report con: causa esatta del bug click e fix applicato; scelte di art direction (sfera disegnata, sfondo, foto); come tarare densità pulviscolo/linee/durate; assunzioni prese.
- **Da confermare a Francesco:** lo stile della superficie della sfera (globo inciso/cartografico vs foto-mappata vs astratto luminoso) se preferisci una direzione precisa; quale foto/texture di sfondo della villa usare.

Procedi: PRIMA il fix del click (Parte 1), POI il restyle (Parte 2). In caso di ambiguità, scegli l'opzione più sobria e coerente col brand e annotala.
