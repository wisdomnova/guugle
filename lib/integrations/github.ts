/**
 * GitHub Integration — development signals for scoring & analysis UI
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubMetrics {
  starCount: number;
  forkCount: number;
  commitCount: number;
  prCount: number;
  issueCount: number;
  contributors: number;
  lastCommitDate: string | null;
  developmentVelocity: number;
  openIssues: number;
  defaultBranch: string;
}

export interface CodeQualitySignals {
  qualityScore: number;
  hasTests: boolean;
  hasDocumentation: boolean;
  licensedCode: boolean;
}

function githubHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

/** Parse owner/repo from https://github.com/owner/repo */
export function parseGitHubRepo(urlOrSlug: string): { owner: string; repo: string } | null {
  const trimmed = urlOrSlug.trim();
  const slugMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] };

  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!urlMatch) return null;
  return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
}

export async function getGitHubMetrics(owner: string, repo: string): Promise<GitHubMetrics | null> {
  try {
    const headers = githubHeaders();

    const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      console.warn('GitHub repo lookup failed:', repoResponse.status, owner, repo);
      return null;
    }

    const repoData = await repoResponse.json();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const [commitsResponse, prResponse, contributorsResponse] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?since=${since}&per_page=100`, { headers }),
      fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&per_page=100`, { headers }),
      fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=100`, { headers }),
    ]);

    const commits = commitsResponse.ok ? await commitsResponse.json() : [];
    const prs = prResponse.ok ? await prResponse.json() : [];
    const contributors = contributorsResponse.ok ? await contributorsResponse.json() : [];

    const lastCommitDate =
      commits.length > 0 && commits[0]?.commit?.author?.date
        ? commits[0].commit.author.date
        : repoData.pushed_at ?? null;

    const developmentVelocity = commits.length / 30;

    return {
      starCount: repoData.stargazers_count ?? 0,
      forkCount: repoData.forks_count ?? 0,
      commitCount: Array.isArray(commits) ? commits.length : 0,
      prCount: Array.isArray(prs) ? prs.length : 0,
      issueCount: repoData.open_issues_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      contributors: Array.isArray(contributors) ? contributors.length : 0,
      lastCommitDate,
      developmentVelocity,
      defaultBranch: repoData.default_branch ?? 'main',
    };
  } catch (error) {
    console.error('GitHub metrics error:', error);
    return null;
  }
}

export async function analyzeCodeQuality(owner: string, repo: string): Promise<CodeQualitySignals> {
  const empty = {
    qualityScore: 0,
    hasTests: false,
    hasDocumentation: false,
    licensedCode: false,
  };

  try {
    const headers = githubHeaders();
    const filesResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents`, { headers });

    if (!filesResponse.ok) return empty;

    const files = await filesResponse.json();
    if (!Array.isArray(files)) return empty;

    const fileNames = files.map((f: { name: string }) => f.name.toLowerCase());

    const hasTests = fileNames.some(
      (f: string) => f.includes('test') || f.includes('spec') || f === 'tests' || f === 'testing'
    );
    const hasDocumentation =
      fileNames.includes('readme.md') || fileNames.includes('docs') || fileNames.includes('documentation');
    const licensedCode =
      fileNames.includes('license') || fileNames.includes('license.md') || fileNames.includes('copying');

    const qualityScore = (hasTests ? 30 : 0) + (hasDocumentation ? 30 : 0) + (licensedCode ? 40 : 0);

    return { qualityScore, hasTests, hasDocumentation, licensedCode };
  } catch (error) {
    console.error('Code quality analysis error:', error);
    return empty;
  }
}

/** 0–100 dev activity score for DB / cards */
export function githubActivityScore(metrics: GitHubMetrics | null, quality: CodeQualitySignals | null): number {
  if (!metrics) return 0;
  const velocityPts = Math.min(35, Math.round(metrics.developmentVelocity * 12));
  const starPts = Math.min(25, Math.round(metrics.starCount / 200));
  const contribPts = Math.min(20, metrics.contributors * 2);
  const qualityPts = quality ? Math.round(quality.qualityScore * 0.2) : 0;
  return Math.min(100, velocityPts + starPts + contribPts + qualityPts);
}
