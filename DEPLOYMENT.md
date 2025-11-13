# Deployment-Anleitung

Diese Anleitung beschreibt, wie du die Hochzeitswebsite auf Firebase deployen kannst.

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 22 oder höher)
- [Firebase CLI](https://firebase.google.com/docs/cli) installiert (`npm install -g firebase-tools`)
- Zugriff auf das Firebase-Projekt `hochzeiteduardjoanne`

## Installation

1. **Repository klonen:**
   ```bash
   git clone https://github.com/eddywayz/Hochzeit_Eduard_Joanne.git
   cd Hochzeit_Eduard_Joanne
   ```

2. **Dependencies für Cloud Functions installieren:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Umgebungsvariablen konfigurieren:**
   ```bash
   cd functions
   cp .env.example .env
   # Bearbeite .env und fülle die erforderlichen Werte aus
   ```

   Erforderliche Umgebungsvariablen in `.env`:
   - `WEBHOOK_URL`: Google Apps Script Webhook für E-Mail-Versand
   - `APP_BASE_URL`: Base-URL der Website (z.B. https://eddywayz.github.io/Hochzeit_Eduard_Joanne)
   - `FUNCTIONS_BASE_URL`: Base-URL der Cloud Functions
   - `NTFY_TOPIC` (optional): Topic für ntfy.sh Push-Benachrichtigungen

## Deployment

### 1. Firebase Login

```bash
firebase login
```

### 2. Projekt auswählen

```bash
firebase use hochzeiteduardjoanne
```

### 3. Firestore Security Rules deployen

**WICHTIG:** Dies muss vor dem ersten Deployment oder nach Änderungen an `firestore.rules` durchgeführt werden!

```bash
firebase deploy --only firestore:rules
```

### 4. Storage Security Rules deployen

```bash
firebase deploy --only storage:rules
```

### 5. Cloud Functions deployen

```bash
firebase deploy --only functions
```

Oder einzelne Functions deployen:
```bash
firebase deploy --only functions:sendContactMail
firebase deploy --only functions:onGiftReserved
firebase deploy --only functions:onRsvpSubmitted
```

### 6. Hosting deployen

```bash
firebase deploy --only hosting
```

### 7. Alles auf einmal deployen

```bash
firebase deploy
```

## Wichtige Hinweise

### Security Rules

Die Security Rules wurden erstellt, um die Firestore-Datenbank und den Storage zu schützen:

- **Firestore Rules** (`firestore.rules`):
  - RSVPs: Jeder kann erstellen, lesen und eigene aktualisieren
  - Gifts: Jeder kann lesen und reservieren, nur Admins können erstellen/löschen
  - E-Mail-Validierung integriert
  - Größen- und Typ-Beschränkungen

- **Storage Rules** (`storage.rules`):
  - Gift-Bilder: Öffentlich lesbar, nur Admins können schreiben
  - Maximale Dateigröße: 10 MB
  - Nur Bilddateien erlaubt

### Konfiguration

Die Firebase-Konfiguration ist jetzt zentralisiert in `config.js`. Ändere diese Datei, wenn:
- Du die Firebase-Projekt-IDs ändern möchtest
- Du andere URLs verwenden möchtest
- Du Feature-Flags anpassen möchtest

### Axios Security Update

Die Axios-Bibliothek wurde auf die neueste Version aktualisiert, um eine DoS-Sicherheitslücke zu beheben.
Dies geschah automatisch durch `npm update axios` in den Cloud Functions.

## Testing

### Lokales Testing

1. **Firebase Emulators starten:**
   ```bash
   firebase emulators:start
   ```

2. **Nur Functions testen:**
   ```bash
   cd functions
   npm run serve
   ```

### Vor dem Deployment testen

Es wird empfohlen, die Änderungen lokal zu testen, bevor du sie live stellst:

```bash
# Emulators mit allen Services starten
firebase emulators:start --only functions,firestore,hosting,storage
```

## Monitoring

### Logs ansehen

```bash
# Alle Logs
firebase functions:log

# Logs einer bestimmten Function
firebase functions:log --only sendContactMail

# Realtime Logs
firebase functions:log --follow
```

### Firestore Daten ansehen

Nutze die [Firebase Console](https://console.firebase.google.com/) um:
- RSVPs zu verwalten
- Geschenke zu überprüfen
- Logs anzusehen
- Analytics zu überprüfen

## Troubleshooting

### Problem: "Permission denied" beim Deployment

**Lösung:**
```bash
firebase login --reauth
firebase use hochzeiteduardjoanne
```

### Problem: Functions deployen fehlschlägt

**Lösung:**
```bash
cd functions
npm install
npm audit fix
cd ..
firebase deploy --only functions
```

### Problem: Security Rules werden nicht angewendet

**Lösung:**
1. Überprüfe die Syntax der Rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Warte ein paar Minuten, bis die Rules aktiv werden
3. Überprüfe in der Firebase Console, ob die Rules korrekt sind

### Problem: Umgebungsvariablen werden nicht geladen

**Lösung:**
1. Stelle sicher, dass `.env` im `functions/` Ordner existiert
2. Überprüfe, dass die `.env` Datei nicht in `.gitignore` steht (aber nicht committed wird!)
3. Lade die Functions neu:
   ```bash
   cd functions
   npm run serve
   ```

## Backup & Rollback

### Backup erstellen

```bash
# Firestore Daten exportieren
gcloud firestore export gs://hochzeiteduardjoanne.appspot.com/backups/$(date +%Y%m%d)

# Functions Version speichern
firebase functions:log > functions_$(date +%Y%m%d).log
```

### Rollback durchführen

```bash
# Zu einer vorherigen Version zurückkehren
firebase rollback functions:sendContactMail --version=<VERSION_ID>
```

## Wichtige Links

- [Firebase Console](https://console.firebase.google.com/project/hochzeiteduardjoanne)
- [Firebase Hosting](https://hochzeiteduardjoanne.web.app/)
- [Firebase Functions](https://console.firebase.google.com/project/hochzeiteduardjoanne/functions)
- [Firebase Security Rules](https://console.firebase.google.com/project/hochzeiteduardjoanne/firestore/rules)

## Support

Bei Problemen oder Fragen:
1. Überprüfe die Logs: `firebase functions:log`
2. Schaue in die [Firebase Documentation](https://firebase.google.com/docs)
3. Kontaktiere den Entwickler

---

**Hinweis:** Diese Anleitung geht davon aus, dass du bereits Zugriff auf das Firebase-Projekt hast. Falls nicht, musst du zunächst Zugriff vom Projekt-Owner erhalten.
