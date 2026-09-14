# REPORT_CARTA_VINI — Villa Luzi 1737

_Carta dei vini e beverage: che cosa blocca la ristampa della carta e il completamento della pagina QR._
Data: 2026-09-14 · Pagine interessate: `menu/index.html` (La cucina), `menu/cantina/index.html` (La cantina), `stampa/carta/` (carta cartacea).

---

## 0. Come leggere la colonna «stato»

Tre stati diversi, che chiedono azioni diverse alla direzione:

- **Stampato, da confermare** — la voce è già sulla carta in mano ai clienti con l'interpretazione più probabile. Se la lettura è sbagliata, è un errore già pubblicato: ha la precedenza.
- **Sospeso** — la voce non è né sul cartaceo né sulla pagina QR. Resta tracciata come commento `[DA CONFERMARE: …]` dentro `menu/cantina/index.html`, quindi ricompare a ogni `node check.js` finché non si chiude.
- **Da fornire** — non è mai arrivato niente: non c'è nulla da confermare, serve il dato.

---

## 1. La tabella

| # | Voce | Che cosa serve | Stato | Dove si vede oggi |
|---|---|---|---|---|
| 1 | **Beverage** — birre, cocktail, amari e distillati, caffetteria, analcolici | L'intero elenco con i prezzi. È l'unica parte di carta che manca per intero | Da fornire | Nessuna delle due carte ha una sezione bevande |
| 2 | **Testo di presentazione** (copertina del cartaceo e pagina QR della cucina) | Approvazione della direzione sulla riscrittura | Stampato solo nella versione rigenerata il 14/09, **non ancora committata**: la copia andata in tipografia porta il kicker «cucina & cantina» | `stampa/carta/build_carta.py` (lista `INTRO`) e `menu/index.html` |
| 3 | **Franciacorta** — Bellavista, Alma Non Dosato, €75 | ~~Etichetta e prezzo~~ **Arrivati il 14/09.** Resta da confermare la dicitura: in carta è scritto «Alma Non Dosato · Bellavista · Franciacorta DOCG» | **Pubblicato sulla pagina QR, non ancora sul cartaceo**: entrerà alla prima rigenerazione dei PDF | `menu/cantina/index.html`, in coda alle bollicine · lista `BOLLICINE` di `build_carta.py` |
| 4 | **Lumavite a 19 €** — sul foglio «Alinove», che nella gamma Lumavite non esiste | Conferma che si tratti de *Il cuore altrove*, o che la bottiglia non sia in carta | **Sospeso, non stampato.** Sul cartaceo i Lumavite sono solo Fos €25, Sami, Frasseto e Tusiano €42: nessuna bottiglia a 19 € | Da nessuna parte: la voce non è mai entrata in carta |
| 5 | **Champagne a 130 €** — La Cuvée Brut, Laurent-Perrier | Conferma del produttore: dettato a voce, trascrizione incerta | Stampato, da confermare | Cartaceo, facciata cantina · pagina QR, sezione Champagne |
| 6 | **Colle Mara, Colli Maceratesi DOC** | Il foglio dice **21 €**, in carta è stampata la **Ribona a 20 €**. Sono la stessa bottiglia con un prezzo sbagliato, o sono due etichette diverse? | Stampato, da confermare | Cartaceo e pagina QR, fra i bianchi Marche (la domanda «bianco o rosso?» è già stata decisa in stampa: bianco) |
| 7 | **Grillo della Timpa** — Feudo Montoni (Cammarata, PA) | Il prezzo (tagliato dal bordo della foto, leggibile solo «3_») e la conferma del produttore: sul foglio era attribuito a «Feudo Arancio» | Sospeso | Commento fra i bianchi d'Italia di `menu/cantina/index.html` |
| 8 | **Chianti 23 €** — sul foglio «Chianti Castaldo», in carta «Chianti DOCG · Carpineto» | Quale etichetta Carpineto è davvero | Stampato, da confermare | Cartaceo e pagina QR, fra i rossi d'Italia |
| 9 | **Montepulciano d'Abruzzo 28 €** — sul foglio «Zione», in carta «Spinelli» | Quale etichetta Spinelli è davvero | Stampato, da confermare | Cartaceo e pagina QR, fra i rossi d'Italia |
| 10 | **Brunello di Montalcino DOCG** — Carpineto | Se va in carta e a che prezzo (sul foglio senza prezzo) | Sospeso | Commento fra i rossi d'Italia |
| 11 | **Tignanello** — Antinori | Se va in carta e a che prezzo (sul foglio senza prezzo) | Sospeso | Commento fra i rossi d'Italia |
| 12 | **«Kobe € su richiesta»** | Refuso di stampa: il template antepone sempre il simbolo €, anche quando il prezzo è una frase. Da correggere alla prossima generazione del PDF | Stampato | Cartaceo, facciata cucina, Carni al taglio (sulla pagina QR è corretto: «su richiesta») |
| 13 | **Crescia senza prezzo** | Il prezzo della pizza bianca Crescia | Divergente: il cartaceo scrive «prezzo in sala», le due pagine digitali la elencano senza prezzo | Cartaceo, pizze bianche · `menu/index.html` · `il-segreto/index.html` |

---

## 2. Che cosa è stato pubblicato intanto

La pagina QR della cantina (`/menu/cantina/`) è online con **49 bottiglie**: bollicine, champagne, bianchi (Marche e Italia), rosati, rossi (Marche e Italia), dolci e da meditazione. I prezzi si intendono alla bottiglia; l'unica voce servita anche al calice è il Vino di Visciole, con i cantuccini, come sul cartaceo.

Quarantotto di queste sono identiche voce per voce al cartaceo. La quarantanovesima è il Franciacorta del punto 3, arrivato dopo la stampa: **finché i PDF non si rigenerano, la carta di carta ha una bottiglia in meno della pagina QR.** È l'unico scostamento fra le due.

Le voci ai punti 4, 7, 10 e 11 **non sono pubblicate**: restano come commenti nel sorgente della pagina, nella sezione in cui entreranno, e `node check.js` le elenca a ogni esecuzione. Non spariscono e non finiscono in carta senza prezzo.

Il beverage (punto 1) non ha né sezione né voce nel nastro: una sezione vuota, in carta, è peggio di una sezione mancante.

---

## 3. Due cose fuori dai vini, da decidere

**Allergeni.** Nessuna delle tre carte — QR cucina, QR cantina, carta cartacea — porta l'avviso sugli allergeni: la formula non compare da nessuna parte nel sito. Il menù al tavolo è il posto in cui di norma si trova. Serve una riga dalla direzione (o la conferma che l'informazione si dà a voce in sala, come consente la normativa se è segnalato dove chiederla).

**La carta cartacea non è riproducibile com'è.** `stampa/carta/build_carta.py` gira solo con WeasyPrint, i font `@fontsource` e `mark.png` copiati accanto allo script, e scrive `carta-a3.pdf` / `carta-a4.pdf`: i due PDF consegnati hanno un altro nome (`carta-il-segreto-A3-piegato.pdf`, `carta-il-segreto-A4.pdf`). Chi rigenererà la carta dopo aver chiuso i punti qui sopra si troverà i file nuovi accanto ai vecchi, non al posto loro.

---

_Documento di lavoro: non si pubblica. `build.js` esclude i `REPORT_*.md` dalla build per pattern, quindi non finisce in `dist/`._
