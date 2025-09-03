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
    const bucketName = bucket.name; // resolve actual default bucket name
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

// Resolve product image (e.g., Amazon) by reading Open Graph/Twitter meta
app.post('/resolveProductImage', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'invalid_url' });
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';
    async function fetchHtml(u) {
      return axios.get(u, {
        timeout: 12000,
        maxRedirects: 5,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        validateStatus: (s) => s >= 200 && s < 400,
      });
    }

    let resp;
    try { resp = await fetchHtml(url); } catch (e) { resp = null; }
    let html = String(resp?.data || '');
    const base = new URL(url);
    const pick = (...arr) => arr.find(v => v && String(v).trim().length);
    const m = (re) => { const r = re.exec(html); return r && r[1] ? r[1].trim() : null; };
    const decode = (s) => {
      if (!s) return s;
      let out = String(s)
        .replace(/&quot;/g,'"')
        .replace(/&#34;/g,'"')
        .replace(/&#39;/g,"'")
        .replace(/&apos;/g,"'")
        .replace(/&amp;/g,'&')
        .replace(/&lt;/g,'<')
        .replace(/&gt;/g,'>')
        .replace(/&nbsp;/g,' ');
      // Numeric entities
      out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
        try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; }
      });
      out = out.replace(/&#(\d+);/g, (_, d) => {
        try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; }
      });
      return out;
    };

    // Common OG/Twitter image tags
    const ogImage = m(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    m(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    m(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                    m(/<img[^>]+id=["']landingImage["'][^>]*src=["']([^"']+)["'][^>]*>/i);

    // Amazon-specific fallbacks
    const oldHires = m(/<img[^>]+id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["'][^>]*>/i);
    let dynAttr = m(/<img[^>]+id=["']landingImage["'][^>]*data-a-dynamic-image=["']([^"']+)["'][^>]*>/i);
    let dynUrl = null;
    if (dynAttr) {
      try {
        const parsed = JSON.parse(decode(dynAttr));
        const keys = Object.keys(parsed);
        if (keys.length) dynUrl = keys[0];
      } catch (_) {
        try {
          // Sometimes single quotes are used – try to coerce
          const fixed = decode(dynAttr).replace(/'/g,'"');
          const parsed = JSON.parse(fixed);
          const keys = Object.keys(parsed);
          if (keys.length) dynUrl = keys[0];
        } catch {}
      }
    }

    // Try JSON-inlined fields often present on Amazon pages
    const hiRes = m(/"hiRes"\s*:\s*"(https?:[^"]+)"/i);
    const large = m(/"large"\s*:\s*"(https?:[^"]+)"/i);
    const mainUrl = m(/"mainUrl"\s*:\s*"(https?:[^"]+)"/i);
    // Direct m.media.amazon link inside HTML (take the first plausible)
    let mediaMatch = null;
    try {
      const re = /https?:\/\/m\.media\.amazon\.com\/images\/I\/[A-Za-z0-9._%\-]+\.(?:jpg|jpeg|png)/ig;
      const all = [];
      for (let r; (r = re.exec(html)); ) all.push(r[0]);
      if (all.length) mediaMatch = all[0];
    } catch(_) {}

    let chosen = pick(ogImage, oldHires, dynUrl, hiRes, large, mainUrl, mediaMatch);

    // If nothing found or request failed, try mobile domain fallback for Amazon
    const host = base.hostname;
    const isAmazon = /(^|\.)amazon\./i.test(host) || /(^|\.)a\.co$/i.test(host);
    if ((!chosen || !resp) && isAmazon) {
      try {
        const mobile = new URL(url);
        // replace www. with m.
        if (/^www\./i.test(mobile.hostname)) mobile.hostname = mobile.hostname.replace(/^www\./i, 'm.');
        else if (!/^m\./i.test(mobile.hostname)) mobile.hostname = 'm.' + mobile.hostname;
        const mResp = await fetchHtml(mobile.toString());
        html = String(mResp.data || '');
        const mOg = m(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        const mOld = m(/<img[^>]+data-old-hires=["']([^"']+)["'][^>]*>/i);
        let mDynAttr = m(/data-a-dynamic-image=["']([^"']+)["']/i);
        let mDyn = null;
        if (mDynAttr) {
          try { const p = JSON.parse(decode(mDynAttr)); const ks = Object.keys(p); if (ks.length) mDyn = ks[0]; } catch {}
        }
        // also scan for direct media links again
        if (!mDyn) {
          try {
            const re = /https?:\/\/m\.media\.amazon\.com\/images\/I\/[A-Za-z0-9._%\-]+\.(?:jpg|jpeg|png)/ig;
            const all = [];
            for (let r; (r = re.exec(html)); ) all.push(r[0]);
            if (all.length && !mediaMatch) mediaMatch = all[0];
          } catch(_) {}
        }
        chosen = pick(chosen, mOg, mOld, mDyn, mediaMatch);
      } catch (_) {}
    }

    // Last resort: readability proxy (best-effort), then scan for m.media-amazon.com URLs
    if (!chosen && isAmazon) {
      try {
        const proxyUrl = `https://r.jina.ai/http://${base.hostname}${base.pathname}${base.search}`;
        const proxy = await axios.get(proxyUrl, { timeout: 12000 });
        const text = String(proxy.data || '');
        const r = /https?:\/\/m\.media\.amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.(?:jpg|jpeg|png)/i.exec(text);
        if (r) chosen = r[0];
      } catch (_) {}
    }
    if (!chosen) return res.status(404).json({ error: 'image_not_found' });
    const abs = new URL(chosen, base).toString();
    const ogTitle = m(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    m(/<title[^>]*>([^<]+)<\/title>/i);
    const ogDesc  = m(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    m(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    return res.json({ imageUrl: abs, title: ogTitle ? decode(ogTitle) : null, description: ogDesc ? decode(ogDesc) : null });
  } catch (e) {
    console.error('resolveProductImage error', e?.response?.status, e?.message);
    return res.status(500).json({ error: 'resolve_failed', message: e?.message || String(e), status: e?.response?.status || null });
  }
});

// Import an external image URL into Firebase Storage and return a download URL
app.post('/importImageToStorage', async (req, res) => {
  try {
    const { imageUrl, filename } = req.body || {};
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return res.status(400).json({ error: 'invalid_image_url' });
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';
    const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000, maxRedirects: 5, headers: { 'User-Agent': UA } });
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
    await file.save(buffer, { metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } }, resumable: false, validation: false });
    const gsUrl = `gs://${bucketName}/${objectPath}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return res.json({ gsUrl, downloadUrl, path: objectPath });
  } catch (e) {
    console.error('importImageToStorage error', e);
    return res.status(500).json({ error: 'import_failed', message: e?.message || String(e) });
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
          try {
            const bucket = getStorage().bucket();
            const bucketName = bucket.name;
            const u = new URL(imgUrl);
            if (u.hostname === 'firebasestorage.googleapis.com') {
              const parts = u.pathname.split('/');
              const bIndex = parts.indexOf('b');
              if (bIndex > -1 && parts[bIndex + 1] && parts[bIndex + 1] !== bucketName) {
                parts[bIndex + 1] = bucketName;
                u.pathname = parts.join('/');
                giftImage = u.toString();
              } else {
                giftImage = imgUrl;
              }
            } else {
              giftImage = imgUrl;
            }
          } catch {
            giftImage = imgUrl;
          }
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
