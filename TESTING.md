# Testing Documentation - Hochzeitswebseite

## 📋 Übersicht

Diese Hochzeitswebseite verfügt über eine umfassende Test-Suite, die folgende Bereiche abdeckt:

1. **Backend Function Tests** - Unit-Tests für Firebase Cloud Functions
2. **Firestore Security Rules Tests** - Sicherheitstests für Datenbank-Regeln
3. **Frontend JavaScript Tests** - Unit-Tests für Browser-Code
4. **End-to-End (E2E) Tests** - Vollständige User-Flow-Tests mit Playwright
5. **CI/CD Pipeline** - Automatische Tests bei jedem Code-Change

## 🚀 Schnellstart

### Alle Tests ausführen

```bash
npm run test:all
```

### Einzelne Test-Suites ausführen

```bash
# Backend Function Tests
npm run test:functions

# Frontend Tests
npm run test:frontend

# Firestore Rules Tests
npm run test:rules

# E2E Tests
npm run test:e2e
```

## 🧪 Test-Bereiche im Detail

### 1. Backend Function Tests

**Speicherort:** `functions/test/`

**Was wird getestet:**
- ✅ `sendContactMail` - Kontaktformular Email-Versand
- ✅ `uploadGiftImage` - Geschenk-Bild-Upload
- ✅ `resolveProductImage` - Open Graph Image-Scraping
- ✅ `importImageToStorage` - Bild-Import von URLs
- ✅ Email Template-Rendering (Handlebars)
- ✅ Authentication & Session Management

**Test-Dateien:**
- `sendContactMail.test.js` - Kontaktformular-Funktionalität
- `emailTemplates.test.js` - Email-Template-Rendering
- `imageUpload.test.js` - Bild-Upload-Logik
- `authentication.test.js` - Auth & Sessions

**Ausführen:**
```bash
cd functions
npm test

# Mit Coverage Report
npm test -- --coverage

# Watch Mode (für Entwicklung)
npm test -- --watch
```

**Technologie:**
- Jest - Test-Runner
- Nock - HTTP Mocking
- Sinon - Function Mocking
- firebase-functions-test - Firebase Testing Utilities

### 2. Firestore Security Rules Tests

**Speicherort:** `firestore.rules.test.js`

**Was wird getestet:**
- ✅ RSVP CRUD-Operationen (Create, Read, Update, Delete)
- ✅ Email-Validierung in Security Rules
- ✅ Gästeanzahl-Validierung (1-10 Personen)
- ✅ Gift-Reservierung-Logik (unreserved → reserved)
- ✅ Admin-Berechtigungen
- ✅ Unbekannte Collections blockieren

**Ausführen:**
```bash
# Firestore Emulator starten (in separatem Terminal)
firebase emulators:start --only firestore

# Tests ausführen
npm run test:rules
```

**Technologie:**
- @firebase/rules-unit-testing
- Firebase Emulator Suite
- Jest

**Beispiel-Testfälle:**
- ✓ Jeder kann RSVP erstellen
- ✓ Nur Admin kann RSVP löschen
- ✓ Email-Format wird validiert
- ✓ Gästeanzahl muss zwischen 1-10 liegen
- ✓ Geschenk-Reservierung benötigt gültige Email

### 3. Frontend JavaScript Tests

**Speicherort:** `assets/js/__tests__/`

**Was wird getestet:**
- ✅ RSVP Form Handler (`rsvp-shared.js`)
  - `getCurrentGuestData()` - Gastdaten sammeln
  - `renderGuestFields()` - Gast-Felder rendern
  - `toggleFormFields()` - Felder aktivieren/deaktivieren

- ✅ Utility Functions (`utils.js`)
  - Email-Validierung
  - Form-Validierung
  - Storage URL-Normalisierung
  - HTML Escaping (XSS-Schutz)
  - Debounce/Throttle
  - Rate Limiting
  - Date Formatting

**Ausführen:**
```bash
npm run test:frontend

# Mit Coverage
npm run test:frontend:coverage

# Watch Mode
npm run test:frontend:watch
```

**Technologie:**
- Jest mit jsdom (DOM-Simulation)
- @testing-library/dom
- @testing-library/jest-dom

**Beispiel-Testfälle:**
- ✓ Email-Validierung funktioniert korrekt
- ✓ Guest Fields werden korrekt gerendert
- ✓ Form-Felder werden deaktiviert bei "Absage"
- ✓ HTML wird escaped um XSS zu verhindern
- ✓ Debounce verzögert Funktionsausführung

### 4. End-to-End (E2E) Tests

**Speicherort:** `e2e/`

**Was wird getestet:**
- ✅ Kompletter RSVP-Flow (rsvp-flow.spec.js)
  - RSVP mit Zusage absenden
  - RSVP mit Absage absenden
  - Validierung von Pflichtfeldern
  - Gast-Counter Funktionalität
  - RSVP bearbeiten

- ✅ Geschenkliste-Flow (gifts-flow.spec.js)
  - Geschenke anzeigen
  - Geschenk reservieren
  - Reservierung rückgängig machen
  - Admin: Geschenk hinzufügen/löschen

- ✅ Admin-Panel (admin-flow.spec.js)
  - Login/Logout
  - RSVPs verwalten
  - RSVPs exportieren
  - Statistiken anzeigen

**Ausführen:**
```bash
# E2E Tests (startet Emulator automatisch)
npm run test:e2e

# Nur Chrome
npm run test:e2e -- --project=chromium

# Mit UI
npx playwright test --ui

# Bestimmten Test ausführen
npm run test:e2e e2e/rsvp-flow.spec.js
```

**Technologie:**
- Playwright - Browser-Automatisierung
- Firebase Emulator Suite
- Multi-Browser Testing (Chrome, Firefox, Safari, Mobile)

**Browser-Tests:**
- ✓ Desktop Chrome
- ✓ Desktop Firefox
- ✓ Desktop Safari (WebKit)
- ✓ Mobile Chrome (Pixel 5)
- ✓ Mobile Safari (iPhone 12)

### 5. CI/CD Pipeline

**Speicherort:** `.github/workflows/`

**Workflows:**

#### `test.yml` - Haupttest-Pipeline
Läuft bei jedem Push und Pull Request

**Jobs:**
1. **test-functions** - Backend Function Tests
2. **test-firestore-rules** - Firestore Rules Tests
3. **test-frontend** - Frontend JavaScript Tests
4. **test-e2e** - End-to-End Tests
5. **lint-and-validate** - Code-Qualität & Syntax
6. **pre-deployment-check** - Deployment-Bereitschaftsprüfung (nur main branch)

**Features:**
- ✅ Coverage Reports (Codecov Integration)
- ✅ Parallel Job-Ausführung für schnellere Tests
- ✅ Artifact-Upload (Playwright Reports)
- ✅ Security Audit (npm audit)
- ✅ Dry-Run Deployment Test

#### `pre-deploy.yml` - Pre-Deployment Validation
Manuell ausführbar vor Deployments

```bash
# Via GitHub UI:
# Actions → Pre-Deployment Validation → Run workflow
```

**Prüfungen:**
- ✅ Firebase-Konfiguration validieren
- ✅ Syntax-Checks (JS, Firestore Rules)
- ✅ Security Audit
- ✅ Vollständige Test-Suite
- ✅ Deployment Dry-Run
- ✅ Deployment Report generieren

## 📊 Coverage Reports

### Aktuelles Coverage-Ziel

- **Functions:** > 70%
- **Frontend:** > 60%
- **Gesamt:** > 65%

### Coverage anzeigen

```bash
# Functions Coverage
cd functions
npm test -- --coverage
open coverage/lcov-report/index.html

# Frontend Coverage
npm run test:frontend:coverage
open coverage/lcov-report/index.html
```

## 🔧 Entwickler-Workflow

### Vor dem Commit

```bash
# Alle Tests lokal ausführen
npm run test:all

# Syntax validieren
npm run validate
```

### Während der Entwicklung

```bash
# Functions im Watch Mode
cd functions
npm test -- --watch

# Frontend im Watch Mode
npm run test:frontend:watch

# Emulator für manuelle Tests
firebase emulators:start
```

### Vor dem Deployment

```bash
# Pre-Deployment Checks
firebase deploy --dry-run

# Oder via GitHub Actions:
# Actions → Pre-Deployment Validation → Run workflow → Deploy
```

## 🐛 Debugging

### Jest Tests debuggen

```bash
# Node Inspector für Backend Tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose Output
npm test -- --verbose

# Bestimmten Test ausführen
npm test -- -t "test name pattern"
```

### Playwright Tests debuggen

```bash
# Mit UI
npx playwright test --ui

# Mit Inspector
npx playwright test --debug

# Headed Mode (Browser sichtbar)
npx playwright test --headed

# Screenshots bei Fehlern
# (automatisch aktiviert - siehe playwright-report/)
```

### Firestore Emulator debuggen

```bash
# Emulator mit UI starten
firebase emulators:start

# UI öffnen: http://localhost:4000
```

## 📝 Neue Tests hinzufügen

### Backend Function Test

1. Erstelle Datei in `functions/test/`
2. Verwende Template:

```javascript
const nock = require('nock');

describe('My Function', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something', () => {
    // Test implementation
  });
});
```

### Frontend Test

1. Erstelle Datei in `assets/js/__tests__/`
2. Verwende Template:

```javascript
describe('My Component', () => {
  beforeEach(() => {
    document.body.innerHTML = `<!-- HTML -->`;
  });

  test('should render correctly', () => {
    // Test implementation
  });
});
```

### E2E Test

1. Erstelle Datei in `e2e/`
2. Verwende Template:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/page.html');
    // Test implementation
  });
});
```

## 🎯 Best Practices

1. **Schreibe Tests zuerst (TDD)** - Red → Green → Refactor
2. **Isolierte Tests** - Keine Abhängigkeiten zwischen Tests
3. **Beschreibende Namen** - Test-Namen sollten klar aussagen, was getestet wird
4. **Arrange-Act-Assert** - Klare Struktur in Tests
5. **Mock External Services** - Keine echten API-Calls in Tests
6. **Clean Up** - `beforeEach`/`afterEach` für saubere Test-Umgebung
7. **Test Edge Cases** - Nicht nur Happy Path testen

## 🚨 Häufige Probleme

### Problem: "Port 8080 already in use"
**Lösung:**
```bash
firebase emulators:stop
# oder
lsof -ti:8080 | xargs kill -9
```

### Problem: "Module not found"
**Lösung:**
```bash
npm ci
cd functions && npm ci
```

### Problem: "Firestore Rules Tests schlagen fehl"
**Lösung:**
1. Stelle sicher, dass Emulator läuft
2. Prüfe Port-Konfiguration (8080)
3. Lösche Emulator-Daten: `rm -rf .firebase/`

### Problem: "E2E Tests timeout"
**Lösung:**
1. Erhöhe Timeout in `playwright.config.js`
2. Stelle sicher, dass Emulator vollständig gestartet ist
3. Prüfe `webServer.timeout` Einstellung

## 📚 Weitere Ressourcen

- [Jest Dokumentation](https://jestjs.io/)
- [Playwright Dokumentation](https://playwright.dev/)
- [Firebase Testing Docs](https://firebase.google.com/docs/functions/unit-testing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 💡 Unterstützung

Bei Fragen oder Problemen:
1. Prüfe diese Dokumentation
2. Schaue in die Test-Dateien für Beispiele
3. Öffne ein Issue auf GitHub
