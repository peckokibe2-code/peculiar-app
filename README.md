# Peculiar — Starter App (PeculiarStream)

This repo contains a starter frontend (React + Vite) and backend (Node/Express) for *Peculiar* — a video upload platform where all tips/payments go to the owner.

## What you must configure before running

### 1) Firebase
- Create a Firebase project and enable Authentication, Firestore, and Storage.
- Download service account JSON and configure `GOOGLE_APPLICATION_CREDENTIALS` in your environment (for backend).
- Fill `frontend/src/firebaseConfig.example.js` with your Firebase config and rename it to `firebaseConfig.js`.

### 2) Paystack (for Nigeria bank transfers and cards)
- Create a Paystack account and get `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`.
- In Paystack dashboard, enable channels you want (cards, bank transfers).
- Set webhook URL to `https://<your-backend>/webhook/paystack` (use Render/Railway URL).
- Add environment variables to backend host:
  - PAYSTACK_SECRET_KEY
  - PECULIAR_OWNER_ID (Firestore doc id for owner wallet)
  - PECULIAR_ADMIN_SECRET (admin secret for payout endpoint)
  - FIREBASE_STORAGE_BUCKET

### 3) Deploy
- Backend: push `backend/` to a Node host (Render, Railway, etc). `npm install` then `npm start`.
- Frontend: push `frontend/` to Netlify/Vercel/Render static site, or build and serve.

## Notes about bank transfers
- This starter accepts payments via Paystack channels. To accept direct bank transfers, enable the *bank* channel in Paystack or generate unique Paystack bank accounts for customers (advanced).
- Payouts to owners are implemented via Paystack Transfer API (`/owner/payout`).

## Security & Compliance
- Do NOT store secret keys in the frontend.
- Use Paystack webhook signature verification (implemented) and server-side verification (implemented).
- Implement KYC and AML controls before doing real payouts in production.

## What's included
- frontend/: React/Vite starter with an upload UI and tip buttons.
- backend/: Node/Express with Paystack webhook handling and owner payout endpoint.

Good luck! If you want, I can:
- Generate the ZIP for download (already created below).
- Create step-by-step Render deployment guide with prepared render.yaml.
- Walk you through setting environment variables and webhook configuration.
