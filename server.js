
/**
 * Peculiar — personalized backend template
 * Owner: Okibe Prince Daniel Onyekachi
 * Bank: Fidelity / Account: 6151892195
 *
 * IMPORTANT: fill the PAYSTACK_SECRET_KEY and Firebase service account JSON in your host environment.
 */

const express = require('express');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }));
app.use(bodyParser.urlencoded({ extended: true }));

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
const db = admin.firestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_replace';
const PECULIAR_OWNER_ID = 'owner_6151892195';
const PECULIAR_ADMIN_SECRET = process.env.PECULIAR_ADMIN_SECRET || 'peculiar-admin-2025!';

async function verifyTransaction(reference){
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
  });
  if(!res.ok) throw new Error('Paystack verification failed');
  const data = await res.json();
  return data;
}

app.post('/webhook/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.rawBody).digest('hex');
  if(signature !== expected){
    console.warn('Invalid paystack signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;
  try {
    if(event.event === 'charge.success' || event.event === 'transfer.success'){
      const reference = event.data.reference;
      const verified = await verifyTransaction(reference);
      if(verified.data.status === 'success'){
        const amountNaira = verified.data.amount / 100;
        const ownerRef = db.collection('wallets').doc(PECULIAR_OWNER_ID);
        await db.runTransaction(async (t) => {
          const snap = await t.get(ownerRef);
          const prev = snap.exists ? (snap.data().balance || 0) : 0;
          const newBal = prev + amountNaira;
          t.set(ownerRef, { balance: newBal }, { merge: true });
        });
        await db.collection('payments').add({ reference: verified.data.reference, amount: amountNaira, channel: verified.data.channel, paid_at: verified.data.paid_at || new Date().toISOString() });
      }
    }
  } catch (err){
    console.error('Webhook handling error', err);
  }
  res.sendStatus(200);
});

app.post('/owner/payout', express.json(), async (req, res) => {
  const { adminSecret, amount, bankCode, accountNumber, recipientName } = req.body;
  if(adminSecret !== PECULIAR_ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
  try {
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nuban', name: recipientName || 'Owner', account_number: accountNumber, bank_code: bankCode, currency: 'NGN' })
    });
    const recipientJson = await recipientRes.json();
    if(!recipientJson.status) return res.status(400).json({ error: 'Recipient creation failed', details: recipientJson });
    const recipientCode = recipientJson.data.recipient_code;
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Math.round(amount*100), recipient: recipientCode, reason: 'Owner payout' })
    });
    const transferJson = await transferRes.json();
    if(!transferJson.status) return res.status(400).json({ error: 'Transfer failed', details: transferJson });
    const ownerRef = db.collection('wallets').doc(PECULIAR_OWNER_ID);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ownerRef);
      const prev = snap.exists ? (snap.data().balance || 0) : 0;
      if(prev < amount) throw new Error('Insufficient balance');
      t.set(ownerRef, { balance: prev - amount }, { merge: true });
    });
    await db.collection('payouts').add({ amount, recipient: recipientJson.data, transfer: transferJson.data, createdAt: new Date().toISOString() });
    return res.json({ ok: true, transfer: transferJson.data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('Peculiar backend listening on', PORT));
