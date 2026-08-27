# PROMPT · Carta dei vini e beverage — pagina QR + carta A3 da stampa

> Documento di lavoro. Non va pubblicato: aggiungilo a `SKIP_ROOT` in `build.js`
> insieme agli altri `PROMPT_*.md`.

---

## 0. Contesto

Il Segreto è il ristorante di Villa Luzi 1737 (Contrada Chiaravalle 49, Treia MC).
Sul tavolo c'è già un QR che apre `/menu/` — la carta della cucina, pagina
standalone, `noindex`, fuori dalla sitemap, senza nav né link interni, con il suo
design system inline (verde notte, oro, avorio, Cinzel + Cormorant Garamond).
Vedi `menu/index.html` e la sua voce in `BLOCKED` dentro `check.js`.

Manca la carta dei vini. La direzione l'ha dettata a mano su un blocco a
quadretti (6 pagine fotografate) e ha chiesto due cose:

1. **la versione digitale**, raggiungibile dallo stesso QR del tavolo;
2. **la versione cartacea da stampare**, perché serve anche il menù di carta —
   cucina e beverage.

Il dataset trascritto è al §5. È stato verificato produttore per produttore: le
correzioni rispetto al foglio sono segnate, i punti ancora aperti sono al §6.

---

## 1. Obiettivo

Tre deliverable, in quest'ordine:

| # | Cosa | Dove |
|---|------|------|
| A | Pagina QR della cantina | `menu/cantina/index.html` |
| B | Selettore Cucina / Cantina su entrambe le pagine QR | `menu/index.html` + A |
| C | ~~Carta A3 piegata da stampa~~ · **GIÀ FATTA** | `stampa/carta-a3/` |

Il QR sul tavolo **non cambia**: continua a puntare a `/menu/`. Da lì il selettore
porta alla cantina in un tap. Non introdurre un secondo QR.

---

## 2. Vincoli del repo — leggili prima di scrivere codice

Questi sono già stati verificati sul repo, fidati ma controlla:

- **Zero dipendenze.** `package.json` non ha `dependencies`. Non installare
  niente: né build tool, né librerie di PDF, né framework. La build è
  `node build.js` e basta.
- **Include a build-time.** `build.js` copia il repo in `dist/` risolvendo solo
  i marker `<!-- @include:nome -->` → `partials/nome.html`. Le pagine QR **non**
  usano i partial: sono standalone, con CSS inline nel `<head>`. La nuova pagina
  cantina segue la stessa regola.
- **`menu/index.html` è in `BLOCKED` dentro `check.js`** (controlli soft:
  niente nav, niente link interni verso il sito, `noindex`). Aggiungi
  `menu/cantina/index.html` allo stesso set, con lo stesso commento di
  motivazione già presente sopra la riga `'menu/index.html'`.
- **Fuori dagli indici.** `noindex, nofollow`, nessuna voce in `sitemap.xml`,
  nessun link dal sito pubblico, nessuna riga in `llms.txt`.
- **`stampa/` non si pubblica.** Aggiungilo a `SKIP_ROOT` in `build.js` insieme
  a questo `PROMPT_CARTA_VINI_QR.md`.
- **Nessun redirect da toccare** in `vercel.json`: la voce
  `/il-segreto/menu/ → /il-segreto/` riguarda una vecchia route dismessa e
  resta com'è.
- Verifica alla fine con `node build.js && node check.js`: deve uscire 0.

---

## 3. Deliverable A · `menu/cantina/index.html`

Clona l'impianto di `menu/index.html`. Stessa testata (logo `LS-Mark.png`,
`IL SEGRETO`, motto), stesso congedo, stesso nastro sticky delle categorie,
stesse classi. Cambia solo il titolo (`La cantina`) e il contenuto.

**Markup.** Riusa le classi esistenti dove il significato coincide e aggiungi
solo quello che serve davvero per un vino:

```html
<section class="categoria-blocco" id="bollicine" aria-label="Bollicine">
  <h2 class="categoria">Bollicine</h2>

  <div class="piatto">
    <p class="piatto-nome">Varà · Spumante Brut</p>
    <p class="piatto-dettaglio">Tenute Muròla · Passerina, metodo Martinotti · Marche</p>
    <p class="piatto-prezzo">€25</p>
  </div>
  …
</section>
```

`piatto-nome` = nome del vino. `piatto-dettaglio` = produttore, denominazione o
vitigno, territorio. `piatto-prezzo` = prezzo alla bottiglia. Se un vino si serve
anche al calice, aggiungi una seconda `piatto-dettaglio` con `al calice €5`
(oggi vale solo per il Vino di Visciole, vedi §5).

**Ordine delle sezioni e id del nastro** — questo è l'ordine con cui si legge una
carta a tavola, non l'ordine del blocco a quadretti:

1. `#bollicine` — Bollicine
2. `#champagne` — Champagne
3. `#bianchi` — Vini bianchi
4. `#rosati` — Vini rosati
5. `#rossi` — Vini rossi
6. `#dolci` — Dolci e da meditazione
7. `#beverage` — Beverage

Dentro **Bianchi** e **Rossi** metti due sottotestate — *Marche* e *Italia* —
perché la casa è marchigiana e il territorio è il primo argomento di vendita.
Usa un elemento nuovo `.sotto-categoria` (stile: Cinzel piccolo, oro velato,
maiuscoletto spaziato, filetto sottile sopra) e i Marche **sempre per primi**.

**Nastro.** Sette voci non entrano in una riga sola su un telefono: il nastro
esistente è già `overflow-x: auto`, verifica che scorra pulito e che l'ultima
voce non resti tagliata sotto il bordo. Se serve, riduci il `gap` sotto i 380px.

**Sezione Beverage.** I fogli fotografati contengono **solo vini**: birre,
cocktail, amari, caffetteria e analcolici non sono ancora stati forniti.
Crea la sezione con la struttura pronta e le sottocategorie vuote, e lascia
questo commento HTML sopra:

```html
<!-- Beverage: contenuti non ancora forniti dalla direzione (26 agosto 2026).
     Struttura pronta, voci da inserire. Fino ad allora la sezione e la sua
     voce nel nastro restano commentate: meglio assente che vuota. -->
```

Tienila commentata finché non arrivano i dati — una sezione vuota in carta è
peggio di una sezione mancante. Togli anche la voce dal nastro.

**Testo di chiusura**, sopra il congedo, in corsivo e con il colore `--velo`:

> I prezzi si intendono alla bottiglia. La nostra selezione cambia con le
> stagioni e con quello che le cantine ci raccontano: chiedete in sala, c'è
> sempre qualcosa che non è ancora finito in carta.

---

## 4. Deliverable B · selettore Cucina / Cantina

Due link, uno per pagina, subito **sotto** `.testata-filo` e **sopra** il nastro.
Non è una nav del sito — è un interruttore fra le due facce della stessa carta,
quindi resta dentro il perimetro `noindex` e non viola il vincolo di `check.js`
(che verifica l'assenza di link verso le pagine pubbliche, non fra le due QR).

```html
<nav class="facce" aria-label="Le due carte">
  <a href="/menu/" aria-current="page">Cucina</a>
  <a href="/menu/cantina/">Cantina</a>
</nav>
```

Stile: due pill affiancate centrate, bordo `--oro-velato` 1px, Cinzel piccolo
spaziato, la faccia attiva in `--verde-notte` su fondo `--oro`, l'altra in oro su
trasparente. Area di tocco ≥ 44px. Nessun JavaScript.

Su `menu/index.html` cambia il titolo `Il menù` in **`La cucina`**, così le due
facce si chiamano come i due link. Aggiorna di conseguenza `<title>`,
`og:title` e `meta description`.

---

## 5. Deliverable C · GIÀ CONSEGNATO — non rifarlo

`stampa/carta/` contiene i due PDF già impaginati e pronti per la tipografia —
`carta-il-segreto-A3-piegato.pdf` (2 fogli A3, imposti per la piega centrale) e
`carta-il-segreto-A4.pdf` (4 pagine A4 in ordine di lettura) — generati
entrambi da `build_carta.py` (Python + WeasyPrint, fuori dalla build del sito). Imposizione, palette e contenuti sono quelli
descritti qui sotto: la sezione resta come documentazione e come riferimento per
i futuri aggiornamenti (Franciacorta, beverage, prezzi da confermare).

Per aggiornare la carta si toccano solo le liste in cima a `build_carta.py` e si
rilancia: lo script stampa il numero di pagine di ciascun PDF e segnala se non
corrisponde (2 per l'A3, 4 per l'A4). Se una facciata sfora, WeasyPrint apre una
pagina in più: è quello il segnale che il contenuto non ci sta.

Facciate effettive (diverse dalla tabella qui sotto, riequilibrate in corso d'opera):
1 copertina · 2 «La cucina» (antipasti, primi, secondi, carni al taglio, fritti)
· 3 «Pizze & dolci» · 4 «La cantina».

### Impostazione originale (per riferimento)

Carta da tavolo, **A3 orizzontale piegato a metà** → quattro facciate A4
verticali. Niente WeasyPrint, niente Python: un solo file HTML che si apre in
Chrome e si salva in PDF da `Stampa → Salva come PDF → A3, orizzontale,
margini nessuno, grafica di sfondo attiva`. Scrivi queste istruzioni in un
commento in cima al file.

```css
@page { size: A3 landscape; margin: 0; }
```

**Imposizione delle facciate.** Un A3 orizzontale piegato dà, sul foglio
stampato fronte/retro:

- foglio 1 fronte → sinistra = **facciata 4 (retro)**, destra = **facciata 1 (copertina)**
- foglio 1 retro → sinistra = **facciata 2**, destra = **facciata 3**

Costruisci due `<div class="foglio">` da 420×297mm, ciascuno con due colonne da
210mm, e mettici dentro le facciate **in quest'ordine di imposizione**, non in
ordine di lettura. Sbagliare qui significa mandare in stampa una carta illeggibile:
verifica il montaggio prima di consegnare.

| Facciata | Contenuto |
|---|---|
| 1 · copertina | logo, `IL SEGRETO`, `Dove il tempo si ferma`, `La carta`, filetto oro |
| 2 | Cucina: antipasti, primi, secondi |
| 3 | Cucina: pizze rosse, pizze bianche, fritti, carni al taglio, dessert |
| 4 · retro | Cantina: bollicine, champagne, bianchi, rosati, rossi, dolci |

**Palette carta.** Il fondo verde notte del digitale non si stampa: divora
l'inchiostro, ingrigisce in offset e rende i prezzi illeggibili sotto una
lampada da tavolo. Ribalta sulla palette dei template cartacei già in uso per
Il Segreto:

```
fondo crema      #FCFAF4
verde testo      #123A37   titoli, nomi dei piatti
oro              #B49656   etichette e sottotitoli
oro filetti      #C5AB74   righe e bordi
rosa rame        #D49785   tagline sotto il titolo
grigio caldo     #787468   descrizioni secondarie
```

Tipografia: **Cinzel 700** per testate e categorie in maiuscoletto spaziato,
**Cormorant Garamond** corsivo per le voci e tondo 600 per i prezzi. I font
arrivano da Google Fonts come nella pagina QR — il PDF li incorpora in stampa.

**Composizione.** Due colonne per facciata, corpo 9,5–10,5pt, interlinea stretta,
prezzi allineati a destra con filetto punteggiato oro. `break-inside: avoid` su
ogni categoria: una categoria non si spezza mai fra due colonne. Se una facciata
non chiude, riduci prima l'interlinea, poi il corpo, mai il numero di voci.

---

## 6. Dataset · carta dei vini

Prezzi alla bottiglia, in euro. La colonna **Nota** contiene le correzioni già
verificate rispetto al foglio manoscritto: **usa la grafia di questa tabella**,
non quella del foglio.

### Bollicine

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Varà | Tenute Muròla | Passerina, metodo Martinotti · Marche | 25 |
| Jurek | Tenute Muròla | metodo classico · Marche | 40 |
| Spumante Rosé Extra Brut | Tenuta De Angelis | Marche | 25 |
| Passerina Spumantizzata | Tenuta De Angelis | Marche | 25 |
| Valdobbiadene Prosecco Superiore DOCG Brut | Bellussi | Veneto | 35 |
| Prosecco Extra Dry | Bellussi | Veneto | 29 |
| Prà dei Salt Millesimato | Bernardi | Valdobbiadene Prosecco Superiore DOCG, Rive di Collalto | 28 |
| **Franciacorta** | — | — | **⚠ da definire** |

> `Jurek` sul foglio era annotato «prosecco»: **non lo è**, è il metodo classico
> della casa. `Prà dei Salt` con la T finale, non «dei Sali».
> Il **Franciacorta** è stato chiesto a voce dalla direzione il 26 agosto:
> etichetta e prezzo non ancora comunicati. Lascia la riga in HTML **commentata**
> con un `TODO`, così non finisce in carta senza prezzo.

### Champagne

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Brut | Jean Duclert | Champagne AOC | 75 |
| Blanc de Blancs | De Vilmont | Champagne AOC | 90 |
| **La Cuvée Brut** | **Laurent-Perrier** | Champagne AOC | **130 ⚠** |
| Impérial Brut | Moët & Chandon | Champagne AOC | 150 |

> Laurent-Perrier arriva dal vocale del 26 agosto («aggiungi sulla sezione
> Champagne anche il Laurent-Perrier a 130»): la trascrizione automatica era
> incerta, **la maison va confermata a voce prima di stampare**. Il prezzo di 130 €
> è invece chiaro. `De Vilmont` staccato; `Blanc de Blancs` al plurale.

### Vini bianchi · Marche

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Marche Bianco IGT | Colle Mara | Marche | 12 |
| Passerina Marche IGT Bio | Tenuta De Angelis | Marche | 15 |
| Baccius | Tenute Muròla | Colli Maceratesi Ribona DOC | 16 |
| Pecorino di Offida DOCG | Tenuta De Angelis | Marche | 18 |
| Ribona | Colle Mara | Colli Maceratesi DOC | 20 |
| Colli Maceratesi DOC | Colle Mara | Marche | 21 ⚠ |
| Giulia Morichelli D'Altemps | Tenute Muròla | Marche Bianco IGT | 25 |
| Verdicchio di Matelica DOC | Bisci | Marche | 28 |
| Le Vaglie | Santa Barbara | Verdicchio dei Castelli di Jesi Classico | 30 |
| Cambrugiano | Cantine Belisario | Verdicchio di Matelica Riserva DOCG | 30 |
| Anima Celeste | Santa Barbara | Marche | 36 |
| Stefano Antonucci | Santa Barbara | Verdicchio dei Castelli di Jesi DOC | 50 |
| Mirum | La Monacesca | Verdicchio di Matelica Riserva DOCG | 50 |

> `Baccius` con la i. `G. Morichelli` = **Giulia** Morichelli D'Altemps.
> `Mirum` e `Cambrugiano` sono entrambi **Riserva** DOCG: la dicitura completa
> conta, sono le due bottiglie più alte della sezione.
> ⚠ *Colli Maceratesi DOC* di Colle Mara: sul foglio senza tipologia, la DOC
> copre sia bianco che rosso — **chiedere quale sia** prima di stampare.

### Vini bianchi · Italia

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Müller Thurgau DOC | Rottensteiner | Alto Adige | 24 |
| Grillo della Timpa | Feudo Montoni | Sicilia DOC | ⚠ ~30 |
| Gewürztraminer | Valle Isarco | Alto Adige | 34 |

> ⚠ Il foglio scriveva «Feudo Arancio»: il *Grillo della Timpa* è di **Feudo
> Montoni** (Cammarata, PA). Feudo Arancio è un altro produttore e non ha questa
> etichetta — è l'unico errore che un cliente appassionato noterebbe.
> Il prezzo è tagliato dal bordo della foto: leggibile solo la prima cifra, 3_.

### Vini rosati

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Millerose | Tenute Muròla | Marche Rosato IGT | 15 |
| Bianconero | Moroder | rosato · Marche | 24 |
| Fos | Lumavite | Marche Rosato IGT · biologico | 25 |

### Vini rossi · Marche

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Rosso Piceno | Colle Mara | Marche | 12 |
| Il cuore altrove | Lumavite | Marche Rosso IGT · biologico | 19 ⚠ |
| Rosso Piceno Superiore DOC | Tenuta De Angelis | Marche | 20 |
| Lacrima di Morro d'Alba DOC | Vicari | «da sempre» · Marche | 24 |
| Aìon | Moroder | Rosso Conero DOC | 25 |
| Teodoro | Tenute Muròla | Marche Rosso IGT | 28 |
| Oro | Tenuta De Angelis | Rosso Piceno Superiore DOC | 35 |
| Sami | Lumavite | Marche Rosso IGT · Syrah · biologico | 42 |
| Frasseto | Lumavite | Marche Rosso IGT · Sangiovese · biologico | 42 |
| Tusiano | Lumavite | Marche Rosso IGT · biologico | 42 |
| Dorico | Moroder | Conero Riserva DOCG | 60 |

> La cantina si chiama **Lumavite** (Rapagnano, FM), non «Lunavite».
> `Frasseto` con due S, `Sami` e non «Santi».
> ⚠ «ALINOVE» non esiste nella gamma Lumavite: quasi certamente è **«Il cuore
> altrove»**, letto male dal manoscritto. Da confermare a voce.

### Vini rossi · Italia

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Chianti DOCG | Carpineto | Toscana | 23 ⚠ |
| Montepulciano d'Abruzzo | Spinelli | Abruzzo | 28 ⚠ |
| Valpolicella Ripasso DOC | Murari | Veneto | 24 |
| Morellino di Scansano DOCG | Campo all'Olmo | Toscana | 35 |
| Etna Rosso DOC | Pietradolce | Sicilia | 55 |
| Amarone della Valpolicella DOCG | Murari | Veneto | 58 |
| Barbaresco DOCG 2021 | Ada Nada | Piemonte | 70 |
| Brunello di Montalcino DOCG | Carpineto | Toscana | ⚠ manca |
| Tignanello | Antinori | Toscana IGT | ⚠ manca |

> ⚠ **Chianti**: sul foglio «Chianti Castaldo DOCG» — la parola centrale è
> incerta, potrebbe essere *Chianti Classico*. Da confermare.
> ⚠ **Spinelli**: la parola prima di «Montepulciano d'Abruzzo» sembra «Zione»
> ma non corrisponde a nessuna etichetta nota. Da confermare.
> ⚠ **Brunello** e **Tignanello** sono scritti senza prezzo, il Brunello con
> «Montepulciano» cancellato sopra: sembrano una lista dei desideri più che
> bottiglie in cantina. **Non metterli in carta** finché non arriva conferma +
> prezzo: lasciali commentati in HTML con un `TODO`.

### Dolci e da meditazione

| Vino | Produttore | Dettaglio | € |
|---|---|---|---|
| Vino di Visciole | Vicari | Marche · *al calice con cantuccini €5* | 35 |
| Malvasia | Pellegrino | vino liquoroso · Sicilia | 30 |
| Passito di Pantelleria | Pellegrino | Sicilia | ⚠ ~29 |

> Il Vino di Visciole è l'unica voce con il servizio al calice.
> ⚠ Il prezzo del Passito è tagliato dal bordo della foto: 2_, probabilmente 29.

### Voci cancellate sul foglio — non riportare

Le Vaglie (seconda occorrenza), Vespa/Verga, Perlandia, e l'intestazione
«Montoni» barrata sopra il Grillo della Timpa. Sono cancellature della direzione:
ignorale.

---

## 7. Punti aperti — riepilogo per la direzione

Genera in coda al lavoro un `REPORT_CARTA_VINI.md` (stessa forma degli altri
`REPORT_*.md` del repo, e anch'esso in `SKIP_ROOT`) che elenchi, in una tabella
sola, tutto ciò che **blocca la stampa**:

1. Franciacorta — etichetta e prezzo mancanti
2. Champagne a 130 € — confermare che sia Laurent-Perrier
3. Grillo della Timpa — confermare Feudo Montoni e il prezzo
4. Lumavite — confermare «Il cuore altrove»
5. Colle Mara Colli Maceratesi DOC — bianco o rosso?
6. Carpineto Chianti — quale etichetta
7. Spinelli — quale etichetta
8. Brunello e Tignanello — in carta o no, e a che prezzo
9. Passito di Pantelleria — confermare 29 €
10. Beverage — birre, cocktail, amari, caffetteria, analcolici: tutto da fornire

Il digitale può andare online anche con questi punti aperti, escludendo le voci
incerte. **La carta stampata no**: si stampa una volta sola.

---

## 8. Definition of Done

- [ ] `node build.js && node check.js` esce 0
- [ ] `menu/cantina/index.html` aggiunta a `BLOCKED` in `check.js`
- [x] `stampa/` e `PROMPT_CARTA_VINI_QR.md` e `REPORT_CARTA_VINI.md` in `SKIP_ROOT` in `build.js`
- [ ] `noindex, nofollow` su entrambe le pagine QR; nessuna voce in `sitemap.xml` né `llms.txt`
- [ ] Nessun link dalle pagine QR verso il sito pubblico (solo il selettore fra le due)
- [ ] Zero JavaScript, zero nuove dipendenze
- [ ] La cantina si legge a 320px di larghezza senza scroll orizzontale
- [ ] Il nastro scorre e mostra l'ultima voce per intero
- [ ] Contrasto testo/fondo ≥ 4.5:1 su fondo verde notte, verificato sui prezzi in oro
- [ ] Tutte le voci ⚠ del §6 sono **commentate**, non pubblicate
- [ ] `REPORT_CARTA_VINI.md` generato con i 10 punti aperti

---

## 9. Come procedere

Lavora in quest'ordine e fermati a mostrarmi il risultato dopo ogni blocco:

1. Leggi `menu/index.html`, `build.js`, `check.js`. Dimmi cosa hai capito
   dell'impianto e se qualcosa in questo prompt non corrisponde al repo.
2. Deliverable A + B. Fammi vedere `menu/cantina/index.html` renderizzata.
3. Deliverable C, con il montaggio delle facciate spiegato.
4. Aggiornamenti a `build.js` / `check.js`, poi build + check.
5. `REPORT_CARTA_VINI.md`.

Non commitare nulla senza che te lo chieda io.
