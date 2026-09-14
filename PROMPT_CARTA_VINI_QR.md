# PROMPT · Carta dei vini e beverage sulla pagina QR

> Documento di lavoro, già in `SKIP_ROOT` dentro `build.js`: non si pubblica.
> Aggiornato il 14 settembre 2026.

---

## 0. Cosa c'è già, e non va rifatto

- **`menu/index.html`** — la carta della cucina, pagina QR da tavolo. Standalone
  (niente partial, niente `site.css`), CSS inline, `noindex`, fuori dalla
  sitemap, senza nav né link verso il sito. È in `BLOCKED` dentro `check.js`.
- **`stampa/carta/`** — la carta cartacea, **già impaginata e consegnata**:
  `carta-il-segreto-A3-piegato.pdf` (2 fogli A3, imposti per la piega) e
  `carta-il-segreto-A4.pdf` (4 pagine), generati da `build_carta.py`
  (Python + WeasyPrint, fuori dalla build del sito). **Non rigenerarli**, ma
  tienili presenti: il digitale e il cartaceo devono dire le stesse cose.

## 1. Cosa manca

| # | Cosa | Dove |
|---|------|------|
| A | Pagina QR della cantina | `menu/cantina/index.html` (nuovo) |
| B | Selettore Cucina / Cantina + testo di presentazione | `menu/index.html` + A |
| C | Riepilogo dei punti aperti per la direzione | `REPORT_CARTA_VINI.md` (nuovo) |

Il QR sul tavolo **non cambia**: continua a puntare a `/menu/`. Da lì il
selettore porta alla cantina in un tap. Non creare un secondo QR.

---

## 2. Vincoli del repo — verificali prima di scrivere codice

- **Zero dipendenze.** `package.json` non ha `dependencies`. Non installare
  niente. La build è `node build.js`, punto.
- **Include a build-time.** `build.js` copia il repo in `dist/` risolvendo i
  marker `<!-- @include:nome -->` → `partials/nome.html`. Le pagine QR **non**
  usano i partial: CSS inline nel `<head>`, come `menu/index.html`.
- **`check.js`** applica alle pagine in `BLOCKED` solo controlli soft. Aggiungi
  `menu/cantina/index.html` a quel set, con lo stesso commento di motivazione
  che sta sopra `'menu/index.html'`.
- **Fuori dagli indici**: `noindex, nofollow`, nessuna voce in `sitemap.xml` né
  in `llms.txt`, nessun link dal sito pubblico.
- **Niente JavaScript.** Il selettore sono due link, non un toggle.
- Chiudi con `node build.js && node check.js`: deve uscire 0.

---

## 3. Deliverable A · `menu/cantina/index.html`

Clona l'impianto di `menu/index.html`: stessa testata (logo `LS-Mark.png`,
`IL SEGRETO`, motto), stesso nastro sticky, stesse classi, stesso congedo.
Cambia il titolo in **`La cantina`** e il contenuto.

### Markup delle voci

Riusa le classi esistenti dove il significato coincide:

```html
<section class="categoria-blocco" id="bollicine" aria-label="Bollicine">
  <h2 class="categoria">Bollicine</h2>

  <div class="piatto">
    <p class="piatto-nome">Varà</p>
    <p class="piatto-dettaglio">Tenute Muròla · Passerina, metodo Martinotti</p>
    <p class="piatto-prezzo">€25</p>
  </div>
  …
</section>
```

`piatto-nome` = nome del vino · `piatto-dettaglio` = produttore, denominazione,
territorio · `piatto-prezzo` = prezzo alla bottiglia. Per il Vino di Visciole,
che si serve anche al calice, aggiungi una seconda `piatto-dettaglio` con
`al calice €5`.

### Sezioni, nell'ordine in cui si legge una carta a tavola

1. `#bollicine` · Bollicine
2. `#champagne` · Champagne
3. `#bianchi` · Vini bianchi
4. `#rosati` · Vini rosati
5. `#rossi` · Vini rossi
6. `#dolci` · Dolci e da meditazione

Dentro **Bianchi** e **Rossi** due sottotestate, *Marche* e *Italia*, con i
Marche **sempre per primi**: la casa è marchigiana e il territorio è il primo
argomento di vendita. Serve un elemento nuovo `.sotto-categoria` — Cinzel
piccolo, oro velato, maiuscoletto spaziato, filetto sottile sopra.

### Beverage

I fogli della direzione contengono **solo vini**. Birre, cocktail, amari,
caffetteria e analcolici non sono ancora stati forniti. Lascia in fondo al file
questo commento e **nient'altro** — niente sezione vuota, niente voce nel nastro:

```html
<!-- Beverage: contenuti non ancora forniti dalla direzione (14 settembre 2026).
     Quando arrivano: sezione #beverage in coda, sottocategorie birre / cocktail
     / amari e distillati / caffetteria / analcolici, stesso markup dei vini,
     più la voce nel nastro. -->
```

### Nastro

Sei voci non entrano in una riga su un telefono. Il nastro è già
`overflow-x: auto`: verifica che scorra pulito e che l'ultima voce non resti
tagliata sotto il bordo. Se serve, riduci il `gap` sotto i 380px.

### Chiusura, sopra il congedo

In corsivo, colore `--velo`:

> I prezzi si intendono alla bottiglia. La nostra selezione cambia con le
> stagioni e con quello che le cantine ci raccontano: chiedete in sala, c'è
> sempre qualcosa che non è ancora finito in carta.

---

## 4. Deliverable B · selettore e presentazione

### 4.1 Selettore Cucina / Cantina

Due link, uno per pagina, subito **sotto** `.testata-filo` e **sopra** il nastro.
Non è una nav del sito: è un interruttore fra le due facce della stessa carta,
resta dentro il perimetro `noindex` e non viola il vincolo di `check.js`.

```html
<nav class="facce" aria-label="Le due carte">
  <a href="/menu/" aria-current="page">Cucina</a>
  <a href="/menu/cantina/">Cantina</a>
</nav>
```

Due pill affiancate centrate, bordo `--oro-velato` 1px, Cinzel piccolo spaziato,
faccia attiva in `--verde-notte` su fondo `--oro`, l'altra in oro su
trasparente. Area di tocco ≥ 44px. Nessun JavaScript.

Su `menu/index.html` cambia il titolo `Il menù` in **`La cucina`**, così le due
facce si chiamano come i due link, e aggiorna di conseguenza `<title>`,
`og:title` e `meta description`.

### 4.2 Testo di presentazione

Va **solo su `menu/index.html`**, fra il selettore e il nastro — non sulla
cantina, per non ripeterlo. Il nastro è sticky, quindi la navigazione resta a
portata di pollice anche dopo averlo scorso.

Corsivo, colore `--velo`, larghezza massima ~34em, centrato, con un filetto oro
sottile sotto l'ultimo paragrafo per staccarlo dal nastro.

```
C'è una dimora del 1737 alle porte di Treia, e dentro una cucina che guarda
avanti. Il Segreto nasce da qui: dal rispetto per un luogo che ha attraversato
tre secoli, e dalla voglia di raccontare le Marche con la lingua di oggi.

La brigata dello chef Jan Paul Kana, Responsabile Regionale dei Cuochi delle
Marche, sceglie la materia prima una per una — la pasta Mancini, il suino della
Marca IGP, il coniglio di Arcevia, il ciauscolo e la crescia di queste colline —
e la porta in tavola senza fretta. Accanto, la brace: il fuoco vivo, che resta
il cuore di tutto.

Poi ci sono il parco, la piscina, le sere che si allungano. Perché qui, a
tavola, il tempo si ferma.
```

> Questo testo è identico a quello già stampato in copertina sulla carta
> cartacea (`stampa/carta/`): **se lo cambi, cambialo in tutti e due i posti**,
> cioè anche nella lista `INTRO` dentro `build_carta.py`.
>
> Nota: la bozza arrivata dalla direzione via WhatsApp parlava di azienda
> agricola propria, orto, uova e olio monovarietale biologico ed erbe spontanee.
> Nessuna di queste cose risulta dal sito né dalla carta, ed erano quasi
> certamente il testo di un altro locale preso come esempio. Il testo qui sopra
> è la riscrittura sui soli fatti verificabili. **Non reintrodurre quelle
> affermazioni** senza conferma esplicita della direzione: su un menù sono
> dichiarazioni commerciali.

---

## 5. Dataset · carta dei vini

Prezzi alla bottiglia, in euro. **Usa la grafia di queste tabelle**, non quella
del foglio manoscritto: le correzioni sono già state verificate produttore per
produttore.

### Bollicine

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Varà | Tenute Muròla · Passerina, metodo Martinotti | 25 |
| Jurek | Tenute Muròla · metodo classico | 40 |
| Spumante Rosé Extra Brut | Tenuta De Angelis | 25 |
| Passerina Spumantizzata | Tenuta De Angelis | 25 |
| Prà dei Salt Millesimato | Bernardi · Valdobbiadene Prosecco Superiore DOCG | 28 |
| Prosecco Extra Dry | Bellussi | 29 |
| Valdobbiadene Prosecco Superiore DOCG Brut | Bellussi | 35 |

`Jurek` sul foglio era annotato «prosecco»: **non lo è**, è il metodo classico
della casa. `Prà dei Salt` con la T finale.

### Champagne

| Vino | Produttore | € |
|---|---|---|
| Brut | Jean Duclert | 75 |
| Blanc de Blancs | De Vilmont | 90 |
| La Cuvée Brut | Laurent-Perrier | 130 |
| Impérial Brut | Moët & Chandon | 150 |

`De Vilmont` staccato, `Blanc de Blancs` al plurale.

### Vini bianchi · Marche

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Marche Bianco IGT | Colle Mara | 12 |
| Passerina Marche IGT | Tenuta De Angelis · biologico | 15 |
| Baccius | Tenute Muròla · Colli Maceratesi Ribona DOC | 16 |
| Pecorino di Offida DOCG | Tenuta De Angelis | 18 |
| Ribona | Colle Mara · Colli Maceratesi DOC | 20 |
| Giulia Morichelli D'Altemps | Tenute Muròla · Marche Bianco IGT | 25 |
| Verdicchio di Matelica DOC | Bisci | 28 |
| Le Vaglie | Santa Barbara · Verdicchio dei Castelli di Jesi Classico | 30 |
| Cambrugiano | Belisario · Verdicchio di Matelica Riserva DOCG | 30 |
| Anima Celeste | Santa Barbara | 36 |
| Stefano Antonucci | Santa Barbara · Verdicchio dei Castelli di Jesi DOC | 50 |
| Mirum | La Monacesca · Verdicchio di Matelica Riserva DOCG | 50 |

`Baccius` con la i. `G. Morichelli` = **Giulia** Morichelli D'Altemps.
`Mirum` e `Cambrugiano` sono entrambi **Riserva** DOCG: la dicitura completa
conta, sono le due bottiglie più alte della sezione.

### Vini bianchi · Italia

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Müller Thurgau DOC | Rottensteiner · Alto Adige | 24 |
| Gewürztraminer | Valle Isarco · Alto Adige | 34 |

### Vini rosati

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Millerose | Tenute Muròla · Marche Rosato IGT | 15 |
| Bianconero | Moroder · Marche | 24 |
| Fos | Lumavite · Marche Rosato IGT, biologico | 25 |

### Vini rossi · Marche

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Rosso Piceno | Colle Mara | 12 |
| Rosso Piceno Superiore DOC | Tenuta De Angelis | 20 |
| Lacrima di Morro d'Alba DOC | Vicari · «da sempre» | 24 |
| Aìon | Moroder · Rosso Conero DOC | 25 |
| Teodoro | Tenute Muròla · Marche Rosso IGT | 28 |
| Oro | Tenuta De Angelis · Rosso Piceno Superiore DOC | 35 |
| Sami | Lumavite · Marche Rosso IGT, Syrah, biologico | 42 |
| Frasseto | Lumavite · Marche Rosso IGT, Sangiovese, biologico | 42 |
| Tusiano | Lumavite · Marche Rosso IGT, biologico | 42 |
| Dorico | Moroder · Conero Riserva DOCG | 60 |

La cantina si chiama **Lumavite** (Rapagnano, FM), non «Lunavite».
`Frasseto` con due S, `Sami` e non «Santi».

### Vini rossi · Italia

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Chianti DOCG | Carpineto · Toscana | 23 |
| Valpolicella Ripasso DOC | Murari · Veneto | 24 |
| Montepulciano d'Abruzzo | Spinelli · Abruzzo | 28 |
| Morellino di Scansano DOCG | Campo all'Olmo · Toscana | 35 |
| Etna Rosso DOC | Pietradolce · Sicilia | 55 |
| Amarone della Valpolicella DOCG | Murari · Veneto | 58 |
| Barbaresco DOCG 2021 | Ada Nada · Piemonte | 70 |

### Dolci e da meditazione

| Vino | Produttore · dettaglio | € |
|---|---|---|
| Malvasia | Pellegrino · vino liquoroso, Sicilia | 30 |
| Passito di Pantelleria | Pellegrino · Sicilia | 27 |
| Vino di Visciole | Vicari · Marche — al calice con cantuccini € 5 | 35 |

### Non mettere in carta

Queste voci **non vanno pubblicate**: dati mancanti o non confermati. Lasciale
come commento HTML con un `TODO`, così restano tracciate e non spariscono.

| Voce | Perché |
|---|---|
| **Franciacorta** | Etichetta e prezzo mai comunicati |
| **Grillo della Timpa** — Feudo Montoni, Sicilia DOC | Prezzo tagliato dal bordo della foto, leggibile solo «3_» |
| **Brunello di Montalcino DOCG** — Carpineto | Sul foglio senza prezzo |
| **Tignanello** — Antinori | Sul foglio senza prezzo |

Sul foglio il Grillo era attribuito a «Feudo Arancio»: è invece di **Feudo
Montoni** (Cammarata, PA). Va corretto quando arriverà il prezzo.

Sono infine cancellate a mano sui fogli, quindi da ignorare: Le Vaglie (seconda
occorrenza), Vespa/Verga, Perlandia, e l'intestazione «Montoni» barrata.

---

## 6. Deliverable C · `REPORT_CARTA_VINI.md`

Stessa forma degli altri `REPORT_*.md` del repo, e anch'esso da aggiungere a
`SKIP_ROOT` in `build.js`. Una tabella sola con tutto ciò che **blocca la
ristampa della carta**, in ordine di urgenza:

1. **Beverage** — birre, cocktail, amari, caffetteria, analcolici: tutto da fornire
2. **Franciacorta** — etichetta e prezzo
3. **Champagne a 130 €** — confermare che sia Laurent-Perrier (dettato a voce, trascrizione incerta)
4. **Grillo della Timpa** — confermare Feudo Montoni e il prezzo
5. **Lumavite a 19 €** — sul foglio «Alinove», che nella loro gamma non esiste: confermare che sia *Il cuore altrove*
6. **Colle Mara, Colli Maceratesi DOC 21 €** — bianco o rosso?
7. **Carpineto Chianti 23 €** — sul foglio «Chianti Castaldo»: quale etichetta
8. **Spinelli 28 €** — sul foglio «Zione»: quale etichetta
9. **Brunello e Tignanello** — in carta o no, e a che prezzo
10. **Testo di presentazione** — far approvare la riscrittura alla direzione (vedi §4.2)

I punti 3 e 5 sono **già pubblicati** nel PDF cartaceo con l'interpretazione più
probabile: segnalali come «stampato, da confermare», non come «da inserire».

---

## 7. Definition of Done

- [ ] `node build.js && node check.js` esce 0
- [ ] `menu/cantina/index.html` aggiunta a `BLOCKED` in `check.js`
- [ ] `REPORT_CARTA_VINI.md` aggiunto a `SKIP_ROOT` in `build.js`
- [ ] `noindex, nofollow` su entrambe le pagine QR; niente in `sitemap.xml` né `llms.txt`
- [ ] Nessun link dalle pagine QR al sito pubblico, a parte il selettore fra le due
- [ ] Zero JavaScript, zero nuove dipendenze
- [ ] Entrambe le pagine si leggono a 320px senza scroll orizzontale
- [ ] Il nastro scorre e mostra l'ultima voce per intero
- [ ] Contrasto ≥ 4.5:1 sul fondo verde notte, verificato sui prezzi in oro
- [ ] Le quattro voci del §5 «Non mettere in carta» sono commentate, non pubblicate
- [ ] Il testo di presentazione è identico a quello in `build_carta.py`

---

## 8. Ordine di lavoro

Fermati a mostrarmi il risultato dopo ogni blocco.

1. Leggi `menu/index.html`, `build.js`, `check.js`. Dimmi cosa hai capito
   dell'impianto e **se qualcosa in questo prompt non corrisponde al repo**.
2. Deliverable A. Fammi vedere `menu/cantina/index.html` renderizzata.
3. Deliverable B, su entrambe le pagine.
4. Aggiornamenti a `build.js` e `check.js`, poi build + check.
5. `REPORT_CARTA_VINI.md`.

Non committare nulla senza che te lo chieda io.
