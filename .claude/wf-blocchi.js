export const meta = {
  name: 'villa-luzi-blocchi',
  description: 'Applica la libreria di blocchi dinamici alle 24 pagine non-bloccate (rework + verifica)',
  phases: [
    { title: 'Rework', detail: 'riscrive il <main> di ogni pagina con la sequenza assegnata' },
    { title: 'Verifica', detail: 'controlla check.js + voce + blocchi e corregge' },
  ],
}

const ROOT = '/Users/j/Documents/GitHub/il-segreto-di-villa-luzi'

// ─────────────────────────────────────────────────────────────
// COOKBOOK — scheletri HTML dei blocchi non presenti in la-villa.
// I blocchi hero/lead/breadcrumb/stat-strip/editorial-feature/
// tile-grid/gallery-mosaic/prose/info-grid/cta-split sono nel
// RIFERIMENTO D'ORO: la-villa/index.html (leggilo).
// ─────────────────────────────────────────────────────────────
const COOKBOOK = `
TOKEN/CLASSI condivise (riusa dal sito, NON reinventare): .container, .container-narrow,
.section-eyebrow.center > (span.line + span.eyebrow + span.line), .block-head (h2 + p),
.reveal (fade-in), .reveal-group (stagger dei figli), .btn, .btn-ghost, .link-arrow,
.lead, .breadcrumb, .info / .info-header / .info-grid.cols-3|cols-4 / .info-cell (h3),
.tile-grid / .tile, .prose, .closing. Le frecce SVG: <svg viewBox="0 0 24 24" fill="none"
stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>.

— MEDIA-BAND (3.3) — fascia immersiva, video o foto di sfondo, testo centrato:
<section class="media-band reveal" aria-label="...">
  <div class="media-band-bg">
    <!-- VIDEO: --> <video autoplay muted loop playsinline data-autoplay poster="/assets/video/band-XXX-poster.webp"><source src="/assets/video/band-XXX.mp4" type="video/mp4" /></video>
    <!-- oppure FOTO: --> <img src="/assets/img/.../x.webp" alt="descrizione concreta" loading="lazy" decoding="async" />
  </div>
  <div class="media-band-inner">
    <div class="media-band-eyebrow">Eyebrow</div>
    <h2 class="media-band-title">Titolo <em>enfasi</em></h2>
    <p class="media-band-text">Frase breve evocativa con un <a href="/rotta/">link interno</a>.</p>
    <a href="/rotta/" class="btn"><span>Call to action</span>FRECCIA</a>
  </div>
</section>

— TIMELINE-STEPS (3.5) — percorso a tappe SEMPRE visibile (mai accordion):
<section aria-label="...">
  <div class="block-head reveal"><div class="section-eyebrow center"><span class="line" aria-hidden="true"></span><span class="eyebrow">Eyebrow</span><span class="line" aria-hidden="true"></span></div><h2>Titolo <em>enfasi</em></h2></div>
  <div class="timeline reveal-group">
    <div class="timeline-step"><div class="timeline-num">1</div><div class="timeline-body"><h3>Passo <em>uno</em></h3><p>Descrizione del passo.</p></div></div>
    <div class="timeline-step"><div class="timeline-num">2</div><div class="timeline-body"><h3>Passo due</h3><p>...</p></div></div>
    <!-- 3–6 step -->
  </div>
</section>

— QUOTE-FEATURE (3.6) — citazione ampia + ritratto opzionale:
<section aria-label="...">
  <div class="quote-feature reveal"> <!-- senza ritratto: class="quote-feature no-portrait reveal" e ometti la figure -->
    <figure class="quote-portrait"><img src="/assets/img/chef-jan-paul-kana.png" alt="Ritratto dello chef ..." loading="lazy" decoding="async" /></figure>
    <div class="quote-body">
      <span class="quote-mark" aria-hidden="true">&ldquo;</span>
      <p class="quote-text">Citazione con eventuale <em>enfasi</em>.</p>
      <p class="quote-cite">Nome Cognome<span>Ruolo / contesto</span></p>
    </div>
  </div>
</section>

— CARD-OFFSET (3.7) — narrazione a zig-zag, le righe pari si invertono da sole (nth-child):
<section aria-label="...">
  <div class="block-head reveal"><div class="section-eyebrow center">...</div><h2>Titolo</h2></div>
  <div class="reveal">
    <div class="offset-row">
      <div class="offset-media"><img src="/assets/img/.../x.webp" alt="..." loading="lazy" decoding="async" /></div>
      <div class="offset-panel"><div class="offset-eyebrow">01</div><h3 class="offset-title">Titolo <em>x</em></h3><p class="offset-text">Testo.</p><a href="/rotta/" class="link-arrow"><span>Scopri</span>FRECCIA</a></div>
    </div>
    <div class="offset-row"> <!-- riga 2 = pari → si inverte automaticamente: stessa struttura --> ... </div>
  </div>
</section>
(IMPORTANTE: le .offset-row devono essere fratelli consecutivi dentro lo stesso wrapper, niente altri elementi in mezzo, o il nth-child salta.)

— PILLARS (3.8) — 3 colonne icona+claim (arioso):
<section aria-label="...">
  <div class="block-head reveal"><div class="section-eyebrow center">...</div><h2>Titolo</h2></div>
  <div class="pillars reveal-group">
    <div class="pillar"><div class="pillar-icon">ICONA-SVG</div><h3>Claim <em>x</em></h3><p>Testo breve.</p></div>
    <!-- ×3 -->
  </div>
</section>
ICONE-SVG disponibili (usa <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">PATHS</svg>, scegli quella coerente):
  villa:    <path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/>
  foglia:   <path d="M12 21c0-6 3-12 9-15-1 7-4 12-9 15Z"/><path d="M12 21c0-4-2-8-6-10"/>
  calice:   <path d="M6 4h12l-6 8v6"/><path d="M9 18h6"/>
  cuore:    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z"/>
  bussola:  <circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-4 2 2-5 4-2Z"/>
  orologio: <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  calendario:<rect x="4" y="5" width="16" height="16" rx="1"/><path d="M4 9h16M8 3v4M16 3v4"/>
  loto:     <path d="M12 20c-4 0-7-3-7-3s2-4 7-4 7 4 7 4-3 3-7 3Z"/><path d="M12 13V4"/>

— MARQUEE (3.10) — nastro orizzontale animato (JS clona per il loop; senza JS resta una riga statica):
<section aria-label="..."><div class="block-head reveal">...</div>
  <div class="marquee"><div class="marquee-track">
    <figure><img src="/assets/img/gallery/XXX/1.webp" alt="..." loading="lazy" decoding="async" /></figure>
    <!-- 6 figure -->
  </div></div>
</section>

— PULL-GALLERY (3.10) — nastro scroll-snap (touch, nessun JS necessario):
<section aria-label="..."><div class="block-head reveal">...</div>
  <div class="pull-gallery">
    <figure><img src="/assets/img/gallery/XXX/1.webp" alt="..." loading="lazy" decoding="async" /></figure>
    <!-- 5–8 figure -->
  </div>
</section>

— CLOSING sobria (esistente, alternativa a cta-split):
<section class="closing" aria-label="Invito">
  <div class="reveal">
    <h2 class="closing-title">Titolo breve.</h2>
    <p class="closing-sub">Sottotitolo su una–due righe.</p>
    <p class="closing-meta">Treia &middot; Marche &middot; dal 1737</p>
    <div class="closing-ctas"><a href="/rotta/" class="btn"><span>...</span>FRECCIA</a><a href="/rotta2/" class="btn-ghost"><span>...</span>FRECCIA</a></div>
  </div>
</section>
`

// ─────────────────────────────────────────────────────────────
// REGOLE — vincoli invariabili per ogni pagina.
// ─────────────────────────────────────────────────────────────
const RULES = `
VINCOLI (non negoziabili — il lavoro fallisce se violati):
1. Modifica SOLO il contenuto dentro <main> ... </main>. NON toccare <head> (title, meta
   description, canonical, og:*, JSON-LD, link, font): restano byte-per-byte. PUOI solo
   ESTENDERE l'eventuale <style> in fondo a <head> per aggiungere regole di dimensione su h3
   se un blocco lo richiede (come fa la-villa con .info-cell h3) — mai modificare regole esistenti.
2. NON toccare i marker <!-- @include:header --> / <!-- @include:footer -->, il <footer>,
   né <script src="/assets/js/site.js" defer></script>.
3. MANTIENI l'<hero> esistente (porta l'unica <h1>) e il <nav class="breadcrumb">. Tieni/raffina
   il blocco .lead. Ricostruisci SOLO il corpo dopo il lead secondo la sequenza assegnata.
4. CONTENUTO: riusa il testo e i DATI già presenti nella pagina — RISTRUTTURA, non inventare.
   Conserva VERBATIM ogni token [DA CONFERMARE: ...] presente. Non aggiungere fatti, numeri,
   nomi, prezzi o orari non già presenti nella pagina o nei dati del sito. Puoi riscrivere la
   prosa di collegamento per adattarla al formato del blocco, mantenendo i fatti.
5. check.js DEVE restare verde: ESATTAMENTE una <h1> (nell'hero, non aggiungerne); nel corpo
   solo h2 e h3, MAI salti (niente h4+; ogni h3 sotto una sezione con h2); ogni <img> con alt
   descrittivo in italiano; ≥3 link interni contestuali <a href="/..."> dentro <main>; NIENTE
   <details>/accordion/tab/class con "accordion"|"tab".
6. MEDIA: usa SOLO i file reali della palette assegnata (esistono su disco). Sulle <img> non-hero
   metti loading="lazy" decoding="async". Sui video band: autoplay muted loop playsinline data-autoplay
   + poster. Sui media di editorial-feature/feature aggiungi data-parallax="0.08". Sui numeri
   stat-strip usa data-count="N" col valore reale anche come testo (fallback).
7. MOTION: avvolgi i blocchi con class="reveal" (o "reveal-group" per griglie/timeline/pillars).
   Tutto il resto (durate, reduced-motion, counter, parallax, marquee) è già gestito da site.css+site.js.
8. VARIETÀ: rispetta la sequenza assegnata; usa i blocchi nuovi indicati. Niente due muri di testo
   consecutivi. Coerenza brand: stessa palette/tipografia, vari solo layout e media.
`

const PAGES = [
  { path: 'index.html', route: '/', name: 'Home', seq: 'PILLARS(le anime/valori della villa: dimora, cucina, esperienze, eventi — scegli 3) -> MEDIA-BAND(foto immersiva) -> tile-grid(i mondi, riusa esistente) -> STAT-STRIP(1737, 8 ettari, 21 luoghi, 4 anime) -> CTA-SPLIT', newBlocks: 'PILLARS, MEDIA-BAND, STAT-STRIP, CTA-SPLIT', media: 'media-band foto: /assets/img/gallery/la-villa/1.webp o /assets/img/covers/il-luogo.webp; tile covers: /assets/img/covers/{soggiornare,esperienze,eventi}.webp e /assets/img/dish-tartare.png; cta-split: /assets/img/gallery/la-villa/3.webp. Pillars: solo icone.', special: 'La home ha hero VIDEO (loop) già presente: NON toccarlo. È la pagina più importante: massima cura.' },

  { path: 'il-luogo/index.html', route: '/il-luogo/', name: 'Il luogo', seq: 'MEDIA-BAND(VIDEO band-il-luogo) -> EDITORIAL-FEATURE(Treia e le Marche interne) -> GALLERY-MOSAIC(8 foto territorio) -> PILLARS(3 tratti del territorio) -> info-grid(distanze, riusa) -> CLOSING sobria', newBlocks: 'MEDIA-BAND, EDITORIAL-FEATURE, GALLERY-MOSAIC, PILLARS', media: 'video: /assets/video/band-il-luogo.mp4 poster /assets/video/band-il-luogo-poster.webp; gallery: /assets/img/gallery/il-luogo/1..8.webp; editorial: /assets/img/covers/il-luogo.webp.', special: '' },

  { path: 'journal/index.html', route: '/journal/', name: 'Journal (indice)', seq: 'CARD-OFFSET(gli articoli in evidenza: i-ventuno-luoghi + cucina-del-segreto, zig-zag con link) -> PULL-GALLERY(atmosfera) -> CTA-SPLIT', newBlocks: 'CARD-OFFSET, PULL-GALLERY, CTA-SPLIT', media: 'offset: /assets/img/covers/i-ventuno-luoghi.webp e /assets/img/covers/cucina-del-segreto.webp; pull-gallery: /assets/img/gallery/menu/1..6.webp; cta-split: /assets/img/covers/journal.webp.', special: 'È una listing page breve: non gonfiare di testo. Linka gli articoli reali esistenti.' },

  { path: 'journal/i-ventuno-luoghi/index.html', route: '/journal/i-ventuno-luoghi/', name: 'Journal · I ventuno luoghi', seq: 'TIMELINE-STEPS(una selezione dei 21 luoghi come tappe nominate) -> QUOTE-FEATURE(senza ritratto, una voce sulla casa) -> EDITORIAL-FEATURE -> CLOSING sobria', newBlocks: 'TIMELINE-STEPS, QUOTE-FEATURE, EDITORIAL-FEATURE', media: 'editorial: /assets/img/gallery/il-luogo/2.webp; nessun ritratto (quote no-portrait). Timeline senza foto o con /assets/img/gallery/il-luogo/x.webp.', special: 'Articolo BlogPosting: mantieni il JSON-LD in head. I 21 luoghi sono fatti canonici già nella pagina.' },

  { path: 'journal/cucina-del-segreto/index.html', route: '/journal/cucina-del-segreto/', name: 'Journal · Cucina del Segreto', seq: 'EDITORIAL-FEATURE -> QUOTE-FEATURE(ritratto chef) -> GALLERY-MOSAIC(piatti/sala) -> CTA-SPLIT', newBlocks: 'EDITORIAL-FEATURE, QUOTE-FEATURE, GALLERY-MOSAIC, CTA-SPLIT', media: 'editorial: /assets/img/gallery/menu/1.webp; ritratto: /assets/img/chef-jan-paul-kana.png (o chef-villa-luzi.png); gallery: /assets/img/gallery/menu/1..6.webp; cta: /assets/img/covers/cucina-del-segreto.webp.', special: 'Articolo BlogPosting. Lo chef è Jan Paul Kana (già nei dati del sito).' },

  { path: 'soggiornare/index.html', route: '/soggiornare/', name: 'Soggiornare', seq: 'STAT-STRIP -> EDITORIAL-FEATURE -> tile-grid(le camere: room-villa, suite-villa) -> GALLERY-MOSAIC -> CTA-SPLIT', newBlocks: 'STAT-STRIP, EDITORIAL-FEATURE, GALLERY-MOSAIC, CTA-SPLIT', media: 'gallery: /assets/img/gallery/soggiornare/1..6.webp; editorial: /assets/img/covers/soggiornare.webp; tile covers: /assets/img/covers/{room-villa,suite-villa}.webp; cta: /assets/img/gallery/soggiornare/2.webp.', special: 'Stat numeri SOLO se reali/presenti nella pagina; altrimenti usa pillars al posto di stat-strip.' },

  { path: 'soggiornare/camere/index.html', route: '/soggiornare/camere/', name: 'Soggiornare · Le camere', seq: 'CARD-OFFSET(Room Villa + Suite Villa, zig-zag con link alle schede) -> PILLARS(3 tratti del soggiorno) -> QUOTE-FEATURE(no ritratto) -> CLOSING sobria', newBlocks: 'CARD-OFFSET, PILLARS, QUOTE-FEATURE', media: 'offset: /assets/img/covers/room-villa.webp e /assets/img/covers/suite-villa.webp; quote no-portrait.', special: '' },

  { path: 'soggiornare/camere/room-villa/index.html', route: '/soggiornare/camere/room-villa/', name: 'Room Villa', seq: 'EDITORIAL-FEATURE -> STAT-STRIP(o pillars se numeri non reali) -> PULL-GALLERY -> info-grid(dotazioni, riusa) -> CTA-SPLIT', newBlocks: 'EDITORIAL-FEATURE, STAT-STRIP, PULL-GALLERY, CTA-SPLIT', media: 'editorial: /assets/img/covers/room-villa.webp; pull-gallery: /assets/img/gallery/soggiornare/1..6.webp; cta: /assets/img/gallery/soggiornare/4.webp.', special: 'Scheda camera: dotazioni/tariffe spesso [DA CONFERMARE] — conservali.' },

  { path: 'soggiornare/camere/suite-villa/index.html', route: '/soggiornare/camere/suite-villa/', name: 'Suite Villa', seq: 'MEDIA-BAND(foto) -> TIMELINE-STEPS(una giornata in suite) -> QUOTE-FEATURE(no ritratto) -> info-grid(riusa) -> CLOSING sobria', newBlocks: 'MEDIA-BAND, TIMELINE-STEPS, QUOTE-FEATURE', media: 'media-band foto: /assets/img/covers/suite-villa.webp; timeline senza foto.', special: 'Scheda camera: dati [DA CONFERMARE] da conservare.' },

  { path: 'offerte/index.html', route: '/offerte/', name: 'Offerte', seq: 'CARD-OFFSET(le combinazioni su misura, zig-zag) -> STAT-STRIP(o pillars se numeri non reali) -> QUOTE-FEATURE(no ritratto) -> CTA-SPLIT', newBlocks: 'CARD-OFFSET, STAT-STRIP, QUOTE-FEATURE, CTA-SPLIT', media: 'offset: /assets/img/covers/{soggiornare,esperienze,matrimoni}.webp; cta: /assets/img/covers/offerte.webp.', special: 'NESSUN prezzo inventato: le tariffe sono [DA CONFERMARE]. Niente Offer JSON-LD.' },

  { path: 'il-segreto/menu/index.html', route: '/il-segreto/menu/', name: 'Il Segreto · Menu', seq: 'QUOTE-FEATURE(ritratto chef, vicino all\'apertura) -> [SEZIONI MENU/CARTE ESISTENTI: PRESERVALE INTATTE] -> GALLERY-MOSAIC(piatti) -> CTA-SPLIT', newBlocks: 'QUOTE-FEATURE, GALLERY-MOSAIC, CTA-SPLIT', media: 'ritratto: /assets/img/chef-jan-paul-kana.png; gallery: /assets/img/gallery/menu/1..6.webp; cta: /assets/img/covers/menu.webp.', special: 'PAGINA DELICATA (952 righe, carte/piatti custom). NON cancellare le sezioni menu/carte/piatti esistenti (carta-1/2/3, dish-*). Aggiungi SOLO: una quote-feature chef vicino all\'inizio, una gallery-mosaic dei piatti e una chiusura cta-split. Intervento minimo, conservativo.' },

  { path: 'esperienze/index.html', route: '/esperienze/', name: 'Esperienze', seq: 'MEDIA-BAND -> tile-grid(le esperienze, riusa) -> GALLERY-MOSAIC -> PILLARS -> CTA-SPLIT', newBlocks: 'MEDIA-BAND, GALLERY-MOSAIC, PILLARS, CTA-SPLIT', media: 'media-band foto: /assets/img/gallery/esperienze/1.webp; gallery: /assets/img/gallery/esperienze/1..6.webp; tile covers: /assets/img/covers/{aperitivi-in-erba,yoga-e-benessere,il-parco}.webp; cta: /assets/img/covers/esperienze.webp.', special: '' },

  { path: 'esperienze/aperitivi-in-erba/index.html', route: '/esperienze/aperitivi-in-erba/', name: 'Aperitivi in erba (evergreen)', seq: 'EDITORIAL-FEATURE -> TIMELINE-STEPS(come funziona l\'aperitivo sull\'erba) -> QUOTE-FEATURE(no ritratto) -> info-grid(riusa) -> CLOSING sobria', newBlocks: 'EDITORIAL-FEATURE, TIMELINE-STEPS, QUOTE-FEATURE', media: 'editorial: /assets/img/gallery/esperienze/2.webp; timeline senza foto.', special: 'EVERGREEN (NON la pagina 2-giugno-2026, che è bloccata). Linka alla pagina esperienze.' },

  { path: 'esperienze/yoga-e-benessere/index.html', route: '/esperienze/yoga-e-benessere/', name: 'Yoga e benessere', seq: 'QUOTE-FEATURE(no ritratto) -> CARD-OFFSET(le pratiche) -> STAT-STRIP(o pillars se numeri non reali) -> CTA-SPLIT', newBlocks: 'QUOTE-FEATURE, CARD-OFFSET, STAT-STRIP, CTA-SPLIT', media: 'offset: /assets/img/gallery/esperienze/3.webp e /assets/img/covers/yoga-e-benessere.webp; cta: /assets/img/covers/yoga-e-benessere.webp.', special: '' },

  { path: 'esperienze/il-parco/index.html', route: '/esperienze/il-parco/', name: 'Il parco', seq: 'GALLERY-MOSAIC -> EDITORIAL-FEATURE -> TIMELINE-STEPS(i luoghi del parco come tappe) -> info-grid(riusa) -> CLOSING sobria', newBlocks: 'GALLERY-MOSAIC, EDITORIAL-FEATURE, TIMELINE-STEPS', media: 'gallery: /assets/img/gallery/esperienze/1..6.webp; editorial: /assets/img/gallery/il-luogo/4.webp.', special: 'I 21 luoghi sono fatti canonici già nella pagina.' },

  { path: 'eventi/index.html', route: '/eventi/', name: 'Eventi', seq: 'PILLARS(3 tipi di evento: matrimoni, eventi privati, corporate) -> MEDIA-BAND -> tile-grid(riusa) -> STAT-STRIP(o pillars se numeri non reali) -> CTA-SPLIT', newBlocks: 'PILLARS, MEDIA-BAND, STAT-STRIP, CTA-SPLIT', media: 'media-band foto: /assets/img/gallery/eventi/1.webp; tile covers: /assets/img/covers/{matrimoni,eventi-privati,corporate}.webp; cta: /assets/img/covers/eventi.webp.', special: 'Capienze/mq solo se già presenti nella pagina; altrimenti [DA CONFERMARE].' },

  { path: 'eventi/matrimoni/index.html', route: '/eventi/matrimoni/', name: 'Matrimoni', seq: 'MEDIA-BAND(VIDEO band-matrimoni) -> EDITORIAL-FEATURE -> GALLERY-MOSAIC -> TIMELINE-STEPS(il flusso della giornata) -> CLOSING sobria', newBlocks: 'MEDIA-BAND, EDITORIAL-FEATURE, GALLERY-MOSAIC, TIMELINE-STEPS', media: 'video: /assets/video/band-matrimoni.mp4 poster /assets/video/band-matrimoni-poster.webp; gallery: /assets/img/gallery/eventi/1..6.webp; editorial: /assets/img/covers/matrimoni.webp.', special: 'Linka anche a /matrimoni-nelle-marche/ (landing query-intent).' },

  { path: 'eventi/eventi-privati/index.html', route: '/eventi/eventi-privati/', name: 'Eventi privati', seq: 'EDITORIAL-FEATURE -> CARD-OFFSET(tipi di festa) -> STAT-STRIP(o pillars se numeri non reali) -> QUOTE-FEATURE(no ritratto) -> CTA-SPLIT', newBlocks: 'EDITORIAL-FEATURE, CARD-OFFSET, STAT-STRIP, QUOTE-FEATURE, CTA-SPLIT', media: 'editorial: /assets/img/gallery/eventi/2.webp; offset: /assets/img/gallery/eventi/3.webp e /assets/img/gallery/eventi/4.webp; cta: /assets/img/covers/eventi-privati.webp.', special: '' },

  { path: 'eventi/corporate/index.html', route: '/eventi/corporate/', name: 'Corporate', seq: 'STAT-STRIP(o pillars se numeri non reali) -> PILLARS(servizi corporate) -> EDITORIAL-FEATURE -> info-grid(riusa) -> CLOSING sobria', newBlocks: 'STAT-STRIP, PILLARS, EDITORIAL-FEATURE', media: 'editorial: /assets/img/covers/corporate.webp; band/gallery: /assets/img/gallery/eventi/5.webp.', special: '' },

  { path: 'matrimoni-nelle-marche/index.html', route: '/matrimoni-nelle-marche/', name: 'Matrimoni nelle Marche (landing)', seq: 'EDITORIAL-FEATURE -> QUOTE-FEATURE(no ritratto) -> CARD-OFFSET(perché le Marche) -> PILLARS -> CTA-SPLIT', newBlocks: 'EDITORIAL-FEATURE, QUOTE-FEATURE, CARD-OFFSET, PILLARS, CTA-SPLIT', media: 'editorial: /assets/img/covers/matrimoni-nelle-marche.webp; offset: /assets/img/gallery/il-luogo/1.webp e /assets/img/gallery/eventi/1.webp; cta: /assets/img/covers/matrimoni.webp.', special: 'Landing editoriale query-intent: deve rimandare a /eventi/matrimoni/. NON è doorway.' },

  { path: 'contatti/index.html', route: '/contatti/', name: 'Contatti', seq: 'PILLARS(modi di contatto: telefono/WhatsApp, email, in villa) -> EDITORIAL-FEATURE -> info-grid(recapiti, riusa: tieni indirizzo/tel/email/mappa) -> CTA-SPLIT', newBlocks: 'PILLARS, EDITORIAL-FEATURE, CTA-SPLIT', media: 'editorial: /assets/img/covers/contatti.webp; cta: /assets/img/covers/la-villa.webp.', special: 'Conserva TUTTI i recapiti reali (tel +39 345 241 9263, email villaluzi1737@gmail.com, indirizzo Contrada Chiaravalle 49 Treia MC) e il link Google Maps.' },

  { path: 'come-arrivare/index.html', route: '/come-arrivare/', name: 'Come arrivare', seq: 'TIMELINE-STEPS(in auto / in treno / in aereo come tappe) -> STAT-STRIP(distanze: 30 min Macerata, 45 Ancona...) -> EDITORIAL-FEATURE -> info-grid(parcheggio, riusa) -> CLOSING sobria', newBlocks: 'TIMELINE-STEPS, STAT-STRIP, EDITORIAL-FEATURE', media: 'editorial: /assets/img/gallery/il-luogo/3.webp; timeline senza foto.', special: 'Le distanze nello stat-strip devono essere quelle reali già in pagina (30/45/60 min).' },

  { path: 'informazioni-utili/index.html', route: '/informazioni-utili/', name: 'Informazioni utili', seq: 'PILLARS(categorie: orari, check-in, regole) -> STAT-STRIP(o pillars 2 se numeri non reali) -> CARD-OFFSET(2 temi pratici) -> info-grid(riusa) -> CTA-SPLIT', newBlocks: 'PILLARS, STAT-STRIP, CARD-OFFSET, CTA-SPLIT', media: 'offset: /assets/img/covers/informazioni-utili.webp e /assets/img/covers/come-arrivare.webp; cta: /assets/img/covers/soggiornare.webp.', special: 'Molti dati sono [DA CONFERMARE] (check-in/out, animali, pagamenti): conservali verbatim. Gli orari ristorante sono canonici/reali.' },

  { path: 'faq/index.html', route: '/faq/', name: 'FAQ', seq: 'MEDIA-BAND -> [le FAQ ESISTENTI restano VISIBILI, mai accordion] -> QUOTE-FEATURE(no ritratto) -> CTA-SPLIT', newBlocks: 'MEDIA-BAND, QUOTE-FEATURE, CTA-SPLIT', media: 'media-band foto: /assets/img/covers/faq.webp o /assets/img/gallery/la-villa/5.webp; cta: /assets/img/covers/contatti.webp.', special: 'FAQPage JSON-LD in head: NON toccarlo. Le 14 Q&A devono restare TUTTE visibili nel testo (niente <details>/accordion). Aggiungi i blocchi nuovi attorno alle FAQ.' },
]

// ─────────────────────────────────────────────────────────────
const REWORK_SCHEMA = {
  type: 'object',
  required: ['path', 'blocksApplied', 'imagesUsed', 'summary'],
  properties: {
    path: { type: 'string' },
    blocksApplied: { type: 'array', items: { type: 'string' } },
    imagesUsed: { type: 'array', items: { type: 'string' } },
    h1Count: { type: 'integer' },
    internalLinks: { type: 'integer' },
    summary: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['path', 'pass', 'newBlocksPresent', 'issuesFound', 'fixesApplied'],
  properties: {
    path: { type: 'string' },
    pass: { type: 'boolean' },
    newBlocksPresent: { type: 'array', items: { type: 'string' } },
    h1Count: { type: 'integer' },
    internalLinks: { type: 'integer' },
    issuesFound: { type: 'array', items: { type: 'string' } },
    fixesApplied: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

function reworkPrompt(p) {
  return `Sei uno sviluppatore frontend + designer di sistema sul sito statico di lusso "Il Segreto di Villa Luzi 1737" (dimora storica, Treia, Marche). Devi dare RITMO e VARIETÀ a UNA pagina applicando la nuova libreria di blocchi media-first, senza inventare contenuti.

PAGINA: ${ROOT}/${p.path}  (rotta ${p.route} — "${p.name}")

PASSI:
1. Leggi per intero il file ${ROOT}/${p.path}.
2. Leggi il RIFERIMENTO D'ORO ${ROOT}/la-villa/index.html: è già stato rifatto bene e mostra l'HTML esatto di hero, breadcrumb, lead, stat-strip, editorial-feature, tile-grid, gallery-mosaic, prose, info-grid, cta-split, con la voce e lo stile da replicare. Per i blocchi non presenti lì, usa il COOKBOOK qui sotto.
3. Riscrivi SOLO il corpo del <main> (dopo hero+breadcrumb+lead) secondo questa SEQUENZA assegnata:
   ${p.seq}
   Blocchi NUOVI obbligatori in questa pagina: ${p.newBlocks}.
4. MEDIA da usare (solo questi file reali): ${p.media}
${p.special ? '5. NOTA SPECIFICA: ' + p.special : ''}

${RULES}

COOKBOOK (scheletri dei blocchi non in la-villa):
${COOKBOOK}

Applica le modifiche con gli strumenti di edit sul file. Mantieni i fatti, riusa il testo esistente, conserva i [DA CONFERMARE]. Alla fine restituisci il riepilogo strutturato (path, blocchi applicati, immagini usate, conteggio h1, conteggio link interni in <main>, summary di 1-2 frasi).`
}

function verifyPrompt(p, prev) {
  return `Verifica e RIFINISCI la pagina appena rilavorata del sito Villa Luzi 1737.

PAGINA: ${ROOT}/${p.path} (rotta ${p.route})
Blocchi nuovi che DEVONO essere presenti: ${p.newBlocks}
Riepilogo del rework precedente: ${prev ? JSON.stringify(prev) : '(nessuno)'}

Leggi il file e verifica RIGOROSAMENTE (correggi con Edit ogni problema trovato):
A. check.js: ESATTAMENTE una <h1> nel <main> (conta le occorrenze di "<h1"); nel corpo solo h2/h3 senza salti (mai h4+; ogni h3 dentro una sezione con h2 prima); ogni <img> ha alt="..." descrittivo non vuoto; ≥3 link interni contestuali <a href="/..."> dentro <main> fuori da header/footer; NIENTE <details>, class "accordion"/"tab".
B. <head> intatto: title/meta description/canonical/og:*/JSON-LD non modificati rispetto all'originale (se il rework li ha toccati, RIPRISTINALI: la description deve restare 150–160 caratteri).
C. Marker <!-- @include:header --> / <!-- @include:footer -->, <footer>, <script src="/assets/js/site.js"> presenti e intatti.
D. I blocchi nuovi assegnati sono effettivamente presenti e ben formati (classi corrette: .media-band/.editorial-feature/.gallery-mosaic/.stat-strip/.timeline/.quote-feature/.offset-row/.pillars/.cta-split/.marquee/.pull-gallery). I media referenziati esistono (path /assets/img/... o /assets/video/...). reveal/reveal-group presenti per il motion. data-count sui numeri stat, data-parallax sui media editorial, data-autoplay+poster sui video band.
E. QUALITÀ EDITORIALE: voce coerente col brand (sobria, evocativa, italiana), nessun lorem/placeholder testuale, nessun fatto inventato, [DA CONFERMARE] conservati. Nessun doppione di contenuto grezzo lasciato a metà dal rework.

Se trovi problemi, correggili direttamente nel file. Restituisci il risultato strutturato (pass=true solo se tutto a posto dopo le tue correzioni; elenca issuesFound e fixesApplied; newBlocksPresent; h1Count; internalLinks).`
}

// ─────────────────────────────────────────────────────────────
log('Avvio rework di ' + PAGES.length + ' pagine (pipeline rework -> verifica).')

const results = await pipeline(
  PAGES,
  (p) => agent(reworkPrompt(p), { label: 'rework:' + p.path, phase: 'Rework', schema: REWORK_SCHEMA }),
  (prev, p) => agent(verifyPrompt(p, prev), { label: 'verify:' + p.path, phase: 'Verifica', schema: VERIFY_SCHEMA }),
)

const clean = results.filter(Boolean)
const passed = clean.filter((r) => r.pass)
const failed = clean.filter((r) => !r.pass)

log('Completato: ' + passed.length + '/' + PAGES.length + ' pagine pass; ' + failed.length + ' con problemi residui.')

return {
  total: PAGES.length,
  returned: clean.length,
  passed: passed.map((r) => r.path),
  failed: failed.map((r) => ({ path: r.path, issues: r.issuesFound, notes: r.notes })),
  details: clean,
}
