import {
  normalizeUrl,
  pickTwitterHandle,
  pickWebsite,
  telegramUrl,
  twitterProfileUrl,
} from './link-utils';

export type ProjectLinkKind =
  | 'website'
  | 'x'
  | 'telegram'
  | 'discord'
  | 'reddit'
  | 'github'
  | 'forum'
  | 'docs'
  | 'other';

export interface ProjectLink {
  label: string;
  url: string;
  kind: ProjectLinkKind;
}

function pushUnique(links: ProjectLink[], entry: ProjectLink) {
  if (!entry.url || links.some((l) => l.url === entry.url)) return;
  links.push(entry);
}

function pushUrlList(links: ProjectLink[], items: unknown, label: string, kind: ProjectLinkKind) {
  if (!Array.isArray(items)) return;
  items.forEach((raw, i) => {
    const url = normalizeUrl(typeof raw === 'string' ? raw : '');
    if (url) pushUnique(links, { label: items.length > 1 ? `${label} ${i + 1}` : label, url, kind });
  });
}

export function parseCoinGeckoLinks(links: Record<string, unknown> | undefined): ProjectLink[] {
  if (!links) return [];

  const out: ProjectLink[] = [];

  const website = pickWebsite(links.homepage);
  if (website) pushUnique(out, { label: 'Website', url: website, kind: 'website' });

  const whitepaper = normalizeUrl(
    typeof links.whitepaper === 'string' ? links.whitepaper : ''
  );
  if (whitepaper) pushUnique(out, { label: 'Whitepaper', url: whitepaper, kind: 'docs' });

  pushUrlList(out, links.blockchain_site, 'Explorer', 'other');

  const twitter = pickTwitterHandle(links);
  if (twitter) {
    pushUnique(out, { label: 'X (Twitter)', url: twitterProfileUrl(twitter), kind: 'x' });
  }

  const telegram =
    typeof links.telegram_channel_identifier === 'string'
      ? links.telegram_channel_identifier
      : '';
  if (telegram) {
    pushUnique(out, { label: 'Telegram', url: telegramUrl(telegram), kind: 'telegram' });
  }

  const subreddit = normalizeUrl(
    typeof links.subreddit_url === 'string' ? links.subreddit_url : ''
  );
  if (subreddit) pushUnique(out, { label: 'Reddit', url: subreddit, kind: 'reddit' });

  const facebook =
    typeof links.facebook_username === 'string' ? links.facebook_username.trim() : '';
  if (facebook) {
    pushUnique(out, {
      label: 'Facebook',
      url: facebook.startsWith('http') ? normalizeUrl(facebook) : `https://facebook.com/${facebook}`,
      kind: 'other',
    });
  }

  pushUrlList(out, links.chat_url, 'Community', 'discord');
  pushUrlList(out, links.announcement_url, 'Announcements', 'forum');
  pushUrlList(out, links.official_forum_url, 'Forum', 'forum');

  const githubRepos = links.repos_url as { github?: string[] } | undefined;
  if (Array.isArray(githubRepos?.github)) {
    githubRepos.github.forEach((repo) => {
      const url = normalizeUrl(repo);
      if (url) pushUnique(out, { label: 'GitHub', url, kind: 'github' });
    });
  }

  return out;
}

export function mergeProjectLinks(...groups: ProjectLink[][]): ProjectLink[] {
  const out: ProjectLink[] = [];
  for (const group of groups) {
    for (const link of group) {
      pushUnique(out, link);
    }
  }
  return out;
}
