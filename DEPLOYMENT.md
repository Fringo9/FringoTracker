# 🚀 Guida al Deployment Automatico

## 📦 Architettura

- **Frontend**: Firebase Hosting (deploy automatico via GitHub Actions)
- **Backend**: Render.com (auto-deploy da GitHub)
- **Database**: Firebase Firestore

---

## 🔥 1. Setup Firebase Hosting

### 1.1 Installa Firebase CLI

```powershell
npm install -g firebase-tools
firebase login
```

### 1.2 Inizializza Firebase (se non già fatto)

```powershell
firebase init hosting
# Seleziona: frontend/dist come public directory
# Configura come single-page app: Yes
# Non sovrascrivere index.html: No
```

### 1.3 Ottieni Service Account Key

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto **fringotracker**
3. Settings > Service Accounts
4. Click "Generate New Private Key"
5. Salva il file JSON

### 1.4 Configura GitHub Secrets

Vai su GitHub repository > Settings > Secrets and variables > Actions > New repository secret:

```
Nome: FIREBASE_SERVICE_ACCOUNT_JSON
Valore: [Incolla TUTTO il contenuto del file JSON]

Nome: VITE_API_URL
Valore: https://fringotracker-backend.onrender.com
```

### 1.5 Test Manuale (opzionale)

```powershell
cd frontend
npm run build
firebase deploy --only hosting
```

---

## ⚙️ 2. Setup Render.com Backend

### 2.1 Crea Account Render

1. Vai su [render.com](https://render.com) e registrati
2. Connetti il tuo account GitHub

### 2.2 Crea Web Service

1. Dashboard > New > Web Service
2. Connetti repository GitHub: **FringoTracker**
3. Configurazione:
   - **Name**: fringotracker-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

### 2.3 Configura Environment Variables

In Render dashboard, aggiungi queste variabili:

```
NODE_ENV = production
PORT = 5000
FRONTEND_URL = https://fringotracker.web.app
JWT_SECRET = [genera una stringa random sicura, es: usa openssl rand -hex 32]
FIREBASE_SERVICE_ACCOUNT = [Incolla il JSON del service account]
```

**⚠️ IMPORTANTE**: Per `FIREBASE_SERVICE_ACCOUNT`, incolla il JSON su una sola riga:

```json
{
  "type": "service_account",
  "project_id": "fringotracker",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 2.4 Abilita Auto-Deploy

- In Render dashboard, vai su Settings
- Nella sezione "Build & Deploy", verifica che "Auto-Deploy" sia **Yes**
- Branch da monitorare: **main** (o **master**)

---

## 🔄 3. Workflow Automatico

### Cosa succede quando fai push:

#### 📤 **Push su `frontend/`** directory:

1. GitHub Actions rileva cambiamenti in `frontend/**`
2. Esegue `npm ci` e `npm run build`
3. Deploy automatico su Firebase Hosting
4. ✅ Disponibile su: `https://fringotracker.web.app`

#### 📤 **Push su `backend/`** directory:

1. Render rileva commit su branch main
2. Esegue automaticamente build e deploy
3. ✅ Disponibile su: `https://fringotracker-backend.onrender.com`

#### 📤 **Push generico (no frontend/backend)**:

- Nessun deploy automatico

---

## 🧪 4. Test del Setup

### 4.1 Test Frontend Deploy

```powershell
# Fai una modifica al frontend
echo "/* test deploy */" >> frontend/src/App.tsx
git add frontend/src/App.tsx
git commit -m "test: frontend auto-deploy"
git push origin main
```

Vai su GitHub > Actions e verifica che il workflow `Deploy to Firebase Hosting` sia partito.

### 4.2 Test Backend Deploy

```powershell
# Fai una modifica al backend
echo "// test deploy" >> backend/src/index.ts
git add backend/src/index.ts
git commit -m "test: backend auto-deploy"
git push origin main
```

Vai su Render Dashboard > Logs e verifica che il build sia partito automaticamente.

---

## 🔍 5. Verifica Configurazione

### Frontend (.env.production)

Crea file `frontend/.env.production`:

```env
VITE_API_URL=https://fringotracker-backend.onrender.com
```

### Backend (render.yaml)

Il file `render.yaml` è già configurato. Render lo userà automaticamente.

---

## 📝 6. Checklist Pre-Deploy

- [ ] Firebase CLI installato e autenticato
- [ ] Firebase Service Account JSON ottenuto
- [ ] GitHub Secrets configurati (FIREBASE_SERVICE_ACCOUNT_JSON, VITE_API_URL)
- [ ] Render account creato e GitHub connesso
- [ ] Web Service su Render configurato con environment variables
- [ ] Auto-deploy abilitato su Render
- [ ] File `.env.production` creato in frontend/
- [ ] JWT_SECRET generato e configurato su Render
- [ ] FRONTEND_URL aggiornato su Render dopo primo deploy Firebase

---

## 🔄 7. Update Workflow

### Sviluppo Locale

```powershell
# Lavora normalmente
git checkout -b feature/nuova-funzionalita
# ... fai modifiche ...
git add .
git commit -m "feat: nuova funzionalità"
```

### Deploy in Produzione

```powershell
# Merge su main
git checkout main
git merge feature/nuova-funzionalita
git push origin main
# 🎉 Deploy automatico partirà subito!
```

---

## 🚨 8. Troubleshooting

### Frontend non si deploya

- Verifica GitHub Actions logs: `Actions` tab su GitHub
- Controlla che il secret `FIREBASE_SERVICE_ACCOUNT_JSON` sia valido
- Verifica che `frontend/dist` esista dopo il build

### Backend non si deploya

- Verifica Render logs: Dashboard > Logs
- Controlla che `backend/dist` venga creato con `npm run build`
- Verifica che le environment variables siano configurate correttamente

### CORS Errors

- Assicurati che `FRONTEND_URL` su Render corrisponda al dominio Firebase
- Verifica che il backend abbia configurato CORS per il frontend URL

### Database Errors

- Controlla che Firestore Rules permettano accesso autenticato
- Verifica che `FIREBASE_SERVICE_ACCOUNT` sia valido JSON

---

## 🎯 9. Ottimizzazioni

### Cache delle Dependencies

GitHub Actions usa già cache per `node_modules` (vedi `cache: 'npm'`)

### Build Incrementali

Render usa build cache automaticamente per velocizzare i deploy

### Branch Preview (opzionale)

Puoi configurare preview deployments su Render per branch di feature:

- Dashboard > Settings > Preview Environments > Enable

---

## 📞 10. Supporto

- **Firebase Docs**: https://firebase.google.com/docs/hosting
- **Render Docs**: https://render.com/docs
- **GitHub Actions**: https://docs.github.com/actions

---

✅ **Setup Completato!** Ora ogni push su main triggererà automaticamente il deploy.
