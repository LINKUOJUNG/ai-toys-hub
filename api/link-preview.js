const ALLOWED_HOSTS = [
  'shopee.tw',
  's.shopee.tw',
  'momoshop.com.tw',
  '24h.pchome.com.tw',
  'pchome.com.tw',
  'shopping.pchome.com.tw',
  'ruten.com.tw',
  'rakuten.com.tw',
  'amazon.com',
  'amazon.co.jp',
  'energizelab.com',
  'petoi.com',
  'lego.com',
  'makeblock.com',
  'dji.com',
  'sony.com'
];

const USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Twitterbot/1.0',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'Mozilla/5.0 (compatible; linepagebot/1.0; +https://line.me)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
];

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function getMeta(html, attr, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']{2,})["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']{2,})["'][^>]+${attr}=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }
  return '';
}

function toAbsoluteUrl(value, baseUrl) {
  if (!value) return '';
  try {
    return new URL(decodeHtml(value), baseUrl).toString();
  } catch {
    return '';
  }
}

function pickJsonLdImage(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return pickJsonLdImage(value[0]);
  if (typeof value === 'object') return value.url || value.contentUrl || '';
  return '';
}

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(script[1]));
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] || [])];
      for (const node of nodes) {
        const image = pickJsonLdImage(node.image);
        if (image || node.name || node.description) {
          return {
            title: node.name || '',
            description: node.description || '',
            image
          };
        }
      }
    } catch {}
  }
  return { title: '', description: '', image: '' };
}

function extractPreview(html, baseUrl) {
  const jsonLd = extractJsonLd(html);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = getMeta(html, 'property', 'og:title')
    || getMeta(html, 'name', 'twitter:title')
    || jsonLd.title
    || decodeHtml(titleTag?.[1] || '');
  const description = getMeta(html, 'property', 'og:description')
    || getMeta(html, 'name', 'description')
    || getMeta(html, 'name', 'twitter:description')
    || jsonLd.description;
  const image = getMeta(html, 'property', 'og:image:secure_url')
    || getMeta(html, 'property', 'og:image')
    || getMeta(html, 'name', 'twitter:image')
    || jsonLd.image
    || (html.match(/https:\/\/[^"'\s<>]+(?:susercontent|shopee|pchome|momoshop)[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/i)?.[0] || '');

  return {
    title: decodeHtml(title).slice(0, 180),
    description: decodeHtml(description).slice(0, 260),
    image: toAbsoluteUrl(image, baseUrl)
  };
}

async function fetchWithTimeout(url, ua) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/html')) return null;
    const html = await response.text();
    return { html, finalUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!rawUrl) return res.status(400).json({ error: 'Missing url' });

  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (!['https:', 'http:'].includes(target.protocol)) {
    return res.status(400).json({ error: 'Only http/https URLs are supported' });
  }
  if (!isAllowedHost(target.hostname)) {
    return res.status(400).json({ error: 'Host is not in the affiliate preview allowlist' });
  }

  for (const ua of USER_AGENTS) {
    try {
      const fetched = await fetchWithTimeout(target.toString(), ua);
      if (!fetched) continue;
      const preview = extractPreview(fetched.html, fetched.finalUrl || target.toString());
      if (preview.image || preview.title || preview.description) {
        return res.status(200).json({
          ...preview,
          url: target.toString(),
          finalUrl: fetched.finalUrl || target.toString(),
          source: new URL(fetched.finalUrl || target.toString()).hostname
        });
      }
    } catch {}
  }

  return res.status(200).json({
    title: '',
    description: '',
    image: '',
    url: target.toString(),
    finalUrl: target.toString(),
    source: target.hostname
  });
}
