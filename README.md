# THWF Shared Queue v2

This package updates the shared GitHub Pages + Cloudflare Worker version with:

1. **Podcast Prompt Queue** enhancements
   - Adds optional **Host Names** field
   - Max length: **30 characters**

2. **Promotions Tracker** module
   - New top tab in the same `index.html`
   - Uses the **same shared login** and the **same Cloudflare Worker**
   - Shared across users, devices, and refreshes

## Files

- `index.html` — replace your current GitHub Pages front end with this
- `cloudflare-worker/worker.js` — replace your existing Cloudflare Worker code with this
- `cloudflare-worker/wrangler.toml` — sample Wrangler config

## Podcast prompt fields

- Title
- Host Names *(optional, max 30 chars)*
- Prompt

## Promotions tracker fields

- Promotion Platform
- Date
- Video Title
- Paid by

## Shared behavior

Both tabs:
- use the **same login code**
- store data remotely in Cloudflare KV
- support **pending / complete / delete** per record
- show the same records to all users after refresh

## Front-end update

In `index.html`, set:

```js
const API_BASE = 'https://YOUR-WORKER.workers.dev';
```

## Worker setup

In Cloudflare:

1. Replace your current Worker code with `cloudflare-worker/worker.js`
2. Bind your existing KV namespace to `QUEUE_KV`
3. Set secret:
   - `ADMIN_CODE`
4. Set variable:
   - `FRONTEND_ORIGIN` = `https://zdjimas.github.io`
     or, if you want to be more specific,
   - `https://zdjimas.github.io/THWF-Podcast-Prompt-Queue`

## Important CORS note

If you use `FRONTEND_ORIGIN`, prefer this value:

```text
https://zdjimas.github.io
```

That is the true browser origin for GitHub Pages project sites.

## Deployment order

1. Update the Worker in Cloudflare and deploy it
2. Copy the Worker URL
3. Update `index.html` with the Worker URL
4. Commit `index.html` to GitHub
5. Refresh the site
