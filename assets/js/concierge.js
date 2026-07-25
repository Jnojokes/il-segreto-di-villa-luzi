/* ════════════════════════════════════════════════════════════════
   VILLA LUZI · CONCIERGE.JS
   Esperienza guidata, deterministica, bilingue IT/EN. Accompagna
   l'ospite tra i mondi della villa, gli fa "tenere" ciò che gli piace
   e converte tutto in un'unica richiesta (WhatsApp per il ristorante).

   - Vanilla puro, zero dipendenze, IIFE come site.js.
   - Nessun backend: tutta la logica è qui, i dati nel CONFIG.
   - Progressive enhancement: il markup è nel sorgente con [hidden];
     a JS spento resta nascosto (la sticky-cta fa da fallback) e tutti
     i contenuti/route restano raggiungibili in HTML statico.
   - Stato in sessionStorage (sopravvive ai cambi pagina), lingua in
     localStorage. Degrada a memoria se lo storage non è disponibile.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════
     CONFIG — UNICA FONTE DI VERITÀ
     Il cliente aggiorna prezzi, testi e link QUI, senza toccare la
     logica sotto. Tutti i testi hanno chiave it / en.
     ════════════════════════════════════════════════════════════════ */
  var CONFIG = {
    // ─── Recapiti / conversione (dati canonici, niente inventati) ───
    whatsapp: '393452419263',
    email: 'villaluzi1737@gmail.com',
    tel: '+393452419263',
    site: 'villaluzi.it',

    // ─── Catalogo: ogni voce è "aggiungibile" alla selezione ───────
    // price: numero in € oppure null (in tal caso usa noteKey).
    // noteKey: 'placeholder' | 'sumisura' | 'preventivo' (testo non-prezzo).
    catalog: {
      // I tre pilastri dell'estate
      domenica: {
        kind: 'domenica', price: 35,
        label: { it: 'La Domenica al Segreto', en: 'Sunday at Il Segreto' },
        name: { it: 'la Domenica al Segreto', en: 'the Sunday at Il Segreto' },
        desc: {
          it: 'Pranzo dalle 12:30 con un antipasto e un primo di Chef Jan Paul Kana, una bevuta e la piscina fino alle 18.',
          en: 'Lunch from 12:30 with a starter and a first course by Chef Jan Paul Kana, one drink and the pool until 18:00.'
        }
      },
      aperitivo: {
        kind: 'aperitivo', price: null, noteKey: 'placeholder',
        label: { it: 'Aperitivo in piscina', en: 'Aperitif by the pool' },
        name: { it: 'l’aperitivo in piscina', en: 'the aperitif by the pool' },
        desc: {
          it: 'L’ora dorata a bordo piscina, la luce bassa sul parco.',
          en: 'The golden hour by the pool, low light over the park.'
        }
      },
      // Listino wellness (selezionabili singolarmente)
      w_corpo: { kind: 'wellness', price: 85, label: { it: 'Massaggio corpo relax o decontratturante (50/60 min)', en: 'Relaxing or deep-tissue body massage (50/60 min)' } },
      w_viso: { kind: 'wellness', price: 95, label: { it: 'Trattamento viso completo', en: 'Full facial treatment' }, sub: { it: 'Detersione, fiala, massaggio, maschera.', en: 'Cleansing, ampoule, massage, mask.' } },
      w_sibilla: { kind: 'wellness', price: 65, label: { it: 'Massaggio viso Sibilla', en: 'Sibilla facial massage' } },
      w_makeup: { kind: 'wellness', price: 65, label: { it: 'Make-up', en: 'Make-up' } },
      w_makeup_sposa: { kind: 'wellness', price: null, noteKey: 'preventivo', label: { it: 'Make-up sposa', en: 'Bridal make-up' } },
      w_mani: { kind: 'wellness', price: 40, label: { it: 'Manicure con smalto', en: 'Manicure with polish' } },
      w_mani_shellac: { kind: 'wellness', price: 50, label: { it: 'Manicure semipermanente Shellac', en: 'Shellac gel manicure' } },
      w_pedi: { kind: 'wellness', price: 50, label: { it: 'Pedicure con smalto', en: 'Pedicure with polish' } },
      w_pedi_shellac: { kind: 'wellness', price: 60, label: { it: 'Pedicure semipermanente Shellac', en: 'Shellac gel pedicure' } },
      // Pacchetti (upselling)
      p_domenica_benessere: {
        kind: 'package', price: 110, oldPrice: 120,
        label: { it: 'Domenica + Benessere', en: 'Sunday + Wellness' },
        desc: { it: 'Il pranzo della domenica con piscina e un massaggio da 50 minuti.', en: 'Sunday lunch with the pool and a 50-minute massage.' }
      },
      p_aperitivo_cena: {
        kind: 'package', price: null, noteKey: 'sumisura',
        label: { it: 'Aperitivo + Cena', en: 'Aperitif + Dinner' },
        desc: { it: 'L’aperitivo in piscina al tramonto che prosegue a cena.', en: 'The aperitif by the pool at sunset, flowing into dinner.' }
      },
      p_giornata_lenta: {
        kind: 'package', price: null, noteKey: 'sumisura',
        label: { it: 'Giornata lenta', en: 'A slow day' },
        desc: { it: 'Un trattamento al mattino, pranzo e pomeriggio in piscina.', en: 'A morning treatment, lunch and an afternoon by the pool.' }
      },
      // Gift card dell'estate
      g_domenica_due: { kind: 'gift', price: 70, label: { it: 'Una Domenica per due', en: 'A Sunday for two' } },
      g_ora_benessere: { kind: 'gift', price: 85, label: { it: 'Un’ora di benessere', en: 'An hour of wellness' } },
      g_aperitivo_due: { kind: 'gift', price: null, noteKey: 'sumisura', label: { it: 'Aperitivo al tramonto per due', en: 'Sunset aperitif for two' } },
      g_libero: { kind: 'gift', price: null, freeValue: [50, 100, 150], label: { it: 'A valore libero', en: 'Open value' } },
      // Mondi (interest con deep link reale) — solo evento e matrimonio
      i_eventi: { kind: 'interest', label: { it: 'Un evento privato', en: 'A private event' }, name: { it: 'un evento privato in villa', en: 'a private event at the villa' }, bullet: { it: 'Evento privato', en: 'Private event' }, link: '/eventi/' },
      i_matrimonio: { kind: 'interest', label: { it: 'Un matrimonio', en: 'A wedding' }, name: { it: 'un matrimonio in villa', en: 'a wedding at the villa' }, bullet: { it: 'Matrimonio', en: 'Wedding' }, link: '/matrimoni/' }
    },

    // ─── Mappa "Esplorare": i mondi della villa con i link reali ────
    worlds: [
      { href: '/la-villa/', t: { it: 'La Villa', en: 'The Villa' }, s: { it: 'La dimora del 1737', en: 'The 1737 residence' } },
      { href: '/il-segreto/', t: { it: 'Il Segreto · Ristorante', en: 'Il Segreto · Restaurant' }, s: { it: 'Il menù d’autore', en: 'The signature menù' } },
      { href: '/esperienze/', t: { it: 'Esperienze', en: 'Experiences' }, s: { it: 'Aperitivi, yoga, il parco', en: 'Aperitifs, yoga, the park' } },
      { href: '/eventi/', t: { it: 'Eventi', en: 'Events' }, s: { it: 'Privati e corporate', en: 'Private & corporate' } },
      { href: '/matrimoni/', t: { it: 'Matrimoni', en: 'Weddings' }, s: { it: 'La dimora tutta per voi', en: 'The residence, all yours' } },
      { href: '/offerte/', t: { it: 'Offerte', en: 'Offers' }, s: { it: 'Le proposte del momento', en: 'Current proposals' } },
      { href: '/contatti/', t: { it: 'Contatti', en: 'Contact' }, s: { it: 'Come arrivare · FAQ', en: 'Getting here · FAQ' } }
    ],

    // ─── Scelte dello Step 1 (intenzioni) e sezioni che attivano ────
    intents: [
      { key: 'domenica', label: { it: 'Una Domenica al Segreto', en: 'A Sunday at Il Segreto' }, sub: { it: 'Pranzo, piscina e l’aperitivo', en: 'Lunch, pool and the aperitif' } },
      { key: 'wellness', label: { it: 'Benessere e massaggi', en: 'Wellness & massage' }, sub: { it: 'Mani sapienti, tempo per sé', en: 'Skilled hands, time for yourself' } },
      { key: 'evento', label: { it: 'Un evento o un matrimonio', en: 'An event or a wedding' }, sub: { it: 'La dimora tutta per voi', en: 'The residence, all yours' } },
      { key: 'gift', label: { it: 'Un regalo', en: 'A gift' }, sub: { it: 'Regalare un’estate', en: 'Gifting a summer' } },
      { key: 'esplorare', label: { it: 'Solo esplorare la villa', en: 'Just explore the villa' }, sub: { it: 'Lasciatevi guidare', en: 'Let yourself be guided' } }
    ],

    // ─── Testi del toast d'ingresso (rotazione, niente emoji) ───────
    toasts: [
      { intent: null, text: { it: 'Esplora il ristorante', en: 'Explore the restaurant' } },
      { intent: 'domenica', text: { it: 'Scopri la Domenica al Segreto', en: 'Discover Sunday at Il Segreto' } },
      { intent: 'wellness', text: { it: 'Un’ora tutta per te', en: 'An hour all for you' } }
    ],

    // ─── Lead-in del messaggio per tipologia (selezione singola) ────
    lead: {
      domenica: { it: 'Vorrei prenotare', en: 'I’d like to book' },
      aperitivo: { it: 'Vorrei un tavolo per', en: 'I’d like a table for' },
      wellness: { it: 'Vorrei prenotare il trattamento', en: 'I’d like to book the treatment' },
      package: { it: 'Vorrei informazioni sul pacchetto', en: 'I’d like details on the package' },
      gift: { it: 'Vorrei regalare', en: 'I’d like to gift' },
      interest: { it: 'Vorrei informazioni su', en: 'I’d like details on' }
    },

    // ─── Frammenti del messaggio (modificabili) ────────────────────
    msg: {
      it: { from: 'Buongiorno, scrivo da ' , arrange: 'Vorrei organizzare:', note: 'Note: ', thanks: 'Grazie.', empty: 'Vorrei conoscere meglio la villa.' },
      en: { from: 'Hello, I’m writing from ', arrange: 'I’d like to arrange:', note: 'Note: ', thanks: 'Thank you.', empty: 'I’d like to get to know the villa better.' }
    },

    // ─── Testi non-prezzo ──────────────────────────────────────────
    priceNote: {
      placeholder: { it: 'formula e orari da confermare', en: 'format and hours to be confirmed' },
      sumisura: { it: 'su misura', en: 'tailored' },
      preventivo: { it: 'su preventivo', en: 'on request' }
    },

    // ─── Stringhe d'interfaccia ────────────────────────────────────
    ui: {
      it: {
        launcherLabel: 'Concierge', launcherSub: 'Da dove cominciamo?',
        kicker: 'Villa Luzi 1737', dialogName: 'Concierge', close: 'Chiudi',
        minimize: 'Riduci', expand: 'Riapri', toastDismiss: 'Più tardi',
        back: 'Indietro', start: 'Cominciamo', toDetails: 'Avanti',
        toSummary: 'La tua selezione', toMessage: 'Prepara la richiesta',
        add: 'Aggiungi', added: 'Aggiunto', hold: 'Tienimi un posto', held: 'Tenuto',
        remove: 'Rimuovi',
        s0title: 'Il lusso è il tempo.', s0lede: 'Da dove cominciamo?',
        s1eyebrow: 'Passo 1 · L’intenzione', s1title: 'Cosa vi attira?', s1lede: 'Scegliete pure più di una cosa.',
        s2eyebrow: 'Passo 2 · I dettagli', s2title: 'Tenete ciò che vi piace', s2lede: 'Aggiungete alla vostra selezione: la invierete in un solo messaggio.',
        s3eyebrow: 'Passo 3 · La vostra selezione', s3title: 'La vostra richiesta', s3lede: 'Modificate pure, poi aggiungete una nota.',
        s4eyebrow: 'Passo 4 · L’invio', s4title: 'Inviate la richiesta', s4lede: 'Questo è il messaggio che invierete.',
        secDomenica: 'La Domenica al Segreto', secAperitivo: 'L’aperitivo in piscina', secWellness: 'Benessere e massaggi',
        secPackages: 'I pacchetti', secGift: 'Le gift card dell’estate', secStay: 'Eventi e matrimoni', secExplore: 'I mondi della villa',
        instead: 'anziché', fieldDate: 'Data', fieldPeople: 'Persone', fieldValue: 'Importo',
        noteLabel: 'Aggiungi una nota', notePlaceholder: 'Es. arriviamo nel pomeriggio…',
        empty: 'La selezione è ancora vuota. Tornate indietro e tenete ciò che vi attira, anche una cosa sola.',
        msgLabel: 'Il tuo messaggio', whatsapp: 'Invia richiesta',
        copy: 'Copia messaggio', copied: 'Copiato', emailBtn: 'Email', phoneBtn: 'Telefono',
        warm: 'Ti aspettiamo in dimora.', giftCta: 'Regala un’estate', openDetail: 'Scopri'
      },
      en: {
        launcherLabel: 'Concierge', launcherSub: 'Where shall we begin?',
        kicker: 'Villa Luzi 1737', dialogName: 'Concierge', close: 'Close',
        minimize: 'Minimize', expand: 'Reopen', toastDismiss: 'Later',
        back: 'Back', start: 'Let’s begin', toDetails: 'Continue',
        toSummary: 'Your selection', toMessage: 'Prepare the request',
        add: 'Add', added: 'Added', hold: 'Hold a spot', held: 'Held',
        remove: 'Remove',
        s0title: 'Time is the real luxury.', s0lede: 'Where shall we begin?',
        s1eyebrow: 'Step 1 · Your intention', s1title: 'What draws you in?', s1lede: 'Feel free to pick more than one.',
        s2eyebrow: 'Step 2 · The details', s2title: 'Keep what you like', s2lede: 'Add to your selection: you’ll send it all in a single message.',
        s3eyebrow: 'Step 3 · Your selection', s3title: 'Your request', s3lede: 'Edit freely, then add a note.',
        s4eyebrow: 'Step 4 · Sending', s4title: 'Send your request', s4lede: 'This is the message you’ll send.',
        secDomenica: 'Sunday at Il Segreto', secAperitivo: 'The aperitif by the pool', secWellness: 'Wellness & massage',
        secPackages: 'The packages', secGift: 'Summer gift cards', secStay: 'Events & weddings', secExplore: 'The villa’s worlds',
        instead: 'instead of', fieldDate: 'Date', fieldPeople: 'Guests', fieldValue: 'Amount',
        noteLabel: 'Add a note', notePlaceholder: 'E.g. we arrive in the afternoon…',
        empty: 'Your selection is still empty. Go back and keep what draws you, even just one thing.',
        msgLabel: 'Your message', whatsapp: 'Send request',
        copy: 'Copy message', copied: 'Copied', emailBtn: 'Email', phoneBtn: 'Call',
        warm: 'We’ll be expecting you.', giftCta: 'Gift a summer', openDetail: 'Discover'
      }
    }
  };

  /* ════════════════════════════════════════════════════════════════
     ICONE (SVG inline, sobrie, stroke=currentColor)
     ════════════════════════════════════════════════════════════════ */
  var ICON = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 14l6 5 6-5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 7h12" stroke-linecap="round"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 12H5M11 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>',
    wa: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2.667c-7.36 0-13.333 5.973-13.333 13.333 0 2.347.613 4.64 1.787 6.667l-1.893 6.92 7.093-1.853c1.96 1.067 4.16 1.627 6.36 1.627 7.36 0 13.333-5.973 13.333-13.333S23.36 2.667 16 2.667zm0 24.4c-2.013 0-4-.547-5.733-1.573l-.413-.24-4.213 1.107 1.12-4.107-.267-.427a10.978 10.978 0 01-1.68-5.827c0-6.107 4.973-11.067 11.067-11.067 6.107 0 11.067 4.96 11.067 11.067 0 6.093-4.96 11.067-11.067 11.067z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2z" stroke-linejoin="round"/></svg>'
  };

  /* ════════════════════════════════════════════════════════════════
     STATO + PERSISTENZA
     ════════════════════════════════════════════════════════════════ */
  var SS_KEY = 'vl_concierge';        // sessionStorage: selezione + step + view
  var TOAST_KEY = 'vl_concierge_toast'; // sessionStorage: invito già mostrato
  var LANG_KEY = 'vl_lang';           // localStorage: preferenza lingua

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeGet(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function safeSet(store, key, val) { try { store.setItem(key, val); } catch (e) {} }

  var state = {
    lang: 'it',
    step: 0,
    view: 'closed', // 'closed' | 'open' | 'min'  (persistito tra le pagine)
    intents: [],   // chiavi intenzione selezionate
    items: [],     // { key, meta:{date,people,value} }
    note: ''
  };

  function loadState() {
    var savedLang = safeGet(window.localStorage, LANG_KEY);
    if (savedLang === 'it' || savedLang === 'en') state.lang = savedLang;
    var raw = safeGet(window.sessionStorage, SS_KEY);
    if (raw) {
      try {
        var d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (d.lang === 'it' || d.lang === 'en') state.lang = d.lang;
          if (typeof d.step === 'number') state.step = Math.max(0, Math.min(4, d.step));
          if (d.view === 'open' || d.view === 'min' || d.view === 'closed') state.view = d.view;
          if (Array.isArray(d.intents)) state.intents = d.intents.filter(function (k) { return CONFIG.intents.some(function (i) { return i.key === k; }); });
          if (Array.isArray(d.items)) state.items = d.items.filter(function (it) { return it && CONFIG.catalog[it.key]; }).map(function (it) { return { key: it.key, meta: it.meta || {} }; });
          if (typeof d.note === 'string') state.note = d.note;
        }
      } catch (e) {}
    }
    pruneItems(); // auto-guarigione di uno stato salvato incoerente
  }
  function saveState() {
    safeSet(window.sessionStorage, SS_KEY, JSON.stringify({ lang: state.lang, step: state.step, view: state.view, intents: state.intents, items: state.items, note: state.note }));
    safeSet(window.localStorage, LANG_KEY, state.lang);
  }

  function t(key) { return CONFIG.ui[state.lang][key]; }
  function L(obj) { return obj ? (obj[state.lang] || obj.it) : ''; }

  /* ─── Helpers selezione ───────────────────────────────────────── */
  function findItem(key) { for (var i = 0; i < state.items.length; i++) if (state.items[i].key === key) return state.items[i]; return null; }
  function isAdded(key) { return !!findItem(key); }
  function addItem(key, meta) {
    var it = findItem(key);
    if (it) { it.meta = meta || it.meta || {}; }
    else state.items.push({ key: key, meta: meta || {} });
    saveState(); syncBadge();
  }
  function removeItem(key) {
    state.items = state.items.filter(function (it) { return it.key !== key; });
    saveState(); syncBadge();
  }
  // Una voce è "raggiungibile" solo se la sua intenzione è ancora attiva.
  // L'aperitivo è ora un SOTTO-elemento della Domenica (gated da 'domenica').
  // I pacchetti sono condivisi tra domenica/wellness: restano finché almeno
  // una delle due è selezionata. Evita che voci scartate (deselezione di
  // un'intenzione allo Step 1) finiscano comunque nella richiesta.
  function isKeyAllowed(key) {
    var c = CONFIG.catalog[key]; if (!c) return false;
    var has = function (k) { return state.intents.indexOf(k) !== -1; };
    switch (c.kind) {
      case 'domenica': return has('domenica');
      case 'aperitivo': return has('domenica');
      case 'wellness': return has('wellness');
      case 'package': return has('domenica') || has('wellness');
      case 'gift': return has('gift');
      case 'interest': return has('evento'); // solo i_eventi / i_matrimonio
    }
    return false;
  }
  function pruneItems() {
    var before = state.items.length;
    state.items = state.items.filter(function (it) { return isKeyAllowed(it.key); });
    if (state.items.length !== before) { saveState(); syncBadge(); }
  }

  /* ════════════════════════════════════════════════════════════════
     COSTRUZIONE MESSAGGIO (deterministica)
     ════════════════════════════════════════════════════════════════ */
  function priceText(key, meta) {
    var c = CONFIG.catalog[key];
    if (c.kind === 'gift' && c.freeValue) { return meta && meta.value ? '€ ' + meta.value : '€ …'; }
    if (c.price != null) return '€ ' + c.price;
    return L(CONFIG.priceNote[c.noteKey || 'sumisura']);
  }
  function peopleText(n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return '';
    if (state.lang === 'it') return n === 1 ? '1 persona' : n + ' persone';
    return n === 1 ? '1 guest' : n + ' guests';
  }
  function niceDate(val) {
    if (!val) return '';
    try {
      var d = new Date(val + 'T00:00:00');
      if (isNaN(d.getTime())) return val;
      return new Intl.DateTimeFormat(state.lang === 'it' ? 'it-IT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    } catch (e) { return val; }
  }
  function domenicaMeta(meta) {
    var bits = [];
    var p = peopleText(meta && meta.people);
    if (p) bits.push(p);
    var dt = niceDate(meta && meta.date);
    if (dt) bits.push(dt);
    return bits.join(', ');
  }

  // riga puntata per la selezione multipla
  function itemBullet(it) {
    var c = CONFIG.catalog[it.key], lang = state.lang;
    var price = priceText(it.key, it.meta);
    switch (c.kind) {
      case 'domenica':
        var m = domenicaMeta(it.meta);
        return L(c.label) + ' (' + price + ')' + (m ? ' · ' + m : '');
      case 'aperitivo':
        return lang === 'it'
          ? 'Aperitivo in piscina: tenetemi un posto (formula da confermare)'
          : 'Aperitif by the pool: please hold a spot (format to be confirmed)';
      case 'wellness':
        return L(c.label) + ' (' + price + ')';
      case 'package':
        return (lang === 'it' ? 'Pacchetto ' : 'Package ') + L(c.label) + ' (' + price + ')';
      case 'gift':
        return (lang === 'it' ? 'Gift card «' : 'Gift card “') + L(c.label) + (lang === 'it' ? '»' : '”') + ' (' + price + ')';
      case 'interest':
        return L(c.bullet || c.label);
    }
    return L(c.label);
  }

  // frase per la selezione singola (lead-in + descrittore)
  function itemSentence(it) {
    var c = CONFIG.catalog[it.key], lang = state.lang;
    var lead = L(CONFIG.lead[c.kind]);
    var price = priceText(it.key, it.meta);
    switch (c.kind) {
      case 'domenica':
        var datePart = niceDate(it.meta && it.meta.date);
        var ppl = peopleText(it.meta && it.meta.people);
        var s = lead + ' ' + L(c.name) + ' (' + price + ')';
        if (datePart) s += (lang === 'it' ? ' per ' : ' on ') + datePart;
        if (ppl) s += (lang === 'it' ? ', in ' : ', for ') + ppl;
        return s + '.';
      case 'aperitivo':
        return lead + ' ' + L(c.name) + ' (' + L(CONFIG.priceNote.placeholder) + ').';
      case 'wellness':
        return lead + ' ' + L(c.label) + ' (' + price + ').';
      case 'package':
        return lead + ' ' + L(c.label) + ' (' + price + ').';
      case 'gift':
        return lead + ' ' + (lang === 'it' ? 'la gift card «' : 'the “') + L(c.label) + (lang === 'it' ? '»' : '”') + ' (' + price + ')' + (lang === 'it' ? '' : ' gift card') + '.';
      case 'interest':
        return lead + ' ' + L(c.name || c.label) + '.';
    }
    return lead + ' ' + L(c.label) + '.';
  }

  function buildMessage() {
    var m = CONFIG.msg[state.lang];
    var head = m.from + CONFIG.site + '.';
    if (state.items.length === 0) {
      return head + '\n' + m.empty + '\n' + m.thanks;
    }
    if (state.items.length === 1) {
      return head + '\n' + itemSentence(state.items[0]) + '\n' + m.thanks;
    }
    var lines = state.items.map(function (it) { return '- ' + itemBullet(it); });
    var body = head + '\n' + m.arrange + '\n' + lines.join('\n');
    if (state.note && state.note.trim()) body += '\n' + m.note + state.note.trim();
    return body + '\n' + m.thanks;
  }

  function waLink() { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(buildMessage()); }
  function mailLink() {
    var subj = state.lang === 'it' ? 'Richiesta · Villa Luzi' : 'Request · Villa Luzi';
    return 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(buildMessage());
  }

  /* ════════════════════════════════════════════════════════════════
     DOM helper
     ════════════════════════════════════════════════════════════════ */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v == null) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'class') n.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /* ════════════════════════════════════════════════════════════════
     RIFERIMENTI + CHROME del pannello
     ════════════════════════════════════════════════════════════════ */
  var launcher, panel, backdrop, badgeEl, toastEl;
  var elBody, elFoot, elProgress, elName, elKicker, langBtns = {}, closeBtn, minBtn, handleBtn;
  var lastFocus = null;
  var toastTimer = null;

  function syncBadge() {
    if (!badgeEl) return;
    var n = state.items.length;
    badgeEl.textContent = n ? String(n) : '';
    badgeEl.classList.toggle('is-on', n > 0);
  }

  function buildChrome() {
    panel.textContent = '';
    // header
    elKicker = el('div', { class: 'vlc-kicker', text: t('kicker') });
    elName = el('div', { class: 'vlc-head-name', text: t('dialogName') });
    var titles = el('div', { class: 'vlc-head-titles' }, [elKicker, elName]);

    var langWrap = el('div', { class: 'vlc-lang', role: 'group', 'aria-label': 'Lingua / Language' });
    ['it', 'en'].forEach(function (lng) {
      var b = el('button', {
        class: 'vlc-lang-btn', type: 'button', text: lng.toUpperCase(),
        'aria-pressed': state.lang === lng ? 'true' : 'false',
        onclick: function () { setLang(lng); }
      });
      langBtns[lng] = b; langWrap.appendChild(b);
    });

    minBtn = el('button', { class: 'vlc-head-btn vlc-min', type: 'button', 'aria-label': t('minimize'), title: t('minimize'), html: ICON.minimize, onclick: minimize });
    closeBtn = el('button', { class: 'vlc-head-btn vlc-close', type: 'button', 'aria-label': t('close'), html: ICON.close, onclick: close });

    var head = el('div', { class: 'vlc-head' }, [titles, langWrap, minBtn, closeBtn]);

    // handle mobile: tap per collassare → barra; tap di nuovo per riaprire
    handleBtn = el('button', { class: 'vlc-handle', type: 'button', 'aria-label': t('minimize'), onclick: toggleMin });

    elProgress = el('div', { class: 'vlc-progress', 'aria-hidden': 'true' });
    for (var i = 0; i < 5; i++) elProgress.appendChild(el('span'));

    elBody = el('div', { class: 'vlc-body', tabindex: '-1' });
    elFoot = el('div', { class: 'vlc-foot' });

    panel.appendChild(handleBtn);
    panel.appendChild(head);
    panel.appendChild(elProgress);
    panel.appendChild(elBody);
    panel.appendChild(elFoot);
  }

  function syncProgress() {
    var dots = elProgress.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].className = i < state.step ? 'is-done' : (i === state.step ? 'is-now' : '');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RENDER per step
     ════════════════════════════════════════════════════════════════ */
  function stepHeading(eyebrowKey, titleKey, ledeKey) {
    var frag = document.createDocumentFragment();
    if (eyebrowKey) frag.appendChild(el('div', { class: 'vlc-eyebrow', text: t(eyebrowKey) }));
    var h = el('h2', { class: 'vlc-title', text: t(titleKey), tabindex: '-1', id: 'vlc-step-title' });
    frag.appendChild(h);
    if (ledeKey) frag.appendChild(el('p', { class: 'vlc-lede', text: t(ledeKey) }));
    return frag;
  }

  function render() {
    elBody.scrollTop = 0;
    elBody.textContent = '';
    elFoot.textContent = '';
    syncProgress();
    if (state.step === 0) renderStep0();
    else if (state.step === 1) renderStep1();
    else if (state.step === 2) renderStep2();
    else if (state.step === 3) renderStep3();
    else renderStep4();
    // focus al titolo dello step (sobrio, non sposta lo scroll della pagina)
    var title = elBody.querySelector('#vlc-step-title') || elBody;
    try { title.focus({ preventScroll: true }); } catch (e) { try { title.focus(); } catch (e2) {} }
  }

  // STEP 0 — Benvenuto
  function renderStep0() {
    elBody.appendChild(el('div', { class: 'vlc-eyebrow', text: t('kicker') }));
    elBody.appendChild(el('h2', { class: 'vlc-title', text: t('s0title'), tabindex: '-1', id: 'vlc-step-title' }));
    elBody.appendChild(el('p', { class: 'vlc-lede', text: t('s0lede') }));
    elFoot.appendChild(primaryBtn(t('start'), function () { go(1); }));
  }

  // STEP 1 — Intenzione (multi-select)
  function renderStep1() {
    elBody.appendChild(stepHeading('s1eyebrow', 's1title', 's1lede'));
    var list = el('div', { class: 'vlc-choices' });
    CONFIG.intents.forEach(function (intent) {
      var on = state.intents.indexOf(intent.key) !== -1;
      var btn = el('button', {
        class: 'vlc-choice', type: 'button', 'aria-pressed': on ? 'true' : 'false',
        onclick: function () { toggleIntent(intent.key, btn); }
      }, [
        el('span', { class: 'vlc-choice-mark', html: ICON.check }),
        el('span', { class: 'vlc-choice-label' }, [
          document.createTextNode(L(intent.label)),
          el('span', { class: 'vlc-choice-sub', text: L(intent.sub) })
        ])
      ]);
      list.appendChild(btn);
    });
    elBody.appendChild(list);
    var next = primaryBtn(t('toDetails'), function () { go(2); }, ICON.arrowR);
    next.disabled = state.intents.length === 0;
    elFoot.appendChild(backBtn(function () { go(0); }));
    elFoot.appendChild(next);
  }

  function toggleIntent(key, btn) {
    var i = state.intents.indexOf(key);
    if (i === -1) state.intents.push(key); else state.intents.splice(i, 1);
    btn.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
    saveState();
    if (i !== -1) pruneItems(); // deselezione: togli le voci ormai irraggiungibili
    var next = elFoot.querySelector('.vlc-next');
    if (next) next.disabled = state.intents.length === 0;
  }

  // STEP 2 — Dettagli per ramo
  function renderStep2() {
    elBody.appendChild(stepHeading('s2eyebrow', 's2title', 's2lede'));
    var has = function (k) { return state.intents.indexOf(k) !== -1; };
    if (has('domenica')) elBody.appendChild(sectionDomenica());
    if (has('wellness')) elBody.appendChild(sectionWellness());
    if (has('domenica') || has('wellness')) elBody.appendChild(sectionPackages());
    if (has('evento')) elBody.appendChild(sectionStay());
    if (has('gift')) elBody.appendChild(sectionGift());
    if (has('esplorare') || state.intents.length === 0) elBody.appendChild(sectionExplore());
    elFoot.appendChild(backBtn(function () { go(1); }));
    elFoot.appendChild(primaryBtn(t('toSummary'), function () { go(3); }, ICON.arrowR));
  }

  function sectionWrap(titleKey, descText, extraClass) {
    var sec = el('section', { class: 'vlc-section' + (extraClass ? ' ' + extraClass : '') });
    sec.appendChild(el('h3', { class: 'vlc-section-head', text: t(titleKey) }));
    if (descText) sec.appendChild(el('p', { class: 'vlc-section-desc', text: descText }));
    return sec;
  }

  // bottone Aggiungi/Tienimi un posto con toggle
  function addButton(key, opts) {
    opts = opts || {};
    var added = isAdded(key);
    var addLabel = opts.hold ? t('hold') : t('add');
    var onLabel = opts.hold ? t('held') : t('added');
    var btn = el('button', {
      class: 'vlc-add' + (added ? ' is-added' : ''), type: 'button',
      'aria-pressed': added ? 'true' : 'false',
      html: (added ? ICON.check : ICON.plus) + '<span>' + (added ? onLabel : addLabel) + '</span>'
    });
    btn.addEventListener('click', function () {
      if (isAdded(key)) { removeItem(key); }
      else { addItem(key, opts.getMeta ? opts.getMeta() : {}); }
      var nowAdded = isAdded(key);
      btn.classList.toggle('is-added', nowAdded);
      btn.setAttribute('aria-pressed', nowAdded ? 'true' : 'false');
      btn.innerHTML = (nowAdded ? ICON.check : ICON.plus) + '<span>' + (nowAdded ? onLabel : addLabel) + '</span>';
    });
    return btn;
  }

  function priceTag(key, meta) {
    var c = CONFIG.catalog[key];
    if (c.price != null) {
      var span = el('span', { class: 'vlc-price' }, [document.createTextNode('€ ' + c.price)]);
      if (c.oldPrice) { span.appendChild(document.createTextNode(' ')); span.appendChild(el('span', { class: 'vlc-price-soft', text: '(' + t('instead') + ' € ' + c.oldPrice + ')' })); }
      return span;
    }
    return el('span', { class: 'vlc-price vlc-price-soft', text: priceText(key, meta) });
  }

  function cardRow(key, addOpts) {
    var c = CONFIG.catalog[key];
    var body = el('div', { class: 'vlc-card-body' }, [
      el('div', { class: 'vlc-card-title', text: L(c.label) }),
      c.sub ? el('div', { class: 'vlc-card-meta', text: L(c.sub) }) : null
    ]);
    return el('div', { class: 'vlc-card' }, [body, priceTag(key), addButton(key, addOpts)]);
  }

  function sectionDomenica() {
    var c = CONFIG.catalog.domenica;
    var sec = sectionWrap('secDomenica', L(c.desc));
    // campi data + persone
    var existing = findItem('domenica');
    var dateInput = el('input', { type: 'date', value: existing && existing.meta ? (existing.meta.date || '') : '', min: todayStr() });
    var peopleInput = el('input', { type: 'number', min: '1', max: '40', inputmode: 'numeric', value: existing && existing.meta ? (existing.meta.people || '') : '', placeholder: '2' });
    var getMeta = function () { return { date: dateInput.value, people: peopleInput.value }; };
    var sync = function () { if (isAdded('domenica')) addItem('domenica', getMeta()); };
    dateInput.addEventListener('change', sync); peopleInput.addEventListener('change', sync);
    var fields = el('div', { class: 'vlc-fields' }, [
      el('div', { class: 'vlc-field' }, [el('label', { text: t('fieldDate') }), dateInput]),
      el('div', { class: 'vlc-field' }, [el('label', { text: t('fieldPeople') }), peopleInput])
    ]);
    sec.appendChild(fields);
    sec.appendChild(el('div', { class: 'vlc-card' }, [
      el('div', { class: 'vlc-card-body' }, [el('div', { class: 'vlc-card-title', text: L(c.label) })]),
      priceTag('domenica'),
      addButton('domenica', { getMeta: getMeta })
    ]));
    // L'Aperitivo in piscina è ora un SOTTO-elemento della Domenica:
    // placeholder "Tienimi un posto", nessun prezzo.
    var a = CONFIG.catalog.aperitivo;
    sec.appendChild(el('div', { class: 'vlc-card' }, [
      el('div', { class: 'vlc-card-body' }, [
        el('div', { class: 'vlc-card-title', text: L(a.label) }),
        el('div', { class: 'vlc-card-meta', text: L(a.desc) })
      ]),
      addButton('aperitivo', { hold: true })
    ]));
    return sec;
  }

  function sectionWellness() {
    var sec = sectionWrap('secWellness', null);
    ['w_corpo', 'w_viso', 'w_sibilla', 'w_makeup', 'w_makeup_sposa', 'w_mani', 'w_mani_shellac', 'w_pedi', 'w_pedi_shellac'].forEach(function (k) {
      sec.appendChild(cardRow(k));
    });
    return sec;
  }

  function sectionPackages() {
    var sec = sectionWrap('secPackages', null);
    ['p_domenica_benessere', 'p_aperitivo_cena', 'p_giornata_lenta'].forEach(function (k) {
      var c = CONFIG.catalog[k];
      var body = el('div', { class: 'vlc-card-body' }, [
        el('div', { class: 'vlc-card-title', text: L(c.label) }),
        c.desc ? el('div', { class: 'vlc-card-meta', text: L(c.desc) }) : null
      ]);
      sec.appendChild(el('div', { class: 'vlc-card' }, [body, priceTag(k), addButton(k)]));
    });
    return sec;
  }

  // Eventi e matrimoni NON finiscono nel messaggio WhatsApp: portano al FORM
  // della pagina giusta (deep-link alla sezione #richiesta). Minimizziamo così
  // la pagina d'arrivo è subito usabile; lo stato resta in sessionStorage.
  function sectionStay() {
    var sec = sectionWrap('secStay', state.lang === 'it'
      ? 'Per eventi e matrimoni raccogliamo i dettagli con un modulo: vi portiamo alla pagina giusta.'
      : 'For events and weddings we collect the details with a form: we’ll take you to the right page.');
    var dests = [
      { href: '/matrimoni/#richiesta', t: { it: 'Matrimonio', en: 'Wedding' }, s: { it: 'La dimora tutta per voi', en: 'The residence, all yours' } },
      { href: '/eventi/eventi-privati/#richiesta', t: { it: 'Evento privato', en: 'Private event' }, s: { it: 'Feste e ricorrenze', en: 'Parties & celebrations' } },
      { href: '/eventi/#richiesta', t: { it: 'Evento aziendale', en: 'Corporate event' }, s: { it: 'Giornate d’impresa', en: 'Company days' } }
    ];
    var grid = el('div', { class: 'vlc-worlds' });
    dests.forEach(function (d) {
      grid.appendChild(el('a', { class: 'vlc-world', href: d.href, 'data-cta': 'concierge-event-form', onclick: function () { minimize(); } }, [
        document.createTextNode(L(d.t)),
        el('span', { text: L(d.s) })
      ]));
    });
    sec.appendChild(grid);
    return sec;
  }

  function sectionGift() {
    var sec = sectionWrap('secGift', null, 'vlc-section--gift');
    ['g_domenica_due', 'g_ora_benessere', 'g_aperitivo_due'].forEach(function (k) { sec.appendChild(cardRow(k)); });
    // valore libero con select
    var c = CONFIG.catalog.g_libero;
    var existing = findItem('g_libero');
    var select = el('select', {});
    c.freeValue.forEach(function (v) {
      select.appendChild(el('option', { value: String(v), text: '€ ' + v, selected: existing && existing.meta && String(existing.meta.value) === String(v) ? 'selected' : null }));
    });
    var getMeta = function () { return { value: select.value }; };
    select.addEventListener('change', function () { if (isAdded('g_libero')) addItem('g_libero', getMeta()); });
    var body = el('div', { class: 'vlc-card-body' }, [
      el('div', { class: 'vlc-card-title', text: L(c.label) }),
      el('div', { class: 'vlc-fields', style: 'margin:8px 0 0' }, [el('div', { class: 'vlc-field' }, [el('label', { text: t('fieldValue') }), select])])
    ]);
    sec.appendChild(el('div', { class: 'vlc-card' }, [body, addButton('g_libero', { getMeta: getMeta })]));
    return sec;
  }

  function sectionExplore() {
    var sec = sectionWrap('secExplore', null);
    var grid = el('div', { class: 'vlc-worlds' });
    CONFIG.worlds.forEach(function (w) {
      grid.appendChild(el('a', { class: 'vlc-world', href: w.href, 'data-cta': 'concierge-world', onclick: function () { minimize(); } }, [
        document.createTextNode(L(w.t)),
        el('span', { text: L(w.s) })
      ]));
    });
    sec.appendChild(grid);
    return sec;
  }

  // STEP 3 — Riepilogo selezione
  function renderStep3() {
    elBody.appendChild(stepHeading('s3eyebrow', 's3title', state.items.length ? 's3lede' : null));
    if (state.items.length === 0) {
      elBody.appendChild(el('p', { class: 'vlc-empty', text: t('empty') }));
    } else {
      var list = el('div', { class: 'vlc-summary' });
      state.items.forEach(function (it) {
        var c = CONFIG.catalog[it.key];
        var metaStr = '';
        if (c.kind === 'domenica') metaStr = domenicaMeta(it.meta);
        else if (c.kind === 'aperitivo') metaStr = L(CONFIG.priceNote.placeholder);
        var body = el('div', { class: 'vlc-line-body' }, [
          el('div', { class: 'vlc-line-title', text: L(c.label) }),
          metaStr ? el('div', { class: 'vlc-line-meta', text: metaStr }) : null
        ]);
        // prezzo solo quando ha senso: numero, gift a valore libero, o nota
        // "su misura" per pacchetti/gift. Interest e aperitivo: nessun prezzo.
        var price = null;
        if (c.price != null || (c.kind === 'gift' && c.freeValue)) {
          price = el('span', { class: 'vlc-line-price', text: priceText(it.key, it.meta) });
        } else if (c.kind === 'package' || c.kind === 'gift') {
          price = el('span', { class: 'vlc-line-price vlc-price-soft', text: priceText(it.key, it.meta) });
        }
        var rm = el('button', { class: 'vlc-remove', type: 'button', 'aria-label': t('remove') + ' · ' + L(c.label), html: ICON.close });
        rm.addEventListener('click', function () { removeItem(it.key); render(); });
        list.appendChild(el('div', { class: 'vlc-line' }, [body, price, rm]));
      });
      elBody.appendChild(list);
    }
    // nota libera
    var note = el('div', { class: 'vlc-note' });
    note.appendChild(el('label', { text: t('noteLabel'), 'for': 'vlc-note-input' }));
    var ta = el('textarea', { id: 'vlc-note-input', placeholder: t('notePlaceholder') });
    ta.value = state.note || '';
    ta.addEventListener('input', function () { state.note = ta.value; saveState(); });
    note.appendChild(ta);
    elBody.appendChild(note);

    elFoot.appendChild(backBtn(function () { go(2); }));
    elFoot.appendChild(primaryBtn(t('toMessage'), function () { go(4); }, ICON.arrowR));
  }

  // STEP 4 — Handoff WhatsApp
  function renderStep4() {
    elBody.appendChild(stepHeading('s4eyebrow', 's4title', 's4lede'));
    elBody.appendChild(el('div', { class: 'vlc-eyebrow', text: t('msgLabel'), style: 'margin-top:18px' }));
    elBody.appendChild(el('div', { class: 'vlc-handoff-msg', text: buildMessage() }));

    var row = el('div', { class: 'vlc-secondary-row' });
    var copyBtn = el('button', { class: 'vlc-secondary', type: 'button', html: ICON.copy + '<span>' + t('copy') + '</span>' });
    copyBtn.addEventListener('click', function () { copyMessage(copyBtn); });
    var emailBtn = el('a', { class: 'vlc-secondary', href: mailLink(), html: ICON.mail + '<span>' + t('emailBtn') + '</span>', 'data-cta': 'concierge-email' });
    var phoneBtn = el('a', { class: 'vlc-secondary', href: 'tel:' + CONFIG.tel, html: ICON.phone + '<span>' + t('phoneBtn') + '</span>', 'data-cta': 'concierge-phone' });
    row.appendChild(copyBtn); row.appendChild(emailBtn); row.appendChild(phoneBtn);
    elBody.appendChild(row);
    elBody.appendChild(el('p', { class: 'vlc-warm', text: t('warm') }));

    elFoot.appendChild(backBtn(function () { go(3); }));
    var wa = el('a', {
      class: 'vlc-next is-whatsapp', href: waLink(), target: '_blank', rel: 'noopener',
      'data-cta': 'concierge-whatsapp', html: ICON.wa + '<span>' + t('whatsapp') + '</span>'
    });
    elFoot.appendChild(wa);
  }

  function copyMessage(btn) {
    var msg = buildMessage();
    var done = function () {
      var span = btn.querySelector('span'); if (span) span.textContent = t('copied');
      setTimeout(function () { var s = btn.querySelector('span'); if (s) s.textContent = t('copy'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(done, function () { legacyCopy(msg, done); });
    } else legacyCopy(msg, done);
  }
  function legacyCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); done();
    } catch (e) {}
  }

  /* ─── Bottoni footer ──────────────────────────────────────────── */
  function primaryBtn(label, onClick, iconHtml) {
    return el('button', { class: 'vlc-next', type: 'button', html: '<span>' + label + '</span>' + (iconHtml || ''), onclick: onClick });
  }
  function backBtn(onClick) {
    return el('button', { class: 'vlc-back', type: 'button', html: ICON.arrowL + '<span>' + t('back') + '</span>', onclick: onClick });
  }

  function go(step) { state.step = step; saveState(); render(); }

  /* ════════════════════════════════════════════════════════════════
     LINGUA
     ════════════════════════════════════════════════════════════════ */
  function setLang(lng) {
    if (lng !== 'it' && lng !== 'en') return;
    state.lang = lng; saveState();
    if (panel) panel.setAttribute('lang', state.lang);
    if (langBtns.it) langBtns.it.setAttribute('aria-pressed', lng === 'it' ? 'true' : 'false');
    if (langBtns.en) langBtns.en.setAttribute('aria-pressed', lng === 'en' ? 'true' : 'false');
    if (elKicker) elKicker.textContent = t('kicker');
    if (elName) elName.textContent = t('dialogName');
    if (closeBtn) closeBtn.setAttribute('aria-label', t('close'));
    if (minBtn) { minBtn.setAttribute('aria-label', t('minimize')); minBtn.setAttribute('title', t('minimize')); }
    if (handleBtn) handleBtn.setAttribute('aria-label', state.view === 'min' ? t('expand') : t('minimize'));
    if (launcher) updateLauncherText();
    render();
  }

  function updateLauncherText() {
    var lab = launcher.querySelector('.vlc-launcher-label');
    var sub = launcher.querySelector('.vlc-launcher-sub');
    if (lab) lab.textContent = t('launcherLabel');
    if (sub) sub.textContent = t('launcherSub');
    launcher.setAttribute('aria-label', t('launcherLabel') + ' · ' + t('dialogName'));
  }

  /* ════════════════════════════════════════════════════════════════
     APERTURA / CHIUSURA / MINIMIZZA — DOCK NON-MODALE
     Il pannello è un dock: la pagina dietro resta scrollabile e
     cliccabile. Niente backdrop dimmerante, niente scroll-lock,
     niente focus-trap, niente aria-modal. Usa role="complementary".
     ════════════════════════════════════════════════════════════════ */
  var built = false;     // chrome costruito una sola volta per pagina
  var keydownBound = false;

  // true se siamo sotto il breakpoint del bottom sheet collassabile
  function isMobile() {
    return !!(window.matchMedia && window.matchMedia('(max-width: 720px)').matches);
  }

  // applica lo stato visuale corrente (open/min/closed) alle classi/ARIA
  function applyView() {
    if (!panel) return;
    var open = state.view === 'open';
    var min = state.view === 'min';
    panel.classList.toggle('is-open', open || min); // mobile: 'min' resta visibile come barra
    panel.classList.toggle('is-min', min);
    // Il pannello ha contenuto interattivo visibile quando è aperto, oppure
    // quando è minimizzato su mobile (resta la barra con header + handle).
    var interactiveVisible = open || (min && isMobile());
    panel.setAttribute('aria-hidden', interactiveVisible ? 'false' : 'true');
    // launcher: visibile quando chiuso o minimizzato; arretra quando aperto.
    if (launcher) {
      launcher.classList.toggle('is-hidden', open);
      launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (handleBtn) handleBtn.setAttribute('aria-label', min ? t('expand') : t('minimize'));
  }

  function bindKeys() {
    if (keydownBound) return;
    document.addEventListener('keydown', onKeydown, true);
    keydownBound = true;
  }
  function unbindKeys() {
    if (!keydownBound) return;
    document.removeEventListener('keydown', onKeydown, true);
    keydownBound = false;
  }

  // Apre il dock (non-modale). Se intentKey è valido, preseleziona quel
  // mondo e porta allo Step 2; open()/open(null) apre allo Step 0.
  function open(intentKey) {
    dismissToast(true); // l'invito non serve più una volta dentro
    if (typeof intentKey === 'string' && CONFIG.intents.some(function (i) { return i.key === intentKey; })) {
      if (state.intents.indexOf(intentKey) === -1) state.intents.push(intentKey);
      state.step = 2;
    }
    lastFocus = document.activeElement;
    if (!built) { buildChrome(); built = true; }
    panel.setAttribute('lang', state.lang); // pronuncia SR corretta per la lingua attiva
    state.view = 'open';
    saveState();
    applyView();
    render(); // imposta anche il focus al titolo dello step (preventScroll)
    bindKeys();
  }

  // Minimizza: nasconde il pannello (desktop) / collassa a barra (mobile),
  // lasciando il launcher. Lo stato è persistito e si riapre dopo MPA.
  function minimize() {
    state.view = 'min';
    saveState();
    applyView();
    unbindKeys();
    if (launcher && launcher.focus) { try { launcher.focus({ preventScroll: true }); } catch (e) { try { launcher.focus(); } catch (e2) {} } }
  }

  function close() {
    state.view = 'closed';
    saveState();
    applyView();
    unbindKeys();
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    else if (launcher && launcher.focus) { try { launcher.focus({ preventScroll: true }); } catch (e) {} }
  }

  // handle mobile: collassa↔riapri
  function toggleMin() {
    if (state.view === 'min') { open(); }
    else { minimize(); }
  }

  // Esc = minimizza/chiudi. Nessun focus-trap: la pagina dietro resta
  // navigabile da tastiera (dock non-modale).
  function onKeydown(e) {
    if (e.key === 'Escape' && state.view === 'open') {
      // se l'ospite ha già una selezione, "Esc" minimizza (non perde nulla);
      // altrimenti chiude. In entrambi i casi non blocca la pagina.
      e.preventDefault();
      if (state.items.length) minimize(); else close();
    }
  }

  /* ════════════════════════════════════════════════════════════════
     TOAST D'INGRESSO — una volta per sessione
     Desktop: invito centrato e prominente. Mobile: sobrio in basso.
     Testo a rotazione, dismissibile; il clic apre il concierge sul tema.
     ════════════════════════════════════════════════════════════════ */
  function pickToast() {
    var arr = CONFIG.toasts;
    // rotazione "stabile" nell'arco della sessione: dipende dal giorno+ora
    var idx = (new Date().getHours() + new Date().getDate()) % arr.length;
    return arr[idx];
  }

  function openToast() {
    if (!toastEl) return;
    if (reduceMotion) return;                 // niente comparse animate
    if (state.view !== 'closed') return;      // se già dentro, niente invito
    if (safeGet(window.sessionStorage, TOAST_KEY)) return; // una volta per sessione
    safeSet(window.sessionStorage, TOAST_KEY, '1');

    var pick = pickToast();
    toastEl.textContent = '';
    var card = el('div', { class: 'vlc-toast-inner' }, [
      el('div', { class: 'vlc-toast-kicker', text: t('kicker') }),
      el('div', { class: 'vlc-toast-text', text: L(pick.text) }),
      el('div', { class: 'vlc-toast-actions' }, [
        el('button', { class: 'vlc-toast-open', type: 'button', html: '<span>' + t('openDetail') + '</span>' + ICON.arrowR, onclick: function () { open(pick.intent || null); } }),
        el('button', { class: 'vlc-toast-dismiss', type: 'button', text: t('toastDismiss'), onclick: function () { dismissToast(); } })
      ])
    ]);
    toastEl.appendChild(card);
    // ~2s dopo il load
    toastTimer = window.setTimeout(function () { toastEl.classList.add('is-on'); }, 2000);
  }

  function dismissToast(immediate) {
    if (toastTimer) { window.clearTimeout(toastTimer); toastTimer = null; }
    if (toastEl) {
      toastEl.classList.remove('is-on');
      if (immediate) toastEl.hidden = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
     ════════════════════════════════════════════════════════════════ */
  function init() {
    launcher = document.getElementById('vlc-launcher');
    panel = document.getElementById('vlc-panel');
    backdrop = document.getElementById('vlc-backdrop'); // facoltativo (neutralizzato)
    if (!launcher || !panel) return; // pagina senza wiring: niente concierge

    // Toast d'ingresso: l'elemento non è nel markup statico → lo creiamo qui
    // (solo con JS attivo, quindi nessun rischio per il no-JS).
    toastEl = document.getElementById('vlc-toast');
    if (!toastEl) {
      toastEl = el('div', { class: 'vlc-toast', id: 'vlc-toast', role: 'status', 'aria-live': 'polite', hidden: 'hidden' });
      document.body.appendChild(toastEl);
    }

    document.documentElement.classList.add('vlc-ready'); // assorbe la sticky-cta esistente
    loadState();

    // DOCK NON-MODALE: garantisci la semantica corretta a prescindere dal
    // markup statico. role="complementary" + aria-label, MAI aria-modal.
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', t('kicker') + ' · ' + t('dialogName'));
    panel.removeAttribute('aria-modal');
    // il launcher non apre più un "dialog" modale ma mostra una region
    // complementare: allinea l'ARIA (aria-expanded basta, niente haspopup).
    launcher.removeAttribute('aria-haspopup');

    // mostra gli elementi (erano [hidden] per il no-JS) e gestiscili via classi
    launcher.hidden = false; panel.hidden = false;
    if (backdrop) backdrop.hidden = false;
    if (toastEl) toastEl.hidden = false;

    badgeEl = launcher.querySelector('.vlc-badge');
    updateLauncherText();
    syncBadge();

    launcher.addEventListener('click', function () { open(); });

    // RIAPERTURA NELLO STESSO STATO (MPA): se l'ospite aveva il dock aperto
    // o minimizzato su un'altra pagina, lo ripristiniamo al load. Solo lo
    // stato 'closed' lascia il launcher da solo.
    if (state.view === 'open') {
      if (!built) { buildChrome(); built = true; }
      panel.setAttribute('lang', state.lang);
      applyView();
      render();      // riapre allo step salvato; focus leggero al titolo
      bindKeys();
    } else if (state.view === 'min') {
      if (!built) { buildChrome(); built = true; }
      panel.setAttribute('lang', state.lang);
      applyView();   // mobile: barra collassata; desktop: solo launcher
    } else {
      applyView();   // closed: solo launcher
      // L'invito è ora il launcher stesso (frase-CTA centrata in basso):
      // niente toast centrato che coprirebbe hero/globo della home.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ════════════════════════════════════════════════════════════════
     API PUBBLICA — contratto con l'orb / altri trigger
     ════════════════════════════════════════════════════════════════ */
  window.VLConcierge = {
    open: function (intentKey) { open(typeof intentKey === 'string' ? intentKey : null); },
    openToast: function () { openToast(); },
    minimize: function () { minimize(); },
    close: function () { close(); }
  };

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
})();
