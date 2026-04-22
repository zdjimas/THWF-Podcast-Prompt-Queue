 export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

const PODCAST_KEY = 'thwf_podcast_queue';
const PROMO_KEY = 'thwf_promotions_queue';

function json(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

function getOrigin(request, env) {
  const origin = request.headers.get('Origin') || '*';
  if (!env.FRONTEND_ORIGIN) return origin;
  return origin === env.FRONTEND_ORIGIN ? origin : env.FRONTEND_ORIGIN;
}

async function handleRequest(request, env) {
  const origin = getOrigin(request, env);
  if (request.method === 'OPTIONS') return json({ ok: true }, 200, origin);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');

  try {
    if (path === '/api/health' && request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      requireCode(code, env);
      return json({ ok: true }, 200, origin);
    }

    if (path === '/api/podcast' && request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      requireCode(code, env);
      return json({ ok: true, items: await readList(env, PODCAST_KEY) }, 200, origin);
    }

    if (path === '/api/promotions' && request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      requireCode(code, env);
      return json({ ok: true, items: await readList(env, PROMO_KEY) }, 200, origin);
    }

    if (path === '/api/podcast' && request.method === 'POST') {
      const body = await readBody(request);
      requireCode(body.code, env);

      if (!body.title?.trim() || !body.prompt?.trim()) {
        return json({ ok: false, error: 'Title and prompt are required.' }, 400, origin);
      }

      const hostNames = String(body.hostNames || '').trim();
      if (hostNames.length > 30) {
        return json({ ok: false, error: 'Host Names must be 30 characters or fewer.' }, 400, origin);
      }

      const list = await readList(env, PODCAST_KEY);
      list.unshift({
        id: crypto.randomUUID(),
        title: body.title.trim(),
        hostNames,
        prompt: body.prompt.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null
      });

      await writeList(env, PODCAST_KEY, list);
      return json({ ok: true }, 200, origin);
    }

    // ✅ FIXED PROMOTIONS BLOCK
    if (path === '/api/promotions' && request.method === 'POST') {
      const body = await readBody(request);
      requireCode(body.code, env);

      const platform = String(body.platform || '').trim();
      const date = String(body.date || '').trim();
      const videoTitle = String(body.videoTitle || '').trim();
      const paidBy = String(body.paidBy || '').trim();

      const amount =
        String(body.amount || '').trim() ||
        String(body.promoAmount || '').trim() ||
        String(body.dollarAmount || '').trim();

      if (!platform || !date || !videoTitle || !paidBy || !amount) {
        return json({ ok: false, error: 'All promotion fields are required.' }, 400, origin);
      }

      const list = await readList(env, PROMO_KEY);
      list.unshift({
        id: crypto.randomUUID(),
        platform,
        date,
        videoTitle,
        paidBy,
        amount, // 🔥 THIS IS THE FIX
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null
      });

      await writeList(env, PROMO_KEY, list);
      return json({ ok: true }, 200, origin);
    }

    if (path === '/api/podcast/completed' && request.method === 'DELETE') {
      const body = await readBody(request);
      requireCode(body.code, env);
      const list = await readList(env, PODCAST_KEY);
      await writeList(env, PODCAST_KEY, list.filter(item => item.status !== 'complete'));
      return json({ ok: true }, 200, origin);
    }

    if (path === '/api/promotions/completed' && request.method === 'DELETE') {
      const body = await readBody(request);
      requireCode(body.code, env);
      const list = await readList(env, PROMO_KEY);
      await writeList(env, PROMO_KEY, list.filter(item => item.status !== 'complete'));
      return json({ ok: true }, 200, origin);
    }

    const podcastMatch = path.match(/^\/api\/podcast\/([^/]+)(?:\/(complete|pending))?$/);
    if (podcastMatch) {
      return handleItemMutation(request, env, origin, podcastMatch, PODCAST_KEY);
    }

    const promoMatch = path.match(/^\/api\/promotions\/([^/]+)(?:\/(complete|pending))?$/);
    if (promoMatch) {
      return handleItemMutation(request, env, origin, promoMatch, PROMO_KEY);
    }

    return json({ ok: false, error: 'Not found.' }, 404, origin);
  } catch (err) {
    const status = err.status || 500;
    return json({ ok: false, error: err.message || 'Server error.' }, status, origin);
  }
}

async function handleItemMutation(request, env, origin, match, storageKey) {
  const [, id, action] = match;
  const body = await readBody(request);
  requireCode(body.code, env);

  const list = await readList(env, storageKey);
  const idx = list.findIndex(item => item.id === id);
  if (idx === -1) return json({ ok: false, error: 'Item not found.' }, 404, origin);

  if (request.method === 'DELETE' && !action) {
    list.splice(idx, 1);
    await writeList(env, storageKey, list);
    return json({ ok: true }, 200, origin);
  }

  if (request.method === 'POST' && action === 'complete') {
    list[idx].status = 'complete';
    list[idx].completedAt = new Date().toISOString();
    await writeList(env, storageKey, list);
    return json({ ok: true }, 200, origin);
  }

  if (request.method === 'POST' && action === 'pending') {
    list[idx].status = 'pending';
    list[idx].completedAt = null;
    await writeList(env, storageKey, list);
    return json({ ok: true }, 200, origin);
  }

  return json({ ok: false, error: 'Not found.' }, 404, origin);
}

function requireCode(code, env) {
  if (!env.ADMIN_CODE) throw Object.assign(new Error('ADMIN_CODE secret is not configured.'), { status: 500 });
  if (!code || code !== env.ADMIN_CODE) throw Object.assign(new Error('Invalid admin code.'), { status: 401 });
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

async function readList(env, key) {
  const raw = await env.QUEUE_KV.get(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList(env, key, list) {
  await env.QUEUE_KV.put(key, JSON.stringify(list));
}
