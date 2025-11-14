// index.js - Firebase Functions V2
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getStorage } = require('firebase-admin/storage');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cookieParser = require("cookie-parser");
const axios = require('axios');
const cors = require('cors');
const express = require('express');

// Initialize admin only once in the global scope
try {
  admin.initializeApp();
} catch (e) {
  console.error('Firebase admin initialization error', e);
}

const webhookUrl = process.env.WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbzQ2Rhg5Sva8EnfShO0tg8mhrl0K5cUSIYlIEJ--ih5IDbGNm2z0WujwYVz0kJOXKrZRg/exec";
const APP_BASE_URL = process.env.APP_BASE_URL || "https://eddywayz.github.io/Hochzeit_Eduard_Joanne";
const FUNCTIONS_BASE_URL = process.env.FUNCTIONS_BASE_URL || "https://us-central1-hochzeiteduardjoanne.cloudfunctions.net";

const app = express();
app.use(cors({origin: true}));
app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());

/**
 * A helper function to send emails using a template.
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

    await sendEmail('contact_confirmation', {
      to_email: email,
      to_name: Name,
      subject: 'Bestätigung deiner Kontaktanfrage',
      text: `Hallo ${Name},\n\nvielen Dank für deine Nachricht.`,
      templateVariables: {
        Name,
        email,
        Betreff,
        Nachricht,
      },
    });

    res.status(200).send("OK");
  } catch (err) {
    console.error("Fehler beim Versenden der Kontakt-E-Mail:", err);
    res.status(500).send("Internal Server Error");
  }
});

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
    const bucketName = bucket.name;
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

    const gsUrl = `gs://${bucketName}/${objectPath}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return res.json({ gsUrl, downloadUrl, path: objectPath });
  } catch (e) {
    console.error('uploadGiftImage error', e);
    return res.status(500).json({ error: 'upload_failed', message: e?.message || String(e) });
  }
});

app.post('/resolveProductImage', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'invalid_url' });
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    async function fetchHtml(u) {
      return axios.get(u, {
        timeout: 12000,
        maxRedirects: 5,
        headers: { 'User-Agent': UA },
        validateStatus: (s) => s >= 200 && s < 400,
      });
    }

    let resp;
    try { resp = await fetchHtml(url); } catch (e) { resp = null; }
    let html = String(resp?.data || '');
    const base = new URL(url);
    const m = (re) => { const r = re.exec(html); return r && r[1] ? r[1].trim() : null; };

    const ogImage = m(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    m(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    if (!ogImage) return res.status(404).json({ error: 'image_not_found' });
    const abs = new URL(ogImage, base).toString();
    const ogTitle = m(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const ogDesc = m(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    return res.json({ imageUrl: abs, title: ogTitle, description: ogDesc });
  } catch (e) {
    console.error('resolveProductImage error', e);
    return res.status(500).json({ error: 'resolve_failed', message: e?.message });
  }
});

app.post('/importImageToStorage', async (req, res) => {
  try {
    const { imageUrl, filename } = req.body || {};
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return res.status(400).json({ error: 'invalid_image_url' });
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const imgResp = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: { 'User-Agent': UA }
    });
    const buffer = Buffer.from(imgResp.data);
    if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({ error: 'file_too_large' });
    const contentType = imgResp.headers['content-type'] || 'image/jpeg';
    const bucket = getStorage().bucket();
    const bucketName = bucket.name;
    const urlObj = new URL(imageUrl);
    const origName = filename || urlObj.pathname.split('/').pop() || 'image';
    const safeName = String(origName).split('?')[0].replace(/[^a-zA-Z0-9_.-]/g, '_');
    const objectPath = `gifts/imported/${Date.now()}_${safeName}`;
    const file = bucket.file(objectPath);
    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    await file.save(buffer, {
      metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
      resumable: false,
      validation: false
    });
    const gsUrl = `gs://${bucketName}/${objectPath}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return res.json({ gsUrl, downloadUrl, path: objectPath });
  } catch (e) {
    console.error('importImageToStorage error', e);
    return res.status(500).json({ error: 'import_failed', message: e?.message });
  }
});

// Firebase Functions V2: Document Triggers
exports.onGiftReserved = onDocumentUpdated('gifts/{giftId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const giftId = event.params.giftId;

  if (!before?.reserved && after?.reserved) {
    const { name, reserverEmail, reserverName, imgUrl } = after;
    const token = crypto.randomBytes(32).toString('hex');

    await event.data.after.ref.update({
      token,
      reservedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    let giftImage = null;
    if (imgUrl) {
      if (imgUrl.startsWith('gs://')) {
        try {
          const bucket = getStorage().bucket();
          const bucketName = bucket.name;
          const prefix = `gs://${bucketName}/`;
          const filePath = imgUrl.startsWith(prefix)
            ? imgUrl.substring(prefix.length)
            : imgUrl.replace(/^gs:\/\/[^\/]+\//, '');
          const file = bucket.file(filePath);
          const urls = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
          giftImage = urls[0];
        } catch (error) {
          console.error('Error getting download URL', error);
        }
      } else {
        giftImage = imgUrl;
      }
    }

    const undoUrl = `${FUNCTIONS_BASE_URL}/undoGift?giftId=${giftId}&token=${token}`;

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

    // Admin-Benachrichtigung (anonymisiert - ohne Namen des Gastes)
    try {
      const reservedAtTime = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
      const adminPayload = {
        to_email: "eduard.wayz@gmail.com",
        to_name: "Eduard & Joanne",
        subject: "Neues Geschenk wurde reserviert",
        text: `Ein Geschenk wurde reserviert:\n\nGeschenk: ${name}\nReserviert am: ${reservedAtTime}\n\nAdmin-Panel: ${APP_BASE_URL}/admin.html`,
      };
      await axios.post(webhookUrl, adminPayload);
    } catch (error) {
      console.error('Error sending admin notification', error);
    }
  }
});

exports.onRsvpSubmitted = onDocumentCreated('rsvps/{rsvpId}', async (event) => {
  const data = event.data.data();
  const rsvpId = event.params.rsvpId;
  const editUrl = `${APP_BASE_URL}/edit-rsvp.html?id=${rsvpId}`;

  const isAccepting = data.attending === 'yes';
  const templateName = isAccepting ? 'rsvp_confirmation' : 'rsvp_decline';
  const subject = isAccepting
    ? "Deine RSVP-Bestätigung für unsere Hochzeit"
    : "Deine Absage wurde registriert";

  await sendEmail(templateName, {
    to_email: data.email,
    to_name: data.familyName,
    subject: subject,
    text: `Hallo ${data.familyName}, vielen Dank für deine Rückmeldung!`,
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

  // Admin-Benachrichtigung
  try {
    const adminPayload = {
      to_email: "eduard.wayz@gmail.com",
      to_name: "Eduard & Joanne",
      subject: isAccepting ? "Neue Zusage für die Hochzeit!" : "Neue Absage erhalten",
      text: `Neue RSVP erhalten:\n\nName: ${data.familyName}\nE-Mail: ${data.email}\nStatus: ${isAccepting ? 'Zusage' : 'Absage'}\nAnzahl Gäste: ${data.guests || '–'}\nUnverträglichkeiten: ${data.intolerances || '–'}\n\nAdmin-Panel: ${APP_BASE_URL}/admin.html`,
    };
    await axios.post(webhookUrl, adminPayload);
  } catch (error) {
    console.error('Error sending admin notification', error);
  }
});

exports.onRsvpUpdated = onDocumentUpdated('rsvps/{rsvpId}', async (event) => {
  const data = event.data.after.data();
  const rsvpId = event.params.rsvpId;
  const editUrl = `${APP_BASE_URL}/edit-rsvp.html?id=${rsvpId}`;

  await sendEmail('rsvp_update_confirmation', {
    to_email: data.email,
    to_name: data.familyName,
    subject: "Deine RSVP wurde aktualisiert",
    text: `Hallo ${data.familyName}, deine Änderungen wurden gespeichert.`,
    templateVariables: {
      ...data,
      attending: data.attending === 'yes' ? 'Ja' : 'Nein',
      intolerances: data.intolerances || '–',
      editUrl,
    },
  });

  // Admin-Benachrichtigung
  try {
    const isAccepting = data.attending === 'yes';
    const adminPayload = {
      to_email: "eduard.wayz@gmail.com",
      to_name: "Eduard & Joanne",
      subject: "RSVP wurde aktualisiert",
      text: `Ein Gast hat seine RSVP bearbeitet:\n\nName: ${data.familyName}\nE-Mail: ${data.email}\nStatus: ${isAccepting ? 'Zusage' : 'Absage'}\nAnzahl Gäste: ${data.guests || '–'}\nUnverträglichkeiten: ${data.intolerances || '–'}\n\nAdmin-Panel: ${APP_BASE_URL}/admin.html`,
    };
    await axios.post(webhookUrl, adminPayload);
  } catch (error) {
    console.error('Error sending admin notification', error);
  }
});

// HTTP Functions
exports.undoGift = onRequest(async (req, res) => {
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
    return res.redirect(302, `${APP_BASE_URL}/gifts.html`);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Reservierung:', err);
    return res.status(500).send('Ein interner Fehler ist aufgetreten.');
  }
});

exports.login = onRequest((req, res) => {
  res.sendFile(path.join(__dirname, "../login.html"));
});

exports.sessionLogin = onRequest((req, res) => {
  const idToken = req.body.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

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

exports.sessionLogout = onRequest((req, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});

exports.admin = onRequest((req, res) => {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then(() => {
      res.sendFile(path.join(__dirname, "../admin.html"));
    })
    .catch((error) => {
      res.redirect("/login");
    });
});

exports.sendContactMail = onRequest(app);
