#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IL SEGRETO · VILLA LUZI 1737 — carta da tavolo
A3 orizzontale piegato a metà → 4 facciate A4 verticali.

Imposizione (stampa fronte/retro, lato corto):
  foglio 1 (fronte) → [ facciata 4 · cantina ] [ facciata 1 · copertina ]
  foglio 2 (retro)  → [ facciata 2 · cucina  ] [ facciata 3 · cucina    ]

Dipendenze (fuori dal repo del sito, che resta a zero dipendenze):
    pip install weasyprint --break-system-packages
    npm install @fontsource/cinzel @fontsource/cormorant-garamond
    mark.png = assets/img/LS-Mark.png

Render:  python3 build_carta.py
Output:  carta-a3.html + carta-a3.pdf  (2 fogli A3 orizzontali)

Per aggiornare la carta si toccano solo le liste qui sotto: i prezzi
sono stringhe, il resto dell'impaginazione si ricalcola da solo.
Se una facciata sfora, WeasyPrint apre una terza pagina: controllare
sempre che il PDF finale abbia esattamente 2 pagine.
"""
import base64, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).parent
FONTS_C = ROOT / "node_modules/@fontsource/cinzel/files"
FONTS_G = ROOT / "node_modules/@fontsource/cormorant-garamond/files"

def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()

def face(path, fam, weight, style="normal"):
    return (f'@font-face{{font-family:"{fam}";font-weight:{weight};font-style:{style};'
            f'src:url(data:font/woff2;base64,{b64(path)}) format("woff2");}}')

FONTFACES = "".join([
    face(FONTS_C / "cinzel-latin-400-normal.woff2", "Cinzel", 400),
    face(FONTS_C / "cinzel-latin-600-normal.woff2", "Cinzel", 600),
    face(FONTS_C / "cinzel-latin-700-normal.woff2", "Cinzel", 700),
    face(FONTS_G / "cormorant-garamond-latin-400-normal.woff2", "Cormorant Garamond", 400),
    face(FONTS_G / "cormorant-garamond-latin-500-normal.woff2", "Cormorant Garamond", 500),
    face(FONTS_G / "cormorant-garamond-latin-600-normal.woff2", "Cormorant Garamond", 600),
    face(FONTS_G / "cormorant-garamond-latin-400-italic.woff2", "Cormorant Garamond", 400, "italic"),
    face(FONTS_G / "cormorant-garamond-latin-500-italic.woff2", "Cormorant Garamond", 500, "italic"),
    face(FONTS_G / "cormorant-garamond-latin-600-italic.woff2", "Cormorant Garamond", 600, "italic"),
])

LOGO = b64(ROOT / "mark.png")

# ─────────────────────────────────────────────────────────────
#  CUCINA — da menu/index.html (carta v11, 15 luglio 2026)
# ─────────────────────────────────────────────────────────────
ANTIPASTI = [
    ("Selezione di salumi e formaggi con confetture artigianali e crescia", "degustazione per due", "30"),
    ("Il nostro vitello tonnato", None, "15"),
    ("Carpaccio di carne salada su panella di ceci, misticanza, scaglie di Castelmagno DOP e miele di corbezzolo", None, "18"),
    ("Battuta di pomodoro, burrata, colatura di alici, olio al basilico e cialda di pane", None, "12"),
    ("Torre di melanzane, bufala e pomodoro grigliato", None, "12"),
    ("Prosciutto al coltello di suino della Marca IGP", None, "18"),
    ("Prosciutto pata negra al coltello", "100 g", "28"),
]
PRIMI = [
    ("Tortelloni verdi di rucola ripieni di cicoria ripassata, erbe di campo e ricotta, su burro demi-sel, maggiorana, parmigiano e riduzione di aceto balsamico", None, "16"),
    ("Paccheri selezione Mancini, coniglio di Arcevia, crema di melanzane arrosto, mandorle siciliane tostate e menta fresca", None, "15"),
    ("Gnocchi di patate, ragù di salsicce, datterini rossi e gialli", None, "13"),
    ("Tagliatelle paglia e fieno, anatra, birra, salsa di pane e polvere di olive nere", None, "15"),
    ("Fusilloni Mancini dall'orto al piatto e ricotta salata", None, "12"),
    ("Spaghettoni Mancini alla gricia della Marca", None, "13"),
]
SECONDI = [
    ("Carré d'agnello neozelandese CBT con fagiolini alla brace e pesca caramellata", None, "20"),
    ("Tagliata di manzo argentino, frutta estiva e salsa teriyaki", None, "30"),
    ("Coniglio in agrodolce di caponata siciliana", None, "18"),
    ("Assortimento di carne alla brace con patate Anna", None, "25"),
    ("Tataki d'anguria, feta e germogli di soia", None, "16"),
]
PIZZE_ROSSE = [
    ("Margherita", "pomodoro Greci, fior di latte, basilico", "10"),
    ("Bufalina", "pomodoro Greci, mozzarella di bufala, olio al basilico", "12"),
    ("Capricciosa", "pomodoro Greci, fior di latte, carciofini, olive nere, funghi, prosciutto cotto", "13"),
    ("Diavola", "pomodoro Greci, fior di latte, ventricina piccante", "12"),
    ("Lucifero", "pomodoro Greci, nduja calabrese, burrata", "12"),
    ("Tempio", "pomodoro Greci, fior di latte, vellutata di melanzane, melanzane croccanti, fonduta di pecorino", "13"),
    ("Napoli", "pomodoro Greci, fior di latte, alici del Cantabrico, capperi croccanti", "13"),
    ("Sibilla", "pomodoro, mozzarella, cicoria ripassata, salsiccia, cipolla caramellata", "14"),
    ("Marchigiana", "pomodoro, mozzarella, ciauscolo e Varnelli, cicoria", "14"),
]
PIZZE_BIANCHE = [
    ("Hortus", "fior di latte, crema di zucchine, guanciale, crema di pecorino", "13"),
    ("Diana", "fior di latte, mortadella di cinghiale, granella di pistacchio, burrata, olio al basilico", "13"),
    ("La Duchessa", "fior di latte, alici del Cantabrico, burrata", "13"),
    ("Estiva", "crescia, pomodoro a fette, prosciutto crudo, burrata", "14"),
    ("Bosco", "fior di latte, porcini, tartufo", "14"),
    ("4 Formaggi", "mozzarella, gorgonzola, crema di pecorino, Castelmagno, scamorza affumicata", "14"),
    ("Greca", "mozzarella, rucola, feta, noci, pomodorini secchi, miele", "14"),
]
FRITTI = [
    ("Fritto misto", "patatine fritte, olive all'ascolana, cremini, fiori di zucca, verdure pastellate, salvia · per due persone", "15"),
]
TAGLI = [
    ("Marchigiana", None, "8 all'etto"),
    ("Irlandese", None, "8 all'etto"),
    ("Wagyu", None, "30 all'etto"),
    ("Kobe", None, "su richiesta"),
]
DESSERT = [
    ("Cannolo siciliano", None, "8"),
    ("New York cheesecake con caramello salato", None, "8"),
    ("Semifreddo al croccante", None, "8"),
    ("Tiramisù", None, "6"),
]

# ─────────────────────────────────────────────────────────────
#  CANTINA — (vino, produttore/dettaglio, prezzo)
#  Escluse per dati mancanti: Franciacorta, Grillo della Timpa,
#  Brunello di Montalcino, Tignanello. Vedi note di consegna.
# ─────────────────────────────────────────────────────────────
BOLLICINE = [
    ("Varà", "Tenute Muròla · Passerina, metodo Martinotti", "25"),
    ("Jurek", "Tenute Muròla · metodo classico", "40"),
    ("Spumante Rosé Extra Brut", "Tenuta De Angelis", "25"),
    ("Passerina Spumantizzata", "Tenuta De Angelis", "25"),
    ("Prà dei Salt Millesimato", "Bernardi · Valdobbiadene Prosecco Superiore DOCG", "28"),
    ("Prosecco Extra Dry", "Bellussi", "29"),
    ("Valdobbiadene Prosecco Superiore DOCG Brut", "Bellussi", "35"),
]
CHAMPAGNE = [
    ("Brut", "Jean Duclert", "75"),
    ("Blanc de Blancs", "De Vilmont", "90"),
    ("La Cuvée Brut", "Laurent-Perrier", "130"),
    ("Impérial Brut", "Moët &amp; Chandon", "150"),
]
BIANCHI_MARCHE = [
    ("Marche Bianco IGT", "Colle Mara", "12"),
    ("Passerina Marche IGT", "Tenuta De Angelis · biologico", "15"),
    ("Baccius", "Tenute Muròla · Colli Maceratesi Ribona DOC", "16"),
    ("Pecorino di Offida DOCG", "Tenuta De Angelis", "18"),
    ("Ribona", "Colle Mara · Colli Maceratesi DOC", "20"),
    ("Giulia Morichelli D'Altemps", "Tenute Muròla · Marche Bianco IGT", "25"),
    ("Verdicchio di Matelica DOC", "Bisci", "28"),
    ("Le Vaglie", "Santa Barbara · Verdicchio dei Castelli di Jesi Classico", "30"),
    ("Cambrugiano", "Belisario · Verdicchio di Matelica Riserva DOCG", "30"),
    ("Anima Celeste", "Santa Barbara", "36"),
    ("Stefano Antonucci", "Santa Barbara · Verdicchio dei Castelli di Jesi DOC", "50"),
    ("Mirum", "La Monacesca · Verdicchio di Matelica Riserva DOCG", "50"),
]
BIANCHI_ITALIA = [
    ("Müller Thurgau DOC", "Rottensteiner · Alto Adige", "24"),
    ("Gewürztraminer", "Valle Isarco · Alto Adige", "34"),
]
ROSATI = [
    ("Millerose", "Tenute Muròla · Marche Rosato IGT", "15"),
    ("Bianconero", "Moroder · Marche", "24"),
    ("Fos", "Lumavite · Marche Rosato IGT, biologico", "25"),
]
ROSSI_MARCHE = [
    ("Rosso Piceno", "Colle Mara", "12"),
    ("Rosso Piceno Superiore DOC", "Tenuta De Angelis", "20"),
    ("Lacrima di Morro d'Alba DOC", "Vicari · «da sempre»", "24"),
    ("Aìon", "Moroder · Rosso Conero DOC", "25"),
    ("Teodoro", "Tenute Muròla · Marche Rosso IGT", "28"),
    ("Oro", "Tenuta De Angelis · Rosso Piceno Superiore DOC", "35"),
    ("Sami", "Lumavite · Marche Rosso IGT, Syrah, biologico", "42"),
    ("Frasseto", "Lumavite · Marche Rosso IGT, Sangiovese, biologico", "42"),
    ("Tusiano", "Lumavite · Marche Rosso IGT, biologico", "42"),
    ("Dorico", "Moroder · Conero Riserva DOCG", "60"),
]
ROSSI_ITALIA = [
    ("Chianti DOCG", "Carpineto · Toscana", "23"),
    ("Valpolicella Ripasso DOC", "Murari · Veneto", "24"),
    ("Montepulciano d'Abruzzo", "Spinelli · Abruzzo", "28"),
    ("Morellino di Scansano DOCG", "Campo all'Olmo · Toscana", "35"),
    ("Etna Rosso DOC", "Pietradolce · Sicilia", "55"),
    ("Amarone della Valpolicella DOCG", "Murari · Veneto", "58"),
    ("Barbaresco DOCG 2021", "Ada Nada · Piemonte", "70"),
]
DOLCI_VINI = [
    ("Malvasia", "Pellegrino · vino liquoroso, Sicilia", "30"),
    ("Passito di Pantelleria", "Pellegrino · Sicilia", "27"),
    ("Vino di Visciole", "Vicari · Marche — al calice con cantuccini € 5", "35"),
]

# ─────────────────────────────────────────────────────────────
#  RENDER HELPERS
# ─────────────────────────────────────────────────────────────
def piatti(items):
    """Voci di cucina: nome su una riga, descrizione sotto, prezzo a destra."""
    out = []
    for nome, desc, prezzo in items:
        out.append('<div class="v">')
        out.append(f'<p class="v-r"><span class="v-n">{nome}</span>'
                   f'<span class="v-f"></span><span class="v-p">€ {prezzo}</span></p>')
        if desc:
            out.append(f'<p class="v-d">{desc}</p>')
        out.append('</div>')
    return "\n".join(out)

def vini(items):
    """Voci di cantina: nome + prezzo su una riga con filetto, produttore sotto."""
    out = []
    for nome, prod, prezzo in items:
        out.append('<div class="w">')
        out.append(f'<p class="v-r"><span class="w-n">{nome}</span>'
                   f'<span class="v-f"></span><span class="v-p">€ {prezzo}</span></p>')
        if prod:
            out.append(f'<p class="w-d">{prod}</p>')
        out.append('</div>')
    return "\n".join(out)

def h2(t):   return f'<h2 class="cat"><span>{t}</span></h2>'
def h3(t):   return f'<p class="sub">{t}</p>'

# ─────────────────────────────────────────────────────────────
#  FACCIATE
# ─────────────────────────────────────────────────────────────
F1_COPERTINA = f"""
<div class="fac dx cover">
  <div class="band">
    <img class="mark" src="data:image/png;base64,{LOGO}" alt="">
    <p class="band-nome">IL SEGRETO</p>
    <div class="band-filo"></div>
    <p class="band-motto">Dove il tempo si ferma</p>
  </div>
  <div class="cover-body">
    <p class="cover-titolo">La carta</p>
    <div class="cover-rule"></div>
    <p class="cover-kicker">cucina &amp; cantina</p>
  </div>
  <div class="cover-foot">
    <p class="cf-mark">VILLA LUZI 1737</p>
    <p class="cf-addr">Contrada Chiaravalle 49 · Treia (MC)<br>+39 345 241 9263 · villaluzi1737@gmail.com</p>
  </div>
</div>
"""

F2_CUCINA_A = f"""
<div class="fac sx">
  <div class="fac-head"><p class="fh-mark">IL SEGRETO</p><p class="fh-tit">La cucina</p><div class="fh-filo"></div></div>
  <div class="uno">
    {h2('Antipasti')}{piatti(ANTIPASTI)}
    {h2('Primi piatti')}{piatti(PRIMI)}
    {h2('Secondi piatti')}{piatti(SECONDI)}
    {h2('Carni al taglio')}{piatti(TAGLI)}
    <p class="nota">Tagli e pezzature in sala</p>
    {h2('Fritti')}{piatti(FRITTI)}
  </div>
  <div class="fac-foot"><span>1</span></div>
</div>
"""

F3_CUCINA_B = f"""
<div class="fac dx">
  <div class="fac-head"><p class="fh-mark">IL SEGRETO</p><p class="fh-tit">Pizze &amp; dolci</p><div class="fh-filo"></div></div>
  <div class="uno">
    {h2('Pizze rosse')}{piatti(PIZZE_ROSSE)}
    {h2('Pizze bianche')}{piatti(PIZZE_BIANCHE)}
    <p class="nota">Crescia, cipolla e rosmarino &middot; prezzo in sala</p>
    {h2('Dessert')}{piatti(DESSERT)}
  </div>
  <div class="fac-foot"><span>2</span></div>
</div>
"""

F4_CANTINA = f"""
<div class="fac sx">
  <div class="fac-head"><p class="fh-mark">IL SEGRETO</p><p class="fh-tit">La cantina</p><div class="fh-filo"></div></div>
  <div class="due cantina">
    {h2('Bollicine')}{vini(BOLLICINE)}
    {h2('Champagne')}{vini(CHAMPAGNE)}
    {h2('Vini bianchi')}{h3('Marche')}{vini(BIANCHI_MARCHE)}{h3('Italia')}{vini(BIANCHI_ITALIA)}
    {h2('Vini rosati')}{vini(ROSATI)}
    {h2('Vini rossi')}{h3('Marche')}{vini(ROSSI_MARCHE)}{h3('Italia')}{vini(ROSSI_ITALIA)}
    {h2('Dolci e da meditazione')}{vini(DOLCI_VINI)}
  </div>
  <p class="nota-fondo">I prezzi si intendono alla bottiglia. La selezione cambia con le stagioni:<br>chiedete in sala, c'è sempre qualcosa che non è ancora finito in carta.</p>
  <div class="fac-foot"><span>3</span></div>
</div>
"""

CSS = """
@page { size: A3 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body { background: #FCFAF4; }
body { font-family: "Cormorant Garamond", Georgia, serif; color: #2E3D3A; }

/* Posizionamento assoluto e non flex: WeasyPrint frammenta i flex
   container fra le pagine e spezzerebbe l'imposizione. */
.foglio {
  position: relative;
  width: 420mm; height: 296.9mm;
  background: #FCFAF4;
  page-break-after: always; page-break-inside: avoid;
  overflow: hidden;
}
.foglio:last-child { page-break-after: auto; }

.fac {
  position: absolute; top: 0;
  width: 210mm; height: 296.9mm;
  padding: 13mm 14mm 11mm;
  overflow: hidden;
}
.fac.sx { left: 0; border-right: 0.25pt solid #EDE6D6; }
.fac.dx { left: 210mm; }

/* ── testatina di facciata ── */
.fac-head { text-align: center; height: 18mm; }
.fh-mark {
  font-family: "Cinzel", serif; font-weight: 700; font-size: 7.4pt;
  letter-spacing: 0.3em; text-indent: 0.3em; color: #B49656;
}
.fh-tit {
  font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500;
  font-size: 17pt; color: #123A37; margin-top: 1mm; line-height: 1;
}
.fh-filo { width: 16mm; border-top: 0.7pt solid #C5AB74; margin: 2.6mm auto 0; }

.fac-foot { position: absolute; left: 0; right: 0; bottom: 6.5mm; text-align: center; }
.fac-foot span {
  font-family: "Cinzel", serif; font-weight: 700; font-size: 6.4pt;
  letter-spacing: 0.2em; color: #C5AB74;
}

/* ── corpo: altezza esatta, le colonne riempiono in ordine ── */
.uno, .due { height: 248mm; }
.due.cantina { height: 244mm; }
.due { column-count: 2; column-gap: 7mm; column-fill: auto; }

/* ── categorie ── */
h2.cat {
  position: relative; margin: 2.3mm 0 1.3mm; text-align: center;
  font-weight: 400; break-after: avoid; break-inside: avoid;
}
h2.cat:first-child { margin-top: 0; }
h2.cat::before {
  content: ""; position: absolute; left: 0; right: 0; top: 52%;
  border-top: 0.6pt solid #C5AB74;
}
h2.cat span {
  position: relative; background: #FCFAF4; padding: 0 3.2mm;
  font-family: "Cinzel", serif; font-weight: 700; font-size: 8.4pt;
  letter-spacing: 0.18em; text-indent: 0.18em; color: #123A37;
}
p.sub {
  font-family: "Cinzel", serif; font-weight: 600; font-size: 6.2pt;
  letter-spacing: 0.22em; text-indent: 0.22em; color: #B49656;
  text-align: center; margin: 1.3mm 0 0.9mm; break-after: avoid;
}

/* ── voci ── */
.v { break-inside: avoid; margin-bottom: 1.85mm; }
.w { break-inside: avoid; margin-bottom: 0.35mm; }

.v-r { display: flex; align-items: baseline; line-height: 1.14; }
.v-n {
  font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 600;
  font-size: 9.8pt; color: #123A37;
}
.w-n {
  font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 600;
  font-size: 8.9pt; color: #123A37; white-space: nowrap;
}
.v-f {
  flex: 1 1 auto; min-width: 2.5mm; margin: 0 1.5mm;
  border-bottom: 0.5pt dotted #C5AB74; transform: translateY(-0.85mm);
}
.v-p {
  font-family: "Cormorant Garamond", serif; font-style: normal; font-weight: 600;
  font-size: 9.3pt; color: #123A37; white-space: nowrap;
}
.v-d {
  font-size: 8.4pt; font-style: italic; color: #787468;
  line-height: 1.18; margin-top: 0.2mm; padding-right: 11mm;
}
.w-d {
  font-size: 7pt; font-style: italic; color: #787468;
  line-height: 1.05; margin-top: 0.1mm;
}
.nota-fondo {
  position: absolute; left: 14mm; right: 14mm; bottom: 12mm;
  font-size: 8pt; font-style: italic; color: #8d8878;
  text-align: center; line-height: 1.3;
}
.nota {
  font-size: 8.2pt; font-style: italic; color: #8d8878;
  text-align: center; margin: 2.6mm 0 0; line-height: 1.3;
  break-inside: avoid;
}

/* ── copertina ── */
.cover { padding: 0; }
.band { background: #0E3B3E; width: 100%; padding: 26mm 0 20mm; text-align: center; }
.band .mark { width: 34mm; margin: 0 auto 7mm; display: block; }
.band-nome {
  font-family: "Cinzel", serif; font-weight: 700; font-size: 17pt;
  letter-spacing: 0.28em; text-indent: 0.28em; color: #FCFAF4;
}
.band-filo { width: 12mm; border-top: 1pt solid #D49785; margin: 5mm auto 4mm; }
.band-motto { font-style: italic; font-weight: 500; font-size: 13.5pt; color: #D49785; }

.cover-body { height: 152mm; padding: 0 20mm; text-align: center;
  display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cover-titolo {
  font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500;
  font-size: 42pt; color: #123A37; line-height: 1;
}
.cover-rule { width: 22mm; border-top: 0.7pt solid #C5AB74; margin: 7mm auto; }
.cover-kicker {
  font-family: "Cinzel", serif; font-weight: 700; font-size: 8pt;
  letter-spacing: 0.3em; text-indent: 0.3em; color: #B49656;
}
.cover-foot { position: absolute; left: 0; right: 0; bottom: 22mm;
  text-align: center; padding: 0 15mm; }
.cf-mark {
  font-family: "Cinzel", serif; font-weight: 700; font-size: 8pt;
  letter-spacing: 0.24em; text-indent: 0.24em; color: #123A37;
}
.cf-addr {
  font-style: italic; font-weight: 500; font-size: 10pt;
  color: #787468; margin-top: 2.4mm; line-height: 1.45;
}
"""


CSS_A4 = """
@page { size: A4 portrait; margin: 0; }
/* In A4 ogni facciata è una pagina intera: si annulla l'imposizione A3. */
.fac {
  position: relative; left: auto; top: auto;
  width: 210mm; height: 296.9mm;
  page-break-after: always; page-break-inside: avoid;
}
.fac:last-child { page-break-after: auto; }
.fac.sx { border-right: none; }
/* .fac.dx ha specificità maggiore di .fac: va azzerato esplicitamente,
   altrimenti le facciate destre restano spinte fuori pagina di 210mm. */
.fac.sx, .fac.dx { left: auto; }
"""

HTML = f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8">
<title>Il Segreto · La carta — A3 piegato</title>
<style>{FONTFACES}{CSS}</style>
</head><body>
<!-- FOGLIO 1 · fronte:  facciata 4 (cantina) | facciata 1 (copertina) -->
<div class="foglio">{F4_CANTINA}{F1_COPERTINA}</div>
<!-- FOGLIO 2 · retro:   facciata 2 (cucina)  | facciata 3 (pizze) -->
<div class="foglio">{F2_CUCINA_A}{F3_CUCINA_B}</div>
</body></html>"""

(ROOT / "carta-a3.html").write_text(HTML, encoding="utf-8")

# ── A4: le stesse quattro facciate, una per pagina, in ordine di lettura ──
HTML_A4 = f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8">
<title>Il Segreto · La carta — A4</title>
<style>{FONTFACES}{CSS}{CSS_A4}</style>
</head><body>
{F1_COPERTINA}{F2_CUCINA_A}{F3_CUCINA_B}{F4_CANTINA}
</body></html>"""
(ROOT / "carta-a4.html").write_text(HTML_A4, encoding="utf-8")

from weasyprint import HTML as WHTML
for src, out, attese in ((HTML, "carta-a3.pdf", 2), (HTML_A4, "carta-a4.pdf", 4)):
    doc = WHTML(string=src, base_url=str(ROOT)).render()
    n = len(doc.pages)
    doc.write_pdf(ROOT / out)
    stato = "ok" if n == attese else f"ATTENZIONE: attese {attese}"
    print(f"{out}: {n} pagine — {stato}")
