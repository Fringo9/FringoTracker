# 💰 FringoTracker

**Personal Wealth Management & Analytics Dashboard**

Applicazione full-stack per tracciare l'evoluzione del patrimonio personale nel tempo, con analytics avanzate, gestione categorie, milestones e proiezioni finanziarie.

![Tech Stack](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-22-green)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)

---

## 🚀 Features

### 📊 Dashboard

- **9 metriche chiave** con tooltip esplicativi
- Snapshot del patrimonio totale e variazioni
- CAGR (Compound Annual Growth Rate)
- Saving rate e risparmio mensile
- Volatilità annualizzata, Max Drawdown, Runway Real

### 📈 Analytics

- Timeline interattiva con grafici Recharts
- Filtri temporali (6M/12M/24M/All)
- Confronto Year-over-Year (YoY)
- Milestones markers sul grafico
- Export dati (CSV) e grafici (SVG)

### 💾 Snapshots

- Tracciamento patrimonio con date personalizzate
- Gestione categorie per snapshot (Investimenti, Liquidità, Debiti, ecc.)
- **Inline editing** su DataGrid per modifiche rapide
- Calcolo automatico del totale

### 🎯 Milestones

- Tracciamento eventi finanziari importanti
- Tipi: Lavoro, Investimento, Acquisto, Altro
- Visualizzazione markers su timeline Analytics

### 🏷️ Categorie

- Definizione categorie personalizzate (Assets/Liabilities)
- Riordinamento drag-and-drop
- Seed automatico con 21 categorie predefinite

### 📥 Import

- Caricamento massivo dati via Excel/CSV
- Template automatico basato su categorie utente
- Validazione e preview prima dell'import

### 🔐 Autenticazione

- Registrazione e login con JWT
- Cambio password da Settings
- Password reset via token email

---

## 🛠️ Tech Stack

### Frontend

- **React 18** + **TypeScript**
- **Material-UI (MUI)** per UI components
- **TanStack React Query** per state management e caching
- **Recharts** per data visualization
- **Vite** come build tool

### Backend

- **Node.js 22** + **Express**
- **TypeScript**
- **Firebase Admin SDK** (Firestore NoSQL database)
- **JWT** per autenticazione
- **Multer** per file upload
- **XLSX** per Excel parsing

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
├── frontend/              # React app
│   ├── src/
│   │   ├── pages/        # Dashboard, Analytics, Snapshots, etc.
│   │   ├── components/   # Layout, shared components
│   │   ├── types/        # TypeScript interfaces
│   │   └── App.tsx
│   └── package.json
├── backend/              # Express API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, error handling
│   │   └── index.ts
│   └── package.json
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── firebase.json         # Firebase Hosting config
├── render.yaml           # Render.com config
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

- **users**: Utenti registrati (email, password hash)
- **snapshots**: Snapshot patrimonio (date, totalValue, userId)
- **categories**: Dettaglio categorie per snapshot (name, value, snapshotId)
- **milestones**: Eventi finanziari (title, date, eventType, userId)
- **categoryDefinitions**: Definizioni categorie personalizzate (name, type, sortOrder, userId)
- **passwordResets**: Token temporanei per reset password (expiresAt)

---

## 🧪 Testing

```powershell
# Backend tests (se implementati)
cd backend
npm test

# Frontend tests (se implementati)
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

**Il tuo nome**

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

## 🙏 Acknowledgments

- Material-UI per i componenti UI
- Recharts per le visualizzazioni
- Firebase per il backend NoSQL
- GitHub Copilot per il supporto allo sviluppo
