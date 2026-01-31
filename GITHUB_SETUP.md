# 📦 Guida Creazione Repository GitHub

Guida completa per creare e pubblicare il progetto FringoTracker su GitHub.

---

## 🎯 Step-by-Step Guide

### 1️⃣ Crea Repository su GitHub

#### Opzione A: Via Web Interface

1. Vai su https://github.com
2. Clicca sul **+** in alto a destra > **New repository**
3. Compila il form:
   - **Repository name**: `FringoTracker`
   - **Description**: `Personal Wealth Management & Analytics Dashboard`
   - **Visibility**:
     - ✅ **Private** (se vuoi tenerlo privato)
     - ⬜ Public (se vuoi condividerlo)
   - ⬜ **NON** selezionare "Add a README" (ce l'hai già)
   - ⬜ **NON** selezionare .gitignore (ce l'hai già)
   - ⬜ **NON** selezionare License
4. Clicca **Create repository**

#### Opzione B: Via GitHub CLI (se installato)

```powershell
# Installa GitHub CLI (se non ce l'hai)
winget install --id GitHub.cli

# Login
gh auth login

# Crea repo privata
gh repo create FringoTracker --private --source=. --remote=origin

# Oppure pubblica
gh repo create FringoTracker --public --source=. --remote=origin
```

---

### 2️⃣ Inizializza Git Localmente

```powershell
# Vai nella directory del progetto
cd C:\Users\elect\Documents\Progetti\FringoTracker

# Inizializza Git
git init

# Verifica che .gitignore sia configurato correttamente
cat .gitignore

# Aggiungi tutti i file
git add .

# Fai il primo commit
git commit -m "feat: initial commit - FringoTracker v1.0"
```

---

### 3️⃣ Connetti al Repository Remoto

Dopo aver creato la repo su GitHub, copia l'URL che ti viene mostrato.

```powershell
# Aggiungi remote (sostituisci YOUR_USERNAME con il tuo username GitHub)
git remote add origin https://github.com/YOUR_USERNAME/FringoTracker.git

# Oppure via SSH (se hai configurato chiavi SSH)
git remote add origin git@github.com:YOUR_USERNAME/FringoTracker.git

# Verifica che il remote sia stato aggiunto
git remote -v
```

---

### 4️⃣ Configura Branch e Push

```powershell
# Rinomina branch principale in 'main' (se necessario)
git branch -M main

# Push del primo commit
git push -u origin main
```

Se ricevi errore di autenticazione, usa un **Personal Access Token**:

---

### 5️⃣ Configura Personal Access Token (PAT)

GitHub ha deprecato l'autenticazione con password per Git. Devi usare un token.

#### Crea Token su GitHub

1. Vai su https://github.com/settings/tokens
2. Clicca **Generate new token** > **Generate new token (classic)**
3. Dai un nome: `FringoTracker Local Dev`
4. Seleziona scopes:
   - ✅ `repo` (accesso completo ai repository privati)
   - ✅ `workflow` (per GitHub Actions)
5. Clicca **Generate token**
6. **COPIA IL TOKEN** (non potrai più vederlo!)

#### Usa Token per Push

```powershell
# Al primo push, ti chiederà username e password
# Username: il tuo username GitHub
# Password: INCOLLA IL TOKEN (non la tua password!)

git push -u origin main
```

#### Salva Token con Git Credential Manager (opzionale)

```powershell
# Git salverà automaticamente le credenziali per i prossimi push
# Su Windows, usa Credential Manager integrato
git config --global credential.helper wincred
```

---

### 6️⃣ Verifica su GitHub

Vai su `https://github.com/YOUR_USERNAME/FringoTracker` e verifica che:

- ✅ Tutti i file siano presenti
- ✅ README.md sia visualizzato correttamente
- ✅ `.github/workflows/` contenga i file di GitHub Actions

---

## 🔄 Workflow Quotidiano

### Dopo il Setup Iniziale

```powershell
# 1. Fai modifiche ai file
# 2. Controlla cosa è cambiato
git status

# 3. Aggiungi file modificati
git add .

# 4. Commit con messaggio descrittivo
git commit -m "feat: aggiunge export PDF per analytics"

# 5. Push su GitHub
git push origin main
```

---

## 🌿 Lavorare con Branch

### Crea Feature Branch

```powershell
# Crea e switcha su nuovo branch
git checkout -b feature/export-pdf

# Fai modifiche...
git add .
git commit -m "feat: implementa export PDF"

# Push del branch su GitHub
git push origin feature/export-pdf
```

### Merge su Main

```powershell
# Torna su main
git checkout main

# Merge del branch feature
git merge feature/export-pdf

# Push su GitHub
git push origin main

# Elimina branch locale (opzionale)
git branch -d feature/export-pdf

# Elimina branch remoto (opzionale)
git push origin --delete feature/export-pdf
```

---

## 🔒 File Sensibili

### ⚠️ MAI committare:

- ❌ `.env` files con credenziali reali
- ❌ Firebase service account JSON
- ❌ JWT secrets
- ❌ `node_modules/`
- ❌ Build artifacts (`dist/`, `build/`)

### ✅ Il `.gitignore` è già configurato per escluderli!

### Verifica prima di push:

```powershell
# Controlla cosa stai per committare
git status

# Vedi il diff completo
git diff

# Vedi il diff staged
git diff --staged
```

---

## 🔧 Comandi Git Utili

### Vedere la Storia

```powershell
# Log completo
git log

# Log compatto
git log --oneline

# Log grafico
git log --oneline --graph --all
```

### Annullare Modifiche

```powershell
# Annulla modifiche non staged
git checkout -- filename.ts

# Rimuovi file da staging area
git reset HEAD filename.ts

# Annulla ultimo commit (mantiene modifiche)
git reset --soft HEAD~1

# Annulla ultimo commit (ELIMINA modifiche)
git reset --hard HEAD~1
```

### Sincronizza con Remote

```powershell
# Scarica modifiche da GitHub
git pull origin main

# Fetch senza merge
git fetch origin

# Vedi differenze con remote
git diff main origin/main
```

---

## 🚨 Troubleshooting

### Errore: "remote origin already exists"

```powershell
# Rimuovi remote esistente
git remote remove origin

# Aggiungi quello corretto
git remote add origin https://github.com/YOUR_USERNAME/FringoTracker.git
```

### Errore: "failed to push some refs"

```powershell
# Qualcuno ha pushato prima di te, sincronizza
git pull origin main --rebase
git push origin main
```

### Committato file sensibile per errore

```powershell
# Rimuovi file da Git (mantieni locale)
git rm --cached backend/.env

# Aggiungi a .gitignore
echo "backend/.env" >> .gitignore

# Commit
git add .gitignore
git commit -m "fix: rimuove .env dal tracking"
git push origin main
```

### Cambiare messaggio ultimo commit

```powershell
# Solo se NON hai ancora fatto push
git commit --amend -m "feat: nuovo messaggio corretto"

# Se hai già fatto push (evita se possibile!)
git commit --amend -m "feat: nuovo messaggio"
git push origin main --force
```

---

## 📊 GitHub Actions Setup

Dopo il push, verifica che le Actions siano attive:

1. Vai su `https://github.com/YOUR_USERNAME/FringoTracker/actions`
2. Dovresti vedere le workflow:
   - ✅ `Deploy to Firebase Hosting`
   - ✅ `Notify Backend Deploy`

Se sono disabilitate:

- Clicca **Enable workflows**

---

## ✅ Checklist Finale

Prima di considerare il setup completo:

- [ ] Repository creata su GitHub
- [ ] Git inizializzato localmente (`git init`)
- [ ] Remote configurato (`git remote -v`)
- [ ] `.gitignore` configurato correttamente
- [ ] README.md aggiornato
- [ ] Primo commit e push completato
- [ ] GitHub Actions visibili nella tab Actions
- [ ] Personal Access Token salvato
- [ ] File sensibili NON committati (verifica con `git log --all --full-history -- backend/.env`)

---

## 🎉 Completato!

Ora hai:

- ✅ Repository GitHub configurata
- ✅ Git workflow pronto
- ✅ CI/CD automatico (dopo aver configurato secrets)
- ✅ Backup cloud del codice

**Prossimo passo**: Configura GitHub Secrets per deployment automatico (vedi [DEPLOYMENT.md](DEPLOYMENT.md))

---

## 📚 Risorse

- **Git Basics**: https://git-scm.com/book/en/v2
- **GitHub Docs**: https://docs.github.com
- **GitHub CLI**: https://cli.github.com
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf
