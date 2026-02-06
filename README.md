# 💰 FringoTracker

**Personal Wealth Management & Analytics Dashboard**

Applicazione full-stack per tracciare l'evoluzione del patrimonio personale nel tempo, con analytics avanzate, gestione categorie, milestones, proiezioni finanziarie, dark mode e crittografia client-side.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-22-green)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![MUI](https://img.shields.io/badge/MUI-5-purple)
![Vitest](https://img.shields.io/badge/Tests-50%20passing-brightgreen)

---

## 🚀 Funzionalità

### 📊 Dashboard

- **Patrimonio totale** con variazione assoluta e percentuale
- **Risparmio medio mensile** calcolato automaticamente
- **Variazione ultimo mese** con indicatore colore (verde/rosso)
- **CAGR totale** e **CAGR ultimo anno** (tasso di crescita annuo composto)
- **Volatilità annualizzata** dei rendimenti mensili
- **Max Drawdown** — perdita massima dal picco al minimo storico
- **Runway** — mesi di autonomia finanziaria
- **Rapporto Debito/Patrimonio** con soglia 30%
- Tooltip informativi in italiano su ogni metrica

### 📈 Analytics

- **Timeline patrimonio** — LineChart interattivo con filtri temporali (6M / 12M / 24M / All)
- **Export CSV e SVG** del grafico timeline
- **Milestone sul grafico** — linee di riferimento tratteggiate per eventi importanti
- **Pie Chart categorie** — distribuzione percentuale per categoria, cliccabile
- **Storico per categoria** — AreaChart dedicato visibile cliccando una fetta del pie chart
- **Proiezioni future (12 mesi)** — scenari Ottimistico, Realistico, Pessimistico
- **Heatmap variazioni mensili** — griglia anno × mese con colori verde/rosso e tooltip dettagliati
- **Confronto Year-over-Year** — patrimonio attuale vs 12 mesi fa
- **9 card metriche di crescita** con icone e descrizioni

### 📸 Snapshot Patrimonio

- Lista snapshot con ricerca, paginazione (9/pagina) e conteggio filtrato
- Creazione e modifica snapshot manuale con voci dinamiche
- Autocomplete voci con template preconfigurato
- Creazione nuova voce inline durante l'inserimento
- Cambio categoria inline con salvataggio debounced
- Calcolo totale in tempo reale
- Validazione righe incomplete
- Eliminazione con conferma modale

### 🏆 Milestone

- Tracciamento eventi finanziari importanti (cambio lavoro, acquisto, investimento, debito estinto, altro)
- Creazione/modifica via dialog modale
- Visualizzazione come ReferenceLine sulla timeline Analytics
- Ordinamento per data

### 📥 Import Excel

- Drag & Drop con supporto .xlsx / .xls
- Parsing automatico colonne (Data, Nome Voce, Valore)
- Mapping automatico voci Excel ↔ Item database (case-insensitive)
- Indicazione voci non mappate con chip arancione
- Modifica/eliminazione entry prima dell'import
- Import batch multiplo con redirect automatico

### ⚙️ Impostazioni

- **Gestione Voci** — CRUD completo con protezione cascade (non eliminabili se usate in snapshot)
- **Gestione Categorie** — aggiunta, eliminazione con protezione (non eliminabili se usate da voci), seeding automatico
- **Template Snapshot** — configurazione voci precaricate per ogni nuova snapshot, riordinamento e salvataggio esplicito

### 👤 Profilo

- Modifica nome utente e foto profilo (upload immagine, max 2MB, Base64)
- Anteprima avatar con fallback a iniziale
- Cambio password con validazione

### 🔐 Autenticazione & Sicurezza

- Login/Registrazione con form unificato
- JWT con scadenza 30 giorni
- Password hashing (bcrypt, 10 salt rounds)
- Reset password a 2 step (token con scadenza 1h)
- Crittografia client-side AES-256-GCM (chiave derivata da PBKDF2, 100k iterazioni)
- ReauthModal per ri-derivare la chiave dopo page reload
- Auto-logout su 401
- Validazione input Zod su tutti gli endpoint
- Ownership verification su ogni query Firestore
- Cascade protection su eliminazione Item e Categorie

### 🛡️ Sicurezza Backend

- **Helmet** — headers HTTP di sicurezza
- **CORS** — origini consentite configurabili
- **Rate Limiting** — 100 req/min globale, 10 req/min su auth (anti brute-force)
- **Error handler centralizzato** — stack trace solo in sviluppo

### ⚡ Performance

- **Analytics Cache** — cache in-memory per utente con TTL 5 minuti e invalidazione automatica
- **Batch Firestore queries** — 1 query anziché N×M, risoluzione in-memoria
- **Batch writes** — operazioni Firestore in batch (limite 499)
- **React Query** — caching client-side con staleTime configurato (60s–300s)

### 🌙 Dark Mode

- Toggle Light/Dark nella sidebar con persistenza su localStorage
- Tema MUI completo con palette, ombre e hover personalizzati per entrambe le modalità

### 🎨 UI/UX

- Material UI design system con Recharts
- Font Inter
- Sidebar collassabile (240px ↔ 60px) + drawer mobile responsive
- Navigazione gerarchica con sezioni espandibili
- Avatar utente nell'header con dropdown Logout
- Card design con gradient, bordi arrotondati (16px), ombre dinamiche
- Formattazione locale italiana (date, valute €, percentuali)
- ErrorBoundary per gestione errori runtime

---

## 🛠️ Tech Stack

### Frontend

- **React 18** + **TypeScript**
- **Material-UI (MUI 5)** per UI components
- **TanStack React Query 5** per state management e caching
- **Zustand 4** per stato globale (auth, theme) con persist middleware
- **Recharts** per data visualization (Line, Area, Pie charts)
- **Axios** per HTTP client con interceptor auth
- **Vite 5** come build tool

### Backend

- **Node.js 22** + **Express** + **TypeScript**
- **Firebase Admin SDK** (Firestore NoSQL database)
- **JWT** per autenticazione
- **Zod** per validazione input
- **bcrypt** per password hashing
- **Helmet** + **express-rate-limit** per sicurezza
- **Multer** per file upload
- **XLSX** per Excel parsing

### Testing

- **Vitest** — 50 test totali (47 backend + 3 frontend)
- Schema validation, analytics cache, ErrorBoundary

### Deployment

- **Firebase Hosting** (frontend)
- **Render.com** (backend)
- **GitHub Actions** per CI/CD automatico

---

## 📦 Installazione

### Prerequisiti

- Node.js 20+
- npm 9+
- Firebase account
- Git

### Clone e Setup

```powershell
# Clone repository
git clone https://github.com/YOUR_USERNAME/FringoTracker.git
cd FringoTracker

# Installa dependencies
npm install

# Configura environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Modifica backend/.env con le tue credenziali Firebase
# Modifica frontend/.env con URL backend
```

### Sviluppo Locale

```powershell
# Avvia frontend e backend contemporaneamente
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## 🚀 Deployment

Consulta [DEPLOYMENT.md](DEPLOYMENT.md) per la guida completa al deployment automatico su Firebase e Render.

### Quick Start

1. Configura GitHub Secrets per Firebase
2. Crea Web Service su Render.com
3. Push su branch `main` → deploy automatico!

---

## 📁 Struttura Progetto

```
FringoTracker/
├── frontend/                  # React app
│   ├── public/               # Favicon, assets statici
│   ├── src/
│   │   ├── pages/            # Dashboard, Analytics, Snapshots, ManualSnapshot,
│   │   │                       Milestones, Import, Settings, Profile, Login
│   │   ├── components/       # Layout, ErrorBoundary, ReauthModal
│   │   ├── hooks/            # useCategories
│   │   ├── stores/           # authStore, themeStore (Zustand)
│   │   ├── services/         # api (Axios), firebase
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # helpers (formatCurrency, etc.)
│   │   ├── test/             # setup test
│   │   ├── theme.ts          # MUI theme (light/dark)
│   │   ├── App.tsx           # Router
│   │   └── main.tsx          # Entry point
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/           # analytics, auth, categoryDefinitions, import,
│   │   │                       items, milestones, snapshots, snapshotTemplate
│   │   ├── middleware/       # auth (JWT), errorHandler
│   │   ├── services/         # firebase, analyticsCache
│   │   ├── validators/       # Zod schemas + middleware
│   │   └── index.ts          # Server entry
│   ├── vitest.config.ts
│   └── package.json
├── .github/workflows/        # GitHub Actions CI/CD
├── firebase.json             # Firebase Hosting config
├── firestore.rules           # Security rules
├── firestore.indexes.json    # Firestore indexes
├── render.yaml               # Render.com config
└── README.md
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

---

## 📊 Database Schema (Firestore)

### Collections

- **users** — Utenti registrati (email, password hash, displayName, photoURL)
- **snapshots** — Snapshot patrimonio (date, totalValue, frequency, userId)
- **snapshotEntries** — Dettaglio voci per snapshot (itemId, value, snapshotId)
- **items** — Voci patrimoniali (name, category, sortOrder, userId)
- **milestones** — Eventi finanziari (title, date, description, eventType, userId)
- **categoryDefinitions** — Categorie personalizzate (name, categoryType, sortOrder, userId)
- **snapshotTemplates** — Template voci preconfigurate per snapshot (items[], userId)
- **passwordResets** — Token temporanei per reset password (token, email, expiresAt)

---

## 🧪 Testing

```powershell
# Backend tests (47 test — Zod schemas + analytics cache)
cd backend
npm test

# Frontend tests (3 test — ErrorBoundary)
cd frontend
npm test
```

---

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/NuovaFeature`)
3. Commit modifiche (`git commit -m 'feat: aggiunge nuova feature'`)
4. Push al branch (`git push origin feature/NuovaFeature`)
5. Apri Pull Request

---

## 📝 License

Questo progetto è privato. Tutti i diritti riservati.

---

## 👤 Author

**Fringo9**

- GitHub: [@Fringo9](https://github.com/Fringo9)

---

## 🙏 Acknowledgments

- Material-UI per i componenti UI
- Recharts per le visualizzazioni
- Firebase per il backend NoSQL
- GitHub Copilot per il supporto allo sviluppo
