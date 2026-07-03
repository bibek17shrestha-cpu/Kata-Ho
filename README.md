# Saathi Sawaari — Community Ride Board

A no-money ride board: people post a spare seat ("offer") or a ride they need
("request"), with from/to, date, time, and how to reach them. No payments,
no accounts — just a shared board.

## What's inside

```
ride-board/
├── server.js        # Express server + small JSON-file API
├── package.json
├── data/
│   └── rides.json   # where posts are stored (created automatically)
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

Storage is a plain JSON file on disk (`data/rides.json`) — no database to set
up. It's fine for a friend-group board. If you outgrow it later, swap the
`readRides`/`writeRides` functions in `server.js` for a real database.

## Run it locally

You need [Node.js](https://nodejs.org) 18 or newer installed.

```bash
cd ride-board
npm install
npm start
```

Then open **http://localhost:3000**.

## Deploy it to your own domain

Any host that runs Node.js works. Two easy free/cheap options:

### Option A: Render.com
1. Push this folder to a GitHub repo.
2. On [render.com](https://render.com), click **New → Web Service**, connect
   the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Once it's live, go to your domain registrar and add a **CNAME record**
   pointing your domain (or a subdomain like `rides.yourdomain.com`) at the
   `.onrender.com` address Render gives you. Add the custom domain in
   Render's dashboard too.

### Option B: Railway.app
1. Push to GitHub, then on [railway.app](https://railway.app) choose
   **New Project → Deploy from GitHub repo**.
2. Railway auto-detects Node and runs `npm start`.
3. In the project's **Settings → Domains**, add your custom domain and
   follow the CNAME instructions shown there.

### Option C: Your own VPS (DigitalOcean, Linode, etc.)
1. Install Node.js on the server, copy this folder over (`scp` or `git clone`).
2. `npm install`, then run it persistently with a process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name ride-board
   pm2 save
   ```
3. Put [nginx](https://nginx.org) in front as a reverse proxy on port 80/443,
   and use [Certbot](https://certbot.eff.org) for a free HTTPS certificate.
4. Point your domain's **A record** at the server's IP address.

## A note on data

- `data/rides.json` lives on whatever server you deploy to. Back it up if the
  board matters to you — some hosts (like Render's free tier) wipe the disk
  on redeploy. If that's a problem, ask me to switch storage to a real
  database (e.g. SQLite file with a persistent volume, or Postgres).
- There's no login system. Anyone can post, connect, or remove any post —
  this keeps things simple for a trusted friend group, but isn't meant for
  a public, open-to-strangers audience.

## Customizing

- Colors, fonts, and the trail illustration live in `public/styles.css` and
  inline SVGs in `public/index.html` / `app.js`.
- Copy text (headline, subhead, footer) is in `public/index.html`.
