# XPR Circles web app

The web app for XPR Circles, built with Next.js (App Router, TypeScript).

## Run locally

```bash
cd web
npm install
npm run dev
```

The app talks to the `artcircles` contract on XPR Network testnet. It has no database and stores no keys. Login is a signed one-time challenge that is never broadcast; the server keeps only a signed session cookie. It never asks for account permission changes. Every action is a transaction the user signs in their own wallet.
