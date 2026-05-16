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
