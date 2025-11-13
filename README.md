# Hochzeit Eduard & Joanne 💍

Eine moderne, sichere und performante Hochzeitswebsite mit Firebase-Backend.

[![Firebase](https://img.shields.io/badge/Firebase-v11-orange)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green)](https://nodejs.org/)
[![Security](https://img.shields.io/badge/Security-Hardened-brightgreen)](./firestore.rules)

## 📋 Inhaltsverzeichnis

- [Projektbeschreibung](#projektbeschreibung)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Installation](#installation)
- [Deployment](#deployment)
- [Sicherheit](#sicherheit)
- [Changelog](#changelog)
- [Contributing](#contributing)

## 🎉 Projektbeschreibung

Eine vollständige Hochzeitswebsite mit modernen Web-Technologien, die Gästen ermöglicht:

- ✨ Informationen zur Hochzeit abzurufen
- 📝 Ihre Teilnahme zu bestätigen (RSVP)
- 🎁 Geschenke zu reservieren
- 📧 Kontakt aufzunehmen
- 👨‍💼 (Admin) RSVPs und Geschenke zu verwalten

## ✨ Features

### Für Gäste
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **RSVP-System** - Einfache Zu-/Absage mit dynamischen Gästefeldern
- **Geschenkeliste** - Reservierung von Geschenken mit E-Mail-Bestätigung
- **Kontaktformular** - Direkter Kontakt mit automatischer Bestätigung
- **Toast-Benachrichtigungen** - Moderne Feedback-Nachrichten statt Alerts
- **Formular-Validierung** - Client-seitige Validierung für bessere UX

### Für Admins
- **Admin-Dashboard** - Übersicht über alle RSVPs und Geschenke
- **Statistiken** - Echtzeit-Statistiken zu Zusagen und Geschenken
- **Export-Funktion** - CSV-Export aller RSVPs
- **Geschenk-Verwaltung** - Hinzufügen, Bearbeiten und Löschen von Geschenken
- **Bild-Upload** - Direkt vom Admin-Panel oder automatisch von Produkt-URLs
- **Rate-Limiting** - Schutz vor Brute-Force-Angriffen beim Login

### Technische Features
- **Firebase Backend** - Firestore, Storage, Cloud Functions, Authentication
- **Security Rules** - Umfassende Sicherheitsregeln für Firestore und Storage
- **Realtime Updates** - Live-Aktualisierung von Daten
- **Optimierte Performance** - Lazy Loading, Image Optimization, Caching
- **SEO & Accessibility** - Meta-Tags, Structured Data, ARIA-Labels
- **Error Handling** - Robuste Fehlerbehandlung mit benutzerfreundlichen Meldungen

## 🛠 Tech Stack

### Frontend
- **HTML5 / CSS3** - Moderne Web-Standards
- **Vanilla JavaScript** - Keine schweren Frameworks
- **Firebase SDK v11** - Neueste Firebase Client-Library
- **Custom CSS Design System** - Fluid Typography mit `clamp()`

### Backend
- **Firebase Firestore** - NoSQL-Datenbank
- **Firebase Storage** - Bild-Hosting
- **Firebase Cloud Functions** - Serverless Backend (Node.js 22)
- **Firebase Authentication** - Admin-Login
- **Firebase Hosting** - Statisches Hosting

### Dependencies
- `axios` - HTTP-Client (neueste sichere Version)
- `handlebars` - Template-Engine für E-Mails
- `cors` - Cross-Origin Resource Sharing
- `cookie-parser` - Session-Management

## 📁 Projektstruktur

```
.
├── assets/
│   ├── css/
│   │   ├── variables.css      # Design System
│   │   ├── basic.css          # Base Styles
│   │   ├── toast.css          # Toast Notifications
│   │   └── *.css              # Seiten-spezifische Styles
│   └── js/
│       ├── utils.js           # Utility-Funktionen
│       ├── toast.js           # Toast-System
│       ├── gifts.js           # Geschenke-Logik
│       └── includeTemplate.js # Template-Loader
├── functions/
│   ├── index.js               # Cloud Functions
│   ├── templates/             # E-Mail-Templates
│   ├── .env                   # Umgebungsvariablen (nicht in Git!)
│   └── package.json
├── includes/
│   ├── header.html            # Navigation
│   └── footer.html            # Footer
├── img/                       # Bilder
├── fonts/                     # Custom Fonts
├── config.js                  # Zentrale Konfiguration
├── index.html                 # Startseite
├── rsvp.html                  # RSVP-Formular
├── gifts.html                 # Geschenkeliste
├── admin.html                 # Admin-Dashboard
├── contact.html               # Kontaktformular
├── firestore.rules            # Firestore Security Rules
├── storage.rules              # Storage Security Rules
├── firebase.json              # Firebase-Konfiguration
├── DEPLOYMENT.md              # Deployment-Anleitung
└── README.md                  # Diese Datei
```

## 🚀 Installation

### Voraussetzungen
- Node.js 22 oder höher
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Setup

1. **Repository klonen:**
   ```bash
   git clone https://github.com/eddywayz/Hochzeit_Eduard_Joanne.git
   cd Hochzeit_Eduard_Joanne
   ```

2. **Firebase Functions Dependencies installieren:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Umgebungsvariablen konfigurieren:**
   ```bash
   cd functions
   cp .env.example .env
   # Bearbeite .env und fülle die Werte aus
   ```

4. **Firebase CLI anmelden:**
   ```bash
   firebase login
   firebase use hochzeiteduardjoanne
   ```

## 📦 Deployment

Ausführliche Deployment-Anleitung: [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Start:**

```bash
# Alle Rules und Functions deployen
firebase deploy

# Nur bestimmte Services deployen
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
firebase deploy --only hosting
```

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen

#### Firestore Security Rules
- **RSVP Collection**: Öffentliches Erstellen erlaubt, aber mit E-Mail-Validierung
- **Gifts Collection**: Reservierung erlaubt, aber nur einmal und nicht rückgängig machbar
- **Admin-Only Operations**: Löschen nur für authentifizierte Admins

#### Storage Security Rules
- **Öffentliches Lesen**: Alle Bilder sind öffentlich lesbar
- **Admin-Only Schreiben**: Nur Admins können Bilder hochladen
- **Dateigrößen-Limit**: Maximal 10 MB pro Datei
- **Dateityp-Beschränkung**: Nur Bilddateien erlaubt

#### Client-Side Security
- **Input-Validierung**: Alle Formulareingaben werden validiert
- **Rate-Limiting**: Client-seitiges Rate-Limiting für Login (5 Versuche / 5 Min)
- **XSS-Schutz**: Alle User-Inputs werden escaped
- **HTTPS-Only**: Alle Firebase-Verbindungen über HTTPS

#### Behobene Sicherheitslücken
- ✅ Axios DoS-Vulnerability (CVE-2024-xxxxx) - Update auf v1.12.0+
- ✅ Firebase SDK veraltet - Update von v9.23.0 auf v11.0.1
- ✅ Fehlende Security Rules - Vollständige Rules implementiert
- ✅ Hardcodierte URLs - Zentralisiert in config.js und .env

## 📝 Changelog

### Version 2.0.0 (2025-01-13) - Security & Performance Update

#### 🔒 Sicherheit
- **CRITICAL**: Axios auf neueste Version aktualisiert (behebt DoS-Lücke)
- **NEW**: Firestore Security Rules erstellt und dokumentiert
- **NEW**: Storage Security Rules erstellt und dokumentiert
- **NEW**: Client-seitiges Rate-Limiting für Admin-Login
- **NEW**: Input-Validierung für alle Formulare
- **IMPROVED**: Firebase SDK v11.0.1 (vorher v9.23.0)

#### ✨ Features
- **NEW**: Toast-Notification System (ersetzt alert())
- **NEW**: Zentrale Konfigurationsdatei (config.js)
- **NEW**: Utils-Bibliothek mit wiederverwendbaren Funktionen
- **NEW**: Modal-Verbesserungen (Escape-Key, Backdrop-Click)
- **NEW**: Formular-Validierung mit Fehleranzeige
- **NEW**: E-Mail-Validierung
- **IMPROVED**: Bessere Fehlerbehandlung mit spezifischen Meldungen

#### 🎨 UX/UI
- **IMPROVED**: Moderne Toast-Benachrichtigungen statt Alerts
- **IMPROVED**: Loading-States für alle Buttons
- **IMPROVED**: Inline-Fehleranzeige bei Formularen
- **IMPROVED**: Bessere Accessibility (ARIA-Labels)

#### 🚀 Performance
- **IMPROVED**: Code-Duplikation beseitigt (DRY-Prinzip)
- **IMPROVED**: Optimierte Bild-Lade-Strategie
- **IMPROVED**: Cache-Headers für statische Assets
- **NEW**: Batch-Loading für Bilder

#### 🛠 Entwicklung
- **NEW**: DEPLOYMENT.md mit vollständiger Anleitung
- **NEW**: .env.example für einfaches Setup
- **IMPROVED**: Zentralisierte URL-Verwaltung
- **IMPROVED**: Bessere Code-Organisation
- **IMPROVED**: TypeScript-ready Utils

#### 🐛 Bugfixes
- **FIXED**: Storage-URL-Normalisierung funktionierte nicht korrekt
- **FIXED**: Geschenk-Bilder wurden nicht korrekt geladen
- **FIXED**: RSVP-Formular resettet nicht nach Absenden
- **FIXED**: Admin-Login ohne Fehlerbehandlung

### Version 1.0.0 (2024-09-03) - Initial Release
- Grundlegende Hochzeitswebsite
- RSVP-System
- Geschenkeliste
- Admin-Dashboard
- Firebase-Integration

## 🤝 Contributing

Beiträge sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### Code-Standards
- Verwende Vanilla JavaScript (kein jQuery)
- Folge dem bestehenden Code-Style
- Kommentiere komplexe Logik
- Teste alle Änderungen lokal

## 📄 Lizenz

Dieses Projekt steht unter der MIT License.

## 📧 Kontakt

**Eduard & Joanne**
- E-Mail: eduard.wayz@gmail.com
- GitHub: [@eddywayz](https://github.com/eddywayz)
- Website: [hochzeiteduardjoanne.web.app](https://hochzeiteduardjoanne.web.app)

---

**Made with ❤️ for our special day**
