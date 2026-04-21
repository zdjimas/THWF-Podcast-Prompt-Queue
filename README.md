# Jellypod Prompt Queue — Zero Cost Static Version

A zero-cost, single-page prompt queue for GitHub Pages.

## What it does
- One **admin code** unlocks both prompt submission and admin view
- New submissions are stored as **Pending**
- Admin can:
  - mark entries **Complete**
  - move entries back to **Pending**
  - **delete** entries
- Queue data is stored **locally in the browser**
- You can **export** and **import** an **encrypted backup file**

## Important limitation
This is a **fully static** GitHub Pages app.

That means:
- it does **not** use Fly.io
- it does **not** use a backend
- it does **not** create a live shared queue for multiple people automatically

If 3 people use this site on 3 different browsers, each browser has its own local queue **unless you export and import the encrypted backup file**.

## Files
- `index.html` — the full application
- `README.md` — setup and publish instructions
- `.gitignore` — ignores OS artifacts

## Publish on GitHub Pages
1. Create a new GitHub repository.
2. Upload these files to the repository root.
3. In GitHub, go to **Settings → Pages**.
4. Set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Save and wait for the site to publish.

## Default admin code
The starter admin code in `index.html` is:

`ChangeMeNow123!`

Change it before publishing.

## How to change the admin code
Inside `index.html`, find:

```js
const ADMIN_CODE_HASH = '...';
```

Replace it with the SHA-256 hash of your own code.

### Generate a SHA-256 hash on Mac or Linux
```bash
printf "YourNewAdminCodeHere" | shasum -a 256
```

### Generate a SHA-256 hash in PowerShell
```powershell
$input = "YourNewAdminCodeHere"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($input)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
-join ($hash | ForEach-Object { $_.ToString("x2") })
```

Copy the resulting hash into `ADMIN_CODE_HASH`.

## Removing Fly.io from your old setup
You no longer need:
- `server.js`
- `Dockerfile`
- `fly.toml`
- Fly.io deployment
- API secrets for submit/admin routes

## Honest recommendation
Use this version if you want:
- zero hosting cost
- no backend maintenance
- simple personal or very small trusted use

If you later want a **shared live queue** for multiple people, the lightest next step is a free-tier backend such as **Cloudflare Workers + KV**.
