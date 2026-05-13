import crypto from 'crypto';
import { requireAdmin } from './admin-auth.js';

const OWNER = process.env.GITHUB_OWNER || 'LINKUOJUNG';
const REPO = process.env.GITHUB_REPO || 'ai-toys-hub';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const DATA_PATH = 'assets/data/admin-products.json';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function id() {
  return `p_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function originFromReq(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function categoryLabel(cat = 'robot') {
  return ({ robot: '智能機器人', pet: 'AI 智能寵物', steam: 'STEAM 編程', plush: '語音玩偶', drone: '智能飛行', learn: 'AI 學習機' })[cat] || 'AI 玩具';
}

function platformFromUrl(value = '') {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    if (host.includes('shopee')) return 'Shopee';
    if (host.includes('momo')) return 'Momo';
    if (host.includes('pchome')) return 'PChome';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('rakuten')) return 'Rakuten';
    if (host.includes('ruten')) return '露天';
    return host;
  } catch { return 'Affiliate'; }
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  const resp = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || `GitHub API ${resp.status}`);
  return data;
}

async function readProducts() {
  const data = await githubRequest(`contents/${DATA_PATH}?ref=${BRANCH}`);
  const json = Buffer.from(data.content || '', 'base64').toString('utf8') || '[]';
  return { items: JSON.parse(json), sha: data.sha };
}

async function writeProducts(items, sha, message) {
  return githubRequest(`contents/${DATA_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(items, null, 2) + '\n').toString('base64'),
      sha,
      branch: BRANCH,
    }),
  });
}

async function getPreview(req, url) {
  const endpoint = new URL('/api/link-preview', originFromReq(req));
  endpoint.searchParams.set('url', url);
  const resp = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) return {};
  return resp.json().catch(() => ({}));
}

function sanitizeProduct(input, preview = {}) {
  const url = String(input.url || preview.url || '').trim();
  const affiliateUrl = String(input.affiliateUrl || url).trim();
  const title = String(input.title || preview.title || 'AI 玩具商品').trim().slice(0, 180);
  const description = String(input.description || preview.description || '由後台建立的聯盟商品卡片').trim().slice(0, 260);
  const category = String(input.category || 'robot');
  return {
    id: input.id || id(),
    title,
    description,
    image: String(input.image || preview.image || '').trim(),
    url,
    affiliateUrl,
    category,
    categoryLabel: categoryLabel(category),
    platform: String(input.platform || platformFromUrl(affiliateUrl || url)),
    source: String(input.source || preview.source || 'admin').slice(0, 80),
    price: String(input.price || '').trim(),
    oldPrice: String(input.oldPrice || '').trim(),
    badge: String(input.badge || '後台新增').trim().slice(0, 12),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { items } = await readProducts();
      return res.status(200).json({ items });
    }

    const body = parseBody(req);
    const { items, sha } = await readProducts();

    if (req.method === 'POST') {
      if (!body.url) return res.status(400).json({ error: 'Missing url' });
      const preview = await getPreview(req, body.url);
      const product = sanitizeProduct(body, preview);
      const next = [product, ...items.filter(item => item.id !== product.id)];
      await writeProducts(next, sha, `chore: add admin product ${product.id}`);
      return res.status(200).json({ ok: true, product });
    }

    if (req.method === 'PUT') {
      if (!body.id) return res.status(400).json({ error: 'Missing id' });
      const next = items.map(item => item.id === body.id ? sanitizeProduct({ ...item, ...body }, item) : item);
      await writeProducts(next, sha, `chore: update admin product ${body.id}`);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!body.id) return res.status(400).json({ error: 'Missing id' });
      const next = items.filter(item => item.id !== body.id);
      await writeProducts(next, sha, `chore: delete admin product ${body.id}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
