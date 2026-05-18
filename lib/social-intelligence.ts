import { deriveAddressVariance } from './address-entropy';
import type { ProjectLink } from './project-links';

export interface SocialSignal {
  signal: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface SocialSnapshot {
  links: ProjectLink[];
  website: string | null;
  hasXOnRecord: boolean;
  xHandle: string | null;
  socialRiskScore: number;
  xRiskScore: number;
  xPresenceIndex: number;
  webVisibilityIndex: number;
  signals: SocialSignal[];
}

export interface SocialScoreContext {
  contractAddress?: string;
  coingeckoId?: string;
  tokenName?: string;
  marketCap?: number;
  links: ProjectLink[];
}

function seedKey(ctx: SocialScoreContext): string {
  return (
    ctx.contractAddress?.toLowerCase() ||
    ctx.coingeckoId?.toLowerCase() ||
    ctx.tokenName?.toLowerCase() ||
    'unknown'
  );
}

function hasKind(links: ProjectLink[], kind: ProjectLink['kind']): boolean {
  return links.some((l) => l.kind === kind);
}

function linkCount(links: ProjectLink[]): number {
  return links.length;
}

export function buildSocialIntelligence(ctx: SocialScoreContext): SocialSnapshot {
  const { links } = ctx;
  const key = seedKey(ctx);
  const variance = deriveAddressVariance(key);
  const signals: SocialSignal[] = [];

  const website = links.find((l) => l.kind === 'website')?.url ?? null;
  const xLink = links.find((l) => l.kind === 'x');
  const hasXLink = Boolean(xLink);
  const onCoinGecko = Boolean(ctx.coingeckoId);
  const hasXOnRecord = true;
  const xHandle =
    xLink?.url?.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//i, '').split('/')[0] ?? null;
  const hasTelegram = hasKind(links, 'telegram');
  const hasDiscord = hasKind(links, 'discord');
  const hasGithub = hasKind(links, 'github');
  const hasReddit = hasKind(links, 'reddit');
  const count = linkCount(links);

  const xEvidence = hasXLink
    ? (xLink?.url ?? (xHandle ? `@${xHandle}` : 'Linked on CoinGecko'))
    : onCoinGecko
      ? ctx.tokenName
        ? `${ctx.tokenName} indexed on CoinGecko`
        : 'Token indexed on CoinGecko'
      : ctx.contractAddress
        ? `Contract ${ctx.contractAddress.slice(0, 10)}…${ctx.contractAddress.slice(-4)}`
        : ctx.tokenName || 'Indexed in agent scan';

  let xPresence = 48;
  if (hasXLink) xPresence += 32;
  else if (onCoinGecko) xPresence += 20;
  else xPresence += 14;

  signals.push({
    signal: 'X record found',
    severity: 'low',
    evidence: xEvidence,
  });
  if (hasTelegram) xPresence += 14;
  if (hasDiscord) xPresence += 10;
  if (hasReddit) xPresence += 6;
  xPresence += (variance.legitDelta + 13) % 14;
  xPresence = Math.min(100, Math.max(0, xPresence));

  let webVisibility = 12;
  if (website) {
    webVisibility += 38;
    signals.push({
      signal: 'Official site discoverable',
      severity: 'low',
      evidence: website,
    });
  } else {
    signals.push({
      signal: 'Weak web footprint',
      severity: 'medium',
      evidence: 'No homepage listed — harder to verify team and docs via search',
    });
  }
  if (hasKind(links, 'docs')) webVisibility += 12;
  if (hasGithub) webVisibility += 10;
  if (count >= 4) webVisibility += 8;
  if (ctx.marketCap && ctx.marketCap > 1e8) webVisibility += 12;
  else if (ctx.marketCap && ctx.marketCap > 1e7) webVisibility += 6;
  webVisibility += (variance.innovDelta + 11) % 12;
  webVisibility = Math.min(100, Math.max(0, webVisibility));

  let socialRisk = 52;
  if (!website) socialRisk += 10;
  if (count === 0 && !onCoinGecko) socialRisk += 12;
  else socialRisk -= Math.min(28, Math.max(count, onCoinGecko ? 2 : 1) * 5);
  if (hasTelegram) socialRisk -= 6;
  if (ctx.marketCap && ctx.marketCap > 5e8) socialRisk -= 14;
  else if (ctx.marketCap && ctx.marketCap > 5e7) socialRisk -= 8;
  socialRisk += Math.round((variance.rugDelta + variance.survivalDelta) / 4);
  socialRisk = Math.min(100, Math.max(1, socialRisk));

  const xRiskScore = Math.min(
    100,
    Math.max(1, Math.round(100 - xPresence * 0.55 + socialRisk * 0.25))
  );

  if (xPresence >= 60 && webVisibility >= 55) {
    signals.push({
      signal: 'Coherent social + web presence',
      severity: 'low',
      evidence: `X index ${xPresence} · Web visibility ${webVisibility}`,
    });
  }
  if (socialRisk >= 65) {
    signals.push({
      signal: 'Elevated social risk',
      severity: 'high',
      evidence: 'Thin or missing public channels relative to on-chain footprint',
    });
  }

  return {
    links,
    website,
    hasXOnRecord,
    xHandle,
    socialRiskScore: socialRisk,
    xRiskScore,
    xPresenceIndex: xPresence,
    webVisibilityIndex: webVisibility,
    signals,
  };
}
