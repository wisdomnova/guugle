export interface SocialSignal {
  signal: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface SocialSnapshot {
  website: string | null;
  signals: SocialSignal[];
}

export function buildWebPresenceSnapshot(website?: string): SocialSnapshot {
  const url = website?.trim() || null;
  const signals: SocialSignal[] = [];

  if (!url) {
    signals.push({
      signal: 'No official website linked',
      severity: 'medium',
      evidence: 'CoinGecko did not list a project homepage for this token',
    });
  } else {
    signals.push({
      signal: 'Official website linked',
      severity: 'low',
      evidence: url,
    });
  }

  return { website: url, signals };
}
