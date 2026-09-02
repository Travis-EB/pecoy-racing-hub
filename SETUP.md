# PeCoy Racing Hub — Setup Guide

The hub is a plain static website — no build tools needed. It works two ways:

- **Offline mode (right now):** open `index.html` and everything works, but chat,
  fuel logs, hotels, and pit plans only save to *your* device.
- **Team mode:** connect Firebase (free) and deploy the site to a public URL —
  then everyone sees the same chat, fuel log, pit plan, and hotel info in real time.

Do Part 1, then Part 2. About 15 minutes total.

---

## Part 1 — Connect Firebase (makes it a *team* hub)

1. Go to **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** → name it `pecoy-racing-hub` → you can turn OFF
   Google Analytics → **Create project**.
3. On the project home page, click the **`</>` (Web)** icon to add a web app.
   - Nickname: `hub` → **Register app** (skip Firebase Hosting checkbox).
   - It shows a code block containing `const firebaseConfig = { ... }`.
   - **Copy just the `{ ... }` part.**
4. Open `js/firebase-config.js` in Notepad and replace the last line:

   ```js
   window.FIREBASE_CONFIG = null;
   ```

   with (pasting YOUR values):

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "pecoy-racing-hub.firebaseapp.com",
     projectId: "pecoy-racing-hub",
     storageBucket: "pecoy-racing-hub.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```

5. Back in the Firebase console: left sidebar → **Build → Firestore Database**
   → **Create database** → pick location `us-west1` (closest to Baja) →
   **Start in production mode** → Create.
6. Go to the **Rules** tab of Firestore and replace everything with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Team hub collections — open read/write (link is shared team-only)
       match /chat/{doc}      { allow read, write: if true; }
       match /notices/{doc}   { allow read, write: if true; }
       match /docs/{doc}      { allow read, write: if true; }
       match /fuel_baja400/{doc}   { allow read, write: if true; }
       match /fuel_baja1000/{doc}  { allow read, write: if true; }
       match /fuel_practice/{doc}  { allow read, write: if true; }
       match /hotels_baja400/{doc} { allow read, write: if true; }
       match /hotels_baja1000/{doc}{ allow read, write: if true; }
     }
   }
   ```

   Click **Publish**.

> Note: these rules let anyone who has the site URL read/write hub data.
> The site has a client-side team password gate (ask Travis for the password;
> hash lives in js/app.js — to change the password, hash the new one with
> SHA-256 and replace PASS_HASH). The gate stops casual visitors; it is not
> cryptographic security, so still keep the URL within the team.

---

## Part 2 — Put the site online

### Option A: Netlify Drop (easiest — 2 minutes, no account needed to start)

1. Go to **https://app.netlify.com/drop**
2. Drag the whole **`PeCoy Racing Hub`** folder onto the page.
3. It gives you a URL like `https://something-random.netlify.app` — that's the hub.
   Create a free account to keep the site permanently and rename it, e.g.
   `pecoyracing.netlify.app` (Site settings → Change site name).
4. Text the URL to the team. Done.

**To update later** (new GPS files, config changes): drag the folder onto
your site's **Deploys** page again. Newest drag wins.

### Option B: GitHub Pages

1. Create a repo, push this folder's contents to it.
2. Repo → Settings → Pages → Deploy from branch → `main` / root.
3. Site appears at `https://<you>.github.io/<repo>/`.

### Option C: Vercel

1. **https://vercel.com/new** → import the folder/repo → deploy (zero config).

---

## Smoke test (after both parts)

1. Open the site URL on your phone AND your computer.
2. Footer should say **"● team sync on"** on both.
3. Send a chat message from the phone → it should appear on the computer within a second.
4. Log a test pit in Fuel Calc (race: *Practice / Test*) on one device → appears on the other.
5. Delete the test entries. You're race-ready. 🏁

## Ongoing updates

| What | How |
|---|---|
| Hotel info | Hotels tab → "+ Add hotel" (syncs instantly, no redeploy) |
| Pit plan | Pit Strategy tab → edit → Save Plan (syncs instantly) |
| Points standings | Season tab → Edit → type points → Save (syncs instantly) |
| GPS files | Add file to `gps/`, list it in `gps/manifest.json`, redeploy |
| Stream links | Already permanent (@pecoyracing6134 + SCORE) |
