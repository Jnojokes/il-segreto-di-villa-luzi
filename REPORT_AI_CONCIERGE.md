# REPORT — AI Concierge + Transizione "boule de neige"

Villa Luzi 1737 · feature aggiunta su sito statico MPA (zero dipendenze).
`node build.js` completa (233 file, 29 con include header/footer). Nessuna
regressione: i partial, i nodi JSON-LD, gli script inline e gli slug restano
intatti; tutto è progressive enhancement (a JS spento il sito è invariato).

---

## File toccati

**Nuovi**
- `assets/css/concierge.css` — launcher + pannello (side sheet desktop /
  bottom sheet mobile). Autosufficiente: ridefinisce i token di brand come
  `--vlc-*` (valori letterali), perché le pagine standalone non linkano
  `site.css`. Niente font nuovi (usa lo stack già caricato con fallback).
- `assets/js/concierge.js` — `CONFIG` (unica fonte di verità) + flusso a 5
  step + costruzione messaggio WhatsApp + stato/persistenza + a11y.
- `assets/js/transition.js` — transizione "boule de neige" (canvas particelle
  + velo), intercettazione link interni, entrata/uscita, bfcache, fallback.

**Modificati**
- `partials/footer.html` — wiring globale: `<link>` concierge.css + markup
  launcher/pannello/backdrop (con `[hidden]`) + i due `<script defer>`.
- `il-segreto/index.html` e
  `esperienze/aperitivi-in-erba/2-giugno-2026/index.html` — stesso wiring,
  **manuale** prima di `</body>` (pagine standalone). Aggiunto soltanto: non
  riscritto nulla degli script/stili/JSON-LD/sticky inline esistenti.
- `build.js` — aggiunti `PROMPT_AI_CONCIERGE.md` e `REPORT_AI_CONCIERGE.md`
  alla `SKIP_ROOT` (come gli altri documenti di lavoro), così i documenti
  interni **non** finiscono in `dist/`. *(È un'aggiunta alla lista dati, non
  un cambio di logica/marker.)*

---

## Come aggiorna i contenuti il cliente — `CONFIG` in `concierge.js`

Tutto è in cima a `concierge.js`, nell'oggetto `CONFIG`. Niente logica da toccare.

- **Prezzi / voci**: `CONFIG.catalog`. Ogni voce ha `price` (numero in €) oppure
  `price: null` + `noteKey` (`'sumisura'` | `'preventivo'` | `'placeholder'`).
  Esempi pronti: Domenica 55, wellness 40–95, pacchetto Domenica+Benessere 130
  (`oldPrice: 140`), gift 85/110/su misura/valore libero 50‑100‑150.
- **Testi UI bilingue**: `CONFIG.ui.it` / `CONFIG.ui.en` (titoli step, CTA,
  etichette). Il launcher si chiama "Concierge" (rinominabile da
  `ui.*.launcherLabel`); per tono non compare "AI"/"chatbot".
- **Messaggio WhatsApp**: frammenti in `CONFIG.msg` (saluto, "Vorrei
  organizzare:", "Note:", "Grazie.") e lead‑in per tipologia in `CONFIG.lead`.
  Numero/recapiti in `CONFIG.whatsapp` (`393452419263`), `CONFIG.email`,
  `CONFIG.tel`, `CONFIG.site` (`villaluzi.it`).
- **Intenzioni Step 1**: `CONFIG.intents`. **Mappa mondi (Esplora)**:
  `CONFIG.worlds` (link reali, tutti verificati).

Regola del messaggio: **1 voce** → frase singola con lead‑in
(es. *"Vorrei prenotare la Domenica al Segreto (€ 55) per il …, in …"*);
**più voci** → introduzione + elenco puntato + nota + "Grazie." L'aperitivo
resta un **placeholder** (nessun prezzo finto): "tenetemi un posto / formula da
confermare". Tutto via `encodeURIComponent`.

---

## Come tarare la transizione — parametri in cima a `transition.js`

- `PALETTE` — RGB particelle (oro `201,168,106`, corallo `234,114,117`, avorio
  `244,236,220`, come `wow-dust`).
- `DUR_EXIT` 620 ms · `DUR_ENTER` 600 ms · `DUR_FADE` 280 ms (fallback sobrio).
  Uscita+entrata percepite ≤ ~1.2 s.
- `PARTICLE_CAP` 150 · `DENS_DIV` 7000 (densità ≈ area/7000, DPR cap 2).
- `VEIL` — gradiente del velo (ottanio → verde‑notte).
- `SAFETY_MS` 1000 — se la navigazione non parte, si forza `location.href`.

Cosa **non** intercetta (comportamento nativo): `target=_blank`, `download`,
`rel*=external`, `mailto:`/`tel:`/`sms:`/`wa.me`/altri schemi, ancore `#`,
click con tasto modificatore o non‑sinistro, link alla stessa pagina, e l'opt‑out
`data-no-transition`. Sulla **home** l'entrata è saltata (la copre il
`.home-loader`); su `prefers-reduced-motion`/`Save-Data` → dissolvenza sobria;
ritorno da bfcache → overlay sempre scoperto; pausa su `visibilitychange`.

---

## Un solo controllo fluttuante

Il concierge, quando il JS lo monta, aggiunge `html.vlc-ready` e
`concierge.css` nasconde **ogni** `.sticky-cta` (la globale del footer + le due
inline standalone). A JS spento la classe non c'è e la sticky‑cta resta come
fallback verso la prenotazione. Il launcher (z‑index 130) → pannello (945) →
transizione (950), tutti sotto il grain globale (999).

---

## Verifica eseguita

- `node build.js` OK, `dist/` rigenerato; nuovi asset presenti; `partials/`
  non pubblicata; nessun marker `@include` irrisolto (i match residui sono i
  commenti decorativi `━━` di header/footer, non marker reali).
- Launcher unico su pagina normale, pagine con partial e **entrambe** le
  standalone; dialog con `role/aria-modal/aria-controls/lang`.
- Messaggio WhatsApp corretto IT/EN, selezione singola/multipla e caso
  placeholder; selezione persistente tra pagine (`sessionStorage vl_concierge`,
  badge sul launcher); lingua in `localStorage vl_lang`.
- **Review avversariale** (più revisori + verifica indipendente): 1 finding
  media + 6 low, **tutte corrette**:
  - *(media)* deselezionando un'intenzione le voci di quel ramo venivano
    comunque incluse nel messaggio → ora `pruneItems()` le rimuove (e
    auto‑guarisce uno stato salvato incoerente al load).
  - *(low)* loop RAF concorrenti in modalità sobria → `animToken` + `running`
    li rendono interrompibili; uscita interrotta da `visibilitychange` →
    schermo tenuto coperto fino al safety timeout; `reduced-motion`/`Save-Data`
    riletti live; `lang` sul dialog; background reso `inert` a dialog aperto;
    chiusura del pannello al click sui deep link.

---

## Decisioni prese su ambiguità (tono = sobrio, coerente col brand)

1. **"scrivo da villaluzi.it"** nel messaggio: usato il dominio letterale del
   brief (in `CONFIG.site`). Se si preferisce il canonico, cambiare in
   `villaluzi1737.it`.
2. **Pacchetti** (upselling): mostrati allo Step 2 quando è attiva almeno una
   tra Domenica / Aperitivo / Wellness (i tre mondi che li compongono).
3. **Pagina aperitivi**: lasciato il suo `padding-bottom:88px` inline (riservato
   alla vecchia sticky‑bar, ora nascosta) → piccolo spazio vuoto in fondo su
   mobile, innocuo; non ho riscritto il CSS inline della pagina standalone.
4. **Documenti interni** (`PROMPT_AI_CONCIERGE.md`, questo report) esclusi da
   `dist/` per non pubblicarli, come gli altri documenti di lavoro.

> Nota di processo: non sono riuscito ad aprire un browser in questo ambiente,
> quindi il punto 8 della checklist ("nessun errore in console") è coperto da
> `node --check` su entrambi i file e dall'assenza di riferimenti a variabili
> rimosse, ma andrebbe confermato con una prova manuale su desktop e mobile.
