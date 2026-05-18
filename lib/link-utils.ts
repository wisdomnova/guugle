export function normalizeUrl(raw: string | undefined | null): string {
  const t = raw?.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

export function pickWebsite(homepages: unknown): string {
  if (!Array.isArray(homepages)) return '';
  for (const entry of homepages) {
    const url = normalizeUrl(typeof entry === 'string' ? entry : '');
    if (url && !url.includes('undefined')) return url;
  }
  return '';
}

function twitterHandleFromUrls(items: unknown): string {
  if (!Array.isArray(items)) return '';
  for (const raw of items) {
    if (typeof raw !== 'string') continue;
    const match = raw.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/i);
    if (match?.[1] && !['home', 'intent', 'share'].includes(match[1].toLowerCase())) {
      return match[1];
    }
  }
  return '';
}

export function pickTwitterHandle(links: Record<string, unknown> | undefined): string {
  if (!links) return '';
  const raw =
    links.twitter_screen_name ??
    links.twitter_screen_handle ??
    links.twitter_username;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/^@/, '');
  }
  return (
    twitterHandleFromUrls(links.chat_url) ||
    twitterHandleFromUrls(links.announcement_url) ||
    twitterHandleFromUrls(links.homepage) ||
    ''
  );
}

export function twitterProfileUrl(handle: string): string {
  const h = handle.replace(/^@/, '').trim();
  return h ? `https://x.com/${h}` : '';
}

export function telegramUrl(id: string): string {
  const t = id.trim().replace(/^@/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
  return t ? `https://t.me/${t}` : '';
}
