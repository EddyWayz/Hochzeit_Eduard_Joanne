// index.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cookieParser = require("cookie-parser");
const axios = require('axios');

// Initialize admin only once in the global scope
try {
  admin.initializeApp();
} catch (e) {
  console.error('Firebase admin initialization error', e);
}

const webhookUrl = "https://script.google.com/macros/s/AKfycbzQ2Rhg5Sva8EnfShO0tg8mhrl0K5cUSIYlIEJ--ih5IDbGNm2z0WujwYVz0kJOXKrZRg/exec";

exports.onGiftReserved = functions.firestore
  .document('gifts/{giftId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    if (!before?.reserved && after?.reserved) {
      // Lazily load heavy modules and templates only when function is triggered
      const Handlebars = require('handlebars');
      const templateDir = path.join(__dirname, 'templates');
      const giftTplSrc = fs.readFileSync(path.join(templateDir, 'reservation.html'), 'utf8');
      const giftTemplate = Handlebars.compile(giftTplSrc);

      const giftId        = context.params.giftId;
      const { name, reserverEmail, reserverName } = after;
      const token         = crypto.randomBytes(32).toString('hex');
      await change.after.ref.update({
        token,
        reservedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const undoUrl       = `https://us-central1-hochzeiteduardjoanne.cloudfunctions.net/undoGift?giftId=${giftId}&token=${token}`; 
      
      const html = giftTemplate({
        reserverName: reserverName || 'Freund',
        giftName:     name,
        undoUrl
      });

      const payload = {
        to_email: reserverEmail,
        to_name: reserverName || reserverEmail,
        subject: "Deine Geschenkauswahl bei Eduard & Joanne",
        html: html,
        text: `Hallo! Du hast ${name} reserviert. Rückgängig: ${undoUrl}`
      };

      try {
        console.log("Attempting to POST to Google Script URL:", webhookUrl);
        await axios.post(webhookUrl, payload);
        console.log(`Bestätigungsmail an ${reserverEmail} gesendet (Gift: ${giftId})`);
      } catch (err) {
        console.error('Fehler beim Senden der Bestätigungsmail an Google Script:', JSON.stringify(err, null, 2));
      }
    }
    return null;
  });

exports.undoGift = functions.https.onRequest(async (req, res) => {
  const { giftId, token } = req.query;
  if (!giftId || !token) return res.status(400).send('Ungültiger Link.');
  const docRef = admin.firestore().collection('gifts').doc(giftId);
  const doc    = await docRef.get();
  if (!doc.exists) return res.status(404).send('Geschenk nicht gefunden.');
  const data = doc.data();
  if (data.token !== token) return res.status(403).send('Ungültiges Token.');
  try {
    await docRef.update({
      reserved:      false,
      reserverEmail: admin.firestore.FieldValue.delete(),
      token:         admin.firestore.FieldValue.delete(),
      reservedAt:    admin.firestore.FieldValue.delete()
    });
    return res.redirect(302, `${functions.config().app.base_url}/gifts.html`);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Reservierung:', err);
    return res.status(500).send('Ein interner Fehler ist aufgetreten.');
  }
});

exports.onRsvpSubmitted = functions.firestore
  .document('rsvps/{rsvpId}')
  .onCreate(async (snap, context) => {
    const Handlebars = require('handlebars');
    const data = snap.data();
    const {
      familyName,
      email,
      attending,
      guests,
      guestDetails,
      intolerances,
      message
    } = data;
    const rsvpId = context.params.rsvpId;

    const htmlSrc = fs.readFileSync(path.join(__dirname, 'templates', 'rsvp_confirmation.html'), 'utf8');
    const rsvpTemplate = Handlebars.compile(htmlSrc);

    const editUrl = `https://eddywayz.github.io/Hochzeit_Eduard_Joanne/edit-rsvp.html?id=${rsvpId}`;

    const filledHtml = rsvpTemplate({
      familyName,
      attending: attending === 'yes' ? 'Ja' : 'Nein',
      guests,
      guestDetails,
      intolerances: intolerances || '–',
      message,
      editUrl
    });

    const payload = {
      to_email: email,
      to_name: familyName,
      subject: "Deine RSVP-Bestätigung für unsere Hochzeit",
      html: filledHtml,
      text: `Hallo ${familyName}, vielen Dank für deine Rückmeldung! Bearbeiten: ${editUrl}`
    };

    try {
      await axios.post(webhookUrl, payload);
      console.log(`RSVP-Mail gesendet an ${email}`);
    } catch (err) {
      console.error('Fehler beim Versenden der RSVP-Mail an Google Script:', err);
    }
    return null;
  });

exports.onRsvpUpdated = functions.firestore
  .document('rsvps/{rsvpId}')
  .onUpdate(async (change, context) => {
    const Handlebars = require('handlebars');
    const after = change.after.data();
    const {
      familyName,
      email,
      attending,
      guests,
      guestDetails,
      intolerances,
      message
    } = after;
    const rsvpId = context.params.rsvpId;

    const htmlSrc = fs.readFileSync(path.join(__dirname, 'templates', 'rsvp_update_confirmation.html'), 'utf8');
    const updateTemplate = Handlebars.compile(htmlSrc);

    const editUrl = `${functions.config().app.base_url}/edit-rsvp.html?id=${rsvpId}`;

    const filledHtml = updateTemplate({
      familyName,
      attending: attending === 'yes' ? 'Ja' : 'Nein',
      guests,
      guestDetails,
      intolerances: intolerances || '–',
      message,
      editUrl
    });

    const payload = {
      to_email: email,
      to_name: familyName,
      subject: "Deine RSVP wurde aktualisiert",
      html: filledHtml,
      text: `Hallo ${familyName}, deine Änderungen wurden gespeichert. Erneut bearbeiten: ${editUrl}`
    };

    try {
      await axios.post(webhookUrl, payload);
      console.log(`Update-Mail gesendet an ${email}`);
    } catch (err) {
      console.error('Fehler beim Versenden der Update-Mail an Google Script:', err);
    }
    return null;
  });

exports.login = functions.https.onRequest((req, res) => {
  res.sendFile(path.join(__dirname, "../login.html"));
});

exports.sessionLogin = functions.https.onRequest((req, res) => {
  const idToken = req.body.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

exports.sessionLogout = functions.https.onRequest((req, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});

exports.admin = functions.https.onRequest((req, res) => {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(() => {
      res.sendFile(path.join(__dirname, "../admin.html"));
    })
    .catch((error) => {
      res.redirect("/login");
    });
});

exports.sendContactMail = functions.https.onRequest(async (req, res) => {
  const { Name, "E-Mail": email, Betreff, Nachricht, newsletter } = req.body;

  const payload = {
    to_email: "hochzeit@example.com",
    to_name: "Eduard & Joanne",
    reply_to_email: email,
    reply_to_name: Name,
    subject: `Kontaktformular: ${Betreff}`,
    text: `Name: ${Name}\nE-Mail: ${email}\nBetreff: ${Betreff}\nNewsletter: ${ newsletter === "yes" ? "Ja" : "Nein"}\n\nNachricht:\n${Nachricht}`
  };

  try {
    await axios.post(webhookUrl, payload);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Fehler beim Versenden der Kontakt-E-Mail an Google Script:", err);
    res.status(500).send("Internal Server Error");
  }
});
