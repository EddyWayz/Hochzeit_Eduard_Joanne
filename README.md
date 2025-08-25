Hochzeit Eduard & Joanne

Eine statische Hochzeits-Webseite zur Information und Organisation der Hochzeit von Eduard & Joanne.

Inhalt

Projektbeschreibung

Features

Projektstruktur

Installation & Nutzung

Anpassung

Deployment

Contributing

Lizenz

Kontakt

Projektbeschreibung

Dieses Repository enthält den Quellcode für eine statische Webseite, die Gästen:

Informationen zum Ablauf und zur Location der Hochzeit liefert (infos.html).

Eine RSVP-Funktion über ein Formular bereitstellt (rsvp.html).

Eine Geschenkeliste anzeigt (gifts.html).

Kontaktdaten und Anfahrtshinweise anbietet (contact.html).

Einen Administrationsbereich beinhaltet (admin.html).

Features

Mehrsprachige Struktur (HTML, CSS, JavaScript).

Responsives Design via flexbox und Grid.

Einfach zu hosten auf GitHub Pages oder jedem beliebigen Webserver.

Modularer Aufbau mit Templates in html/templates/.

Projektstruktur

├── .vscode/               # Editor-Einstellungen
├── css/                   # Stylesheets (Sass/CSS)
├── fonts/                 # Schriftdateien
├── html/                  # HTML-Vorlagen
│   └── templates/         # Wiederverwendbare Template-Teile
├── img/                   # Bilder (SVG, JPG, PNG)
├── js/                    # JavaScript-Logik
├── index.html             # Startseite
├── infos.html             # Informationen zur Hochzeit
├── rsvp.html              # Anmeldeformular
├── gifts.html             # Geschenkeliste
├── contact.html           # Kontaktseite
├── admin.html             # Administrationsbereich
└── README.md              # Diese Datei

Installation & Nutzung

Klonen des Repositories:

git clone https://github.com/EddyWayz/Hochzeit_Eduard_Joanne.git
cd Hochzeit_Eduard_Joanne

Ansehen im Browser:

Öffne index.html lokal, oder

Hoste auf einem Webserver (z. B. GitHub Pages).

Anpassung

Ersetze Platzhalter in den HTML-Dateien mit euren Namen, Daten und Adressen.

Passe Farben und Schriftarten im css/-Verzeichnis an.

Ersetze Fotos in img/ durch eure eigenen Motive.

Bearbeite die Geschenkeliste in gifts.html nach euren Wünschen.

Deployment

GitHub Pages:

Push auf main oder eine gh-pages-Branch.

Aktiviere GitHub Pages in den Repository-Einstellungen.

Eigenes Hosting:

Upload aller Dateien auf euren Webspace.

Stelle sicher, dass die Dateistruktur erhalten bleibt.

Firebase-Konfiguration

Die Datei js/firebase-init.js enthält Platzhalter wie __FIREBASE_API_KEY__.
Vor einem Deployment müssen diese mit euren echten Firebase-Werten ersetzt
werden. Setzt dazu die entsprechenden Umgebungsvariablen und führt z.B. diesen
Build-Schritt aus:

FIREBASE_API_KEY=... \
FIREBASE_AUTH_DOMAIN=... \
FIREBASE_PROJECT_ID=... \
FIREBASE_STORAGE_BUCKET=... \
FIREBASE_MESSAGING_SENDER_ID=... \
FIREBASE_APP_ID=... \
envsubst < js/firebase-init.js > js/firebase-init.js.tmp && \
mv js/firebase-init.js.tmp js/firebase-init.js

CI/CD-Plattformen können auf die gleiche Weise die Platzhalter während des
Deployments ersetzen.

Die Firestore-Sicherheitsregeln liegen in firestore.rules und sollten nach
Anpassungen mit der Firebase CLI (firebase deploy --only firestore:rules)
ausgerollt werden.

Contributing

Beiträge sind willkommen! Bitte öffne Issues für Fehler oder Feature-Requests und erstelle Pull Requests für Änderungen.

Lizenz

Dieses Projekt steht unter der MIT License.

Kontakt

Eduard & Joanne

E-Mail: [email@example.com]

Telefon: +49 [Telefonnummer]

