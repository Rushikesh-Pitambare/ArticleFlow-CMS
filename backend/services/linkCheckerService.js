const dns = require('dns').promises;
const net = require('net');

const MAX_LINKS_PER_ARTICLE = 20;
const TIMEOUT_MS = 5000;
const USER_AGENT = 'Mozilla/5.0 (compatible; ArticleFlowLinkAudit/1.0)';

function extractLinksFromContent(content) {
  if (!content) return [];

  const links = [];
  const seen = new Set();

  // Markdown links: [text](https://url)
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ text: match[1].trim(), url });
    }
  }

  // Plain URLs not already captured
  const plainRegex = /(https?:\/\/[^\s<>'")]+)/g;
  while ((match = plainRegex.exec(content)) !== null) {
    const url = match[1].trim();
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ text: url, url });
    }
  }

  return links;
}

// Block private/local targets so the server cannot be used to probe internal networks.
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true;
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;
    if (v.startsWith('::ffff:')) {
      const mapped = v.slice(7);
      return net.isIPv4(mapped) ? isPrivateAddress(mapped) : true;
    }
    return false;
  }

  return true;
}

async function isSafeHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false;
  }

  if (net.isIP(host)) return !isPrivateAddress(host);

  const addresses = await dns.lookup(host, { all: true });
  return addresses.every((entry) => !isPrivateAddress(entry.address));
}

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // redirect: 'manual' so a redirect can never lead us to an internal address.
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function checkSingleUrl(url, text) {
  const checkedAt = new Date().toISOString();
  const base = { url, text, checkedAt };

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ...base, status: 0, statusText: 'Invalid URL', isBroken: true, skipped: false };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ...base, status: 0, statusText: 'Skipped: not an http(s) link', isBroken: false, skipped: true };
  }

  try {
    if (!(await isSafeHost(parsed.hostname))) {
      return { ...base, status: 0, statusText: 'Skipped: private or local address', isBroken: false, skipped: true };
    }
  } catch (err) {
    return { ...base, status: 0, statusText: `DNS lookup failed (${err.code || 'error'})`, isBroken: true, skipped: false };
  }

  try {
    let res = await request(url, 'HEAD');
    // Some servers reject HEAD; retry with GET before calling the link broken.
    if (res.status >= 400) res = await request(url, 'GET');

    const isBroken = res.status >= 400;
    return {
      ...base,
      status: res.status,
      statusText: res.statusText || (isBroken ? 'Error' : 'OK'),
      isBroken,
      skipped: false,
    };
  } catch (err) {
    const timedOut = err && err.name === 'AbortError';
    return {
      ...base,
      status: 0,
      statusText: timedOut ? 'Request timed out' : 'Connection failed',
      isBroken: true,
      skipped: false,
    };
  }
}

async function auditArticleLinks(article) {
  const extracted = extractLinksFromContent(article.content).slice(0, MAX_LINKS_PER_ARTICLE);
  const results = await Promise.all(extracted.map((item) => checkSingleUrl(item.url, item.text)));

  return {
    lastAuditedAt: new Date().toISOString(),
    totalLinks: results.length,
    brokenLinksCount: results.filter((link) => link.isBroken).length,
    links: results,
  };
}

module.exports = {
  MAX_LINKS_PER_ARTICLE,
  extractLinksFromContent,
  isPrivateAddress,
  checkSingleUrl,
  auditArticleLinks,
};
