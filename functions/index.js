// index.js
const functions = require('firebase-functions/v1');
require('dotenv').config();
const { getStorage } = require('firebase-admin/storage');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cookieParser = require("cookie-parser");
const axios = require('axios');
const cors = require('cors')({origin: true});
const express = require('express');

const app = express();

// Initialize admin only once in the global scope
try {
  admin.initializeApp();
} catch (e) {
  console.error('Firebase admin initialization error', e);
}

const webhookUrl = "https://script.google.com/macros/s/AKfycbzQ2Rhg5Sva8EnfShO0tg8mhrl0K5cUSIYlIEJ--ih5IDbGNm2z0WujwYVz0kJOXKrZRg/exec";

app.use(cors);
// allow larger payload for base64 image uploads
app.use(express.json({ limit: '12mb' }));

/**
 * A helper function to send emails using a template.
 * @param {string} templateName The name of the HTML template file (without extension).
 * @param {object} mailData The data for the email payload and template.
 */
async function sendEmail(templateName, mailData) {
  const Handlebars = require('handlebars');
  const templateDir = path.join(__dirname, 'templates');
  const tplSrc = fs.readFileSync(path.join(templateDir, `${templateName}.html`), 'utf8');
  const template = Handlebars.compile(tplSrc);
  const html = template(mailData.templateVariables);

  const payload = {
    to_email: mailData.to_email,
    to_name: mailData.to_name,
    subject: mailData.subject,
    html: html,
    text: mailData.text,
  };

  try {
    console.log(`Attempting to send email for template: ${templateName} to ${mailData.to_email}`);
    await axios.post(webhookUrl, payload);
    console.log(`Email for template ${templateName} sent successfully.`);
  } catch (err) {
    console.error(`Error sending email for ${templateName}:`, JSON.stringify(err, null, 2));
  }
}

app.post('/sendContactMail', async (req, res) => {
  const { Name, "E-Mail": email, Betreff, Nachricht, newsletter } = req.body;

  const payload = {
    to_email: "eduard.wayz@gmail.com",
    to_name: "Eduard & Joanne",
    reply_to_email: email,
    reply_to_name: Name,
    subject: `Kontaktformular: ${Betreff}`,
    text: `Name: ${Name}\nE-Mail: ${email}\nBetreff: ${Betreff}\nNewsletter: ${ newsletter === "yes" ? "Ja" : "Nein"}\n\nNachricht:\n${Nachricht}`,
  };

  try {
    await axios.post(webhookUrl, payload);
    
    // Send confirmation email to user
    await sendEmail('contact_confirmation', {
      to_email: email,
      to_name: Name,
      subject: 'Bestätigung deiner Kontaktanfrage',
      text: `Hallo ${Name},\n\nvielen Dank für deine Nachricht. Wir haben sie erhalten und werden uns so schnell wie möglich bei dir melden.\n\nDeine Nachricht:\nBetreff: ${Betreff}\nNachricht: ${Nachricht}\n\n Viele Grüße,\nEduard & Joanne`,
      templateVariables: {
        Name,
        email,
        Betreff,
        Nachricht,
      },
    });

    res.status(200).send("OK");
  } catch (err) {
    console.error("Fehler beim Versenden der Kontakt-E-Mail an Google Script:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Upload gift image via HTTPS to avoid client-side Storage CORS
app.post('/uploadGiftImage', async (req, res) => {
  try {
    const { filename, contentType, dataBase64, dataUrl } = req.body || {};
    if (!filename || !contentType || (!dataBase64 && !dataUrl)) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const base64Payload = dataBase64 || String(dataUrl || '').split('base64,').pop();
    const buffer = Buffer.from(base64Payload, 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'file_too_large' });
    }

    const bucket = getStorage().bucket();
    const safeName = String(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const objectPath = `gifts/${Date.now()}_${safeName}`;
    const file = bucket.file(objectPath);
    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: { firebaseStorageDownloadTokens: token },
      },
      resumable: false,
      validation: false,
    });

    const gsUrl = `gs://hochzeiteduardjoanne.appspot.com/${objectPath}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/hochzeiteduardjoanne.appspot.com/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return res.json({ gsUrl, downloadUrl, path: objectPath });
  } catch (e) {
    console.error('uploadGiftImage error', e);
    return res.status(500).json({ error: 'upload_failed', message: e?.message || String(e) });
  }
});

exports.onGiftReserved = functions.firestore
  .document('gifts/{giftId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before?.reserved && after?.reserved) {
      const giftId = context.params.giftId;
      const { name, reserverEmail, reserverName, imgUrl } = after;
      const token = crypto.randomBytes(32).toString('hex');

      await change.after.ref.update({
        token,
        reservedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      let giftImage = null;
      if (imgUrl) {
        if (imgUrl.startsWith('gs://')) {
          try {
            const bucket = getStorage().bucket();
            const file = bucket.file(imgUrl.replace('gs://hochzeiteduardjoanne.appspot.com/', ''));
            const urls = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            giftImage = urls[0];
          } catch (error) {
            console.error('Error getting download URL', error);
          }
        } else {
          giftImage = imgUrl;
        }
      }

      const undoUrl = `https://us-central1-hochzeiteduardjoanne.cloudfunctions.net/undoGift?giftId=${giftId}&token=${token}`;

      await sendEmail('reservation', {
        to_email: reserverEmail,
        to_name: reserverName || reserverEmail,
        subject: "Deine Geschenkauswahl bei Eduard & Joanne",
        text: `Hallo! Du hast ${name} reserviert. Rückgängig: ${undoUrl}`,
        templateVariables: {
          reserverName: reserverName || 'Freund',
          giftName: name,
          giftImage,
          undoUrl,
        },
      });
    }
    return null;
  });

exports.onRsvpSubmitted = functions.firestore
  .document('rsvps/{rsvpId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const rsvpId = context.params.rsvpId;
    const editUrl = `https://eddywayz.github.io/Hochzeit_Eduard_Joanne/edit-rsvp.html?id=${rsvpId}`;

    await sendEmail('rsvp_confirmation', {
      to_email: data.email,
      to_name: data.familyName,
      subject: "Deine RSVP-Bestätigung für unsere Hochzeit",
      text: `Hallo ${data.familyName}, vielen Dank für deine Rückmeldung! Bearbeiten: ${editUrl}`,
      templateVariables: {
        ...data,
        attending: data.attending === 'yes' ? 'Ja' : 'Nein',
        intolerances: data.intolerances || '–',
        editUrl,
      },
    });

    if (process.env.NTFY_TOPIC) {
      try {
        await axios.post(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
          topic: process.env.NTFY_TOPIC,
          message: `${data.familyName} hat sich angemeldet. (${data.guests} Gäste)`,
          title: "Neue Zusage für die Hochzeit!",
          priority: "high"
        });
      } catch (error) {
        console.error('Error sending ntfy notification', error);
      }
    }

    return null;
  });

exports.onRsvpUpdated = functions.firestore
  .document('rsvps/{rsvpId}')
  .onUpdate(async (change, context) => {
    const data = change.after.data();
    const rsvpId = context.params.rsvpId;
    const editUrl = `https://eddywayz.github.io/Hochzeit_Eduard_Joanne/edit-rsvp.html?id=${rsvpId}`;

    await sendEmail('rsvp_update_confirmation', {
      to_email: data.email,
      to_name: data.familyName,
      subject: "Deine RSVP wurde aktualisiert",
      text: `Hallo ${data.familyName}, deine Änderungen wurden gespeichert. Erneut bearbeiten: ${editUrl}`,
      templateVariables: {
        ...data,
        attending: data.attending === 'yes' ? 'Ja' : 'Nein',
        intolerances: data.intolerances || '–',
        editUrl,
      },
    });
    return null;
  });

exports.undoGift = functions.https.onRequest(async (req, res) => {
  const { giftId, token } = req.query;
  if (!giftId || !token) return res.status(400).send('Ungültiger Link.');
  const docRef = admin.firestore().collection('gifts').doc(giftId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).send('Geschenk nicht gefunden.');
  const data = doc.data();
  if (data.token !== token) return res.status(403).send('Ungültiges Token.');
  try {
    await docRef.update({
      reserved: false,
      reserverEmail: admin.firestore.FieldValue.delete(),
      token: admin.firestore.FieldValue.delete(),
      reservedAt: admin.firestore.FieldValue.delete(),
    });
    return res.redirect(302, `${process.env.APP_BASE_URL}/gifts.html`);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Reservierung:', err);
    return res.status(500).send('Ein interner Fehler ist aufgetreten.');
  }
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

exports.sendContactMail = functions.https.onRequest(app);
