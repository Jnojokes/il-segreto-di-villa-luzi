# White Party — note di integrazione

Riguarda le due landing: `19-giugno.html` (evento / prenotazione, campagna 30-65)
e `white-party-lista.html` (la lista / Gossip Girl, campagna 18-30).

## 1. Endpoint lead (`LEAD_ENDPOINT`)

In cima allo `<script>` di entrambe le pagine c'è:

```js
var LEAD_ENDPOINT = '';
```

Finché resta vuoto il form funziona comunque: mostra la conferma e indirizza a
WhatsApp (canale garantito). Per salvare i lead, due strade:

### Opzione A — Google Apps Script (consigliata: gratis, lead su Google Sheet)

1. Creare un Google Sheet con intestazioni:
   `inviato | evento | tipo | pagina | nome | telefono | email | persone | note | consenso | utm`
2. Estensioni → Apps Script, incollare:

   ```js
   function doPost(e) {
     var d = JSON.parse(e.postData.contents);
     SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
       d.inviato, d.evento, d.tipo || 'prenotazione', d.pagina, d.nome,
       d.telefono, d.email || '', d.persone || '', d.note || '',
       d.consenso ? 'sì' : '', JSON.stringify(d.utm || {})
     ]);
     return ContentService.createTextOutput('ok');
   }
   ```

3. Distribuisci → Nuova distribuzione → App web → esecuzione come *me*,
   accesso a *chiunque*. Copiare l'URL `https://script.google.com/macros/s/…/exec`
   dentro `LEAD_ENDPOINT` di entrambe le pagine.

Le pagine inviano con `Content-Type: text/plain` e `mode: no-cors`,
già compatibile con Apps Script senza configurazioni CORS.

### Opzione B — Formspree

Creare un form su formspree.io e mettere l'URL `https://formspree.io/f/XXXX`
in `LEAD_ENDPOINT`. Nota: Formspree preferisce JSON con header
`Accept: application/json`; se si sceglie questa strada, nel blocco
`inviaLead()` sostituire l'header `text/plain` con:

```js
headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
```

e rimuovere `mode: 'no-cors'`.

## 2. SMS reali (fase 2 — non implementata)

La sequenza SMS di `white-party-lista.html` è simulata in pagina. Per inviare
un vero SMS di conferma al numero raccolto serve una piccola serverless
function (Cloudflare Workers, Vercel, Netlify Functions), perché le chiavi del
provider non possono stare nel front-end:

- **Skebby** (italiano): `POST https://api.skebby.it/API/v1.0/REST/sms` con
  token da login; mittente alfanumerico tipo "VillaLuzi".
- **Twilio**: `POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`
  con `From` un numero o alphanumeric sender ID.

Schema consigliato: il form invia il lead all'endpoint (punto 1); la stessa
function, dopo aver salvato, chiama il provider con un testo tipo
"Sei in lista per il White Party del 19 giugno. Ci vediamo in bianco." e poi
risponde 200. Nessuna modifica al front-end: basta puntare `LEAD_ENDPOINT`
alla function.

## 3. Varianti A/B delle headline

Entrambe le pagine leggono `?v=b` dalla query string:

- `19-giugno.html` — A: "Una sola sera, un solo colore. Cena d'autore, piano
  live e dj set nel giardino della villa." / B (`?v=b`): "La notte più chiara
  dell'estate. Il giardino di Villa Luzi si veste di bianco."
- `white-party-lista.html` — A: "Non tutti ricevono questo messaggio." /
  B (`?v=b`): "Qualcuno ha fatto il tuo nome."

Negli ads basta duplicare l'inserzione cambiando l'URL finale
(es. `…/white-party-lista.html?v=b&utm_campaign=…`). Il parametro convive con
gli UTM, che vengono propagati nel link WhatsApp e nel payload del lead.

## 4. Stati pagina e test

- `?stato=dopo` simula la pagina a evento concluso (CTA verso Instagram,
  form nascosto / lista chiusa). `?stato=pre` forza lo stato normale.
- Su `white-party-lista.html` lo stato "sei in lista" vive in `localStorage`
  (chiave `wlz-whiteparty-lista`): "Rivedi i messaggi" lo azzera.

## 5. Cose che restano da fare

- Configurare `LEAD_ENDPOINT` (punto 1) su entrambe le pagine.
- Pagina privacy/cookie del sito: il consenso sulla landing lista rimanda a
  un'informativa breve inline; quando esisterà una pagina privacy, linkarla.
- Annunciare le portate del menù (sezione "La cena" di `19-giugno.html`,
  nota "Le portate della serata saranno annunciate nei prossimi giorni").
- Eventuale fase 2 SMS (punto 2).
