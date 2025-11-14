# GitHub Actions CI/CD

## 📊 Übersicht

Dieses Projekt verwendet GitHub Actions für automatische Tests und Validierung. Bei jedem Push werden folgende Checks durchgeführt:

### Workflows

#### 1. **Test Suite** (`test.yml`)
Läuft automatisch bei jedem Push und Pull Request.

**Jobs:**
- ✅ **Backend Function Tests** - Testet Cloud Functions
- ✅ **Firestore Rules Tests** - Testet Security Rules
- ✅ **Frontend Tests** - Testet JavaScript im Browser
- ✅ **Code Quality** - Syntax & Security Audit
- ✅ **Test Summary** - Zusammenfassung aller Ergebnisse

#### 2. **Pre-Deployment Validation** (`pre-deploy.yml`)
Manuell ausführbar vor Deployments.

**Checks:**
- ✅ Firebase-Konfiguration validieren
- ✅ Syntax-Checks
- ✅ Security Audit
- ✅ Function Tests

## 🚀 Verwendung

### Automatische Tests
Tests laufen automatisch bei jedem Push:
```bash
git add .
git commit -m "deine Nachricht"
git push
```

Gehe zu GitHub → Actions Tab, um Ergebnisse zu sehen.

### Manuelle Pre-Deployment Validation
1. Gehe zu GitHub → Actions
2. Wähle "Pre-Deployment Validation"
3. Klicke "Run workflow"
4. Wähle Environment (production/staging)
5. Klicke "Run workflow"

## ❌ Fehler beheben

### Problem: "Test Suite" schlägt fehl

#### 1. **Backend Function Tests failed**
```bash
# Lokal testen
cd functions
npm test

# Fehler beheben und erneut pushen
git add .
git commit -m "fix: backend tests"
git push
```

#### 2. **Firestore Rules Tests failed**
```bash
# Emulator starten
firebase emulators:start --only firestore

# In neuem Terminal: Tests ausführen
npm run test:rules

# Fehler beheben und pushen
```

#### 3. **Frontend Tests failed**
```bash
# Lokal testen
npm run test:frontend

# Fehler beheben und pushen
```

#### 4. **Syntax Validation failed**
```bash
# Syntax prüfen
node --check functions/index.js

# Fehler beheben und pushen
```

### Problem: "Dependencies installation failed"

**Lösung:**
```bash
# package-lock.json aktualisieren
cd functions
npm install
cd ..

# Commiten und pushen
git add functions/package-lock.json
git commit -m "fix: update package-lock"
git push
```

### Problem: "Emulator timeout"

Das ist normal in CI - der Firestore Rules Test Job wartet bis zu 60 Sekunden auf den Emulator.

**Wenn es trotzdem fehlschlägt:**
- Überprüfe `firestore.rules.test.js` auf Syntax-Fehler
- Stelle sicher, dass `jest.config.rules.js` existiert
- Prüfe, ob Port 8080 in den Tests korrekt konfiguriert ist

## 📋 Best Practices

### Vor dem Push
```bash
# Alle Tests lokal ausführen
npm run test:all

# Syntax validieren
npm run validate
```

### Pull Requests
Alle Tests müssen grün sein, bevor ein PR gemerged werden kann.

### Deployments
1. Führe "Pre-Deployment Validation" aus
2. Warte auf grünen Status
3. Deploye mit `firebase deploy`

## 🔧 Workflow-Konfiguration

### Test Timeouts anpassen
Bearbeite `.github/workflows/test.yml`:
```yaml
- name: Start Firestore Emulator
  run: |
    # Timeout von 60 auf 90 Sekunden erhöhen
    for i in {1..90}; do
      # ...
    done
```

### Tests überspringen
Nur für Notfälle! Füge zum Commit-Message hinzu:
```bash
git commit -m "fix: urgent hotfix [skip ci]"
```

## 📊 Status Badges

Füge zu deinem README.md hinzu:
```markdown
![Tests](https://github.com/eddywayz/Hochzeit_Eduard_Joanne/workflows/Test%20Suite/badge.svg)
```

## 🐛 Debugging

### Detaillierte Logs anzeigen
1. Gehe zu GitHub → Actions
2. Klicke auf den fehlgeschlagenen Workflow
3. Klicke auf den fehlgeschlagenen Job
4. Expandiere jeden Schritt für Details

### Re-run Failed Jobs
1. Gehe zum fehlgeschlagenen Workflow
2. Klicke "Re-run failed jobs"
3. Warte auf Ergebnisse

## 💡 Tipps

1. **Schneller Feedback** - Nutze `npm run test:functions -- --watch` lokal
2. **Coverage prüfen** - Führe Tests mit `--coverage` aus
3. **Pull Requests** - Erstelle Feature-Branches für größere Änderungen
4. **Status prüfen** - Schaue regelmäßig in GitHub Actions nach

## 📞 Support

Bei Problemen:
1. Prüfe diese Dokumentation
2. Schaue in GitHub Actions Logs
3. Führe Tests lokal aus
4. Öffne ein Issue
