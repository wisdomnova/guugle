/**
 * GitHub Integration
 * Fetches development signals
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
  lastCommitDate: Date | null;
  developmentVelocity: number;
}

/**
 * Get GitHub repository metrics
 */
export async function getGitHubMetrics(owner: string, repo: string): Promise<GitHubMetrics | null> {
  try {
    if (!GITHUB_TOKEN) {
      console.warn('GitHub API token not configured');
      return null;
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Get repo info
    const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers,
    });

    if (!repoResponse.ok) {
      console.error('GitHub repo lookup failed:', repoResponse.statusText);
      return null;
    }

    const repoData = await repoResponse.json();

    // Get commits from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const commitsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?since=${since}&per_page=100`,
      { headers }
    );

    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    // Get pull requests
    const prResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
      { headers }
    );

    const prs = prResponse.ok ? await prResponse.json() : [];

    // Get issues
    const issuesResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers }
    );

    const issues = issuesResponse.ok ? await issuesResponse.json() : [];

    // Get contributors
    const contributorsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=100`,
      { headers }
    );

    const contributors = contributorsResponse.ok ? await contributorsResponse.json() : [];

    // Get last commit
    let lastCommitDate: Date | null = null;
    if (commits.length > 0) {
      lastCommitDate = new Date(commits[0].commit.author.date);
    }

    // Calculate development velocity (commits per day in last 30 days)
    const developmentVelocity = commits.length / 30;

    return {
      starCount: repoData.stargazers_count,
      forkCount: repoData.forks_count,
      commitCount: commits.length,
      prCount: prs.length,
      issueCount: issues.length,
      contributors: contributors.length,
      lastCommitDate,
      developmentVelocity,
    };
  } catch (error) {
    console.error('GitHub metrics error:', error);
    return null;
  }
}

/**
 * Analyze code quality from repository
 */
export async function analyzeCodeQuality(owner: string, repo: string): Promise<{
  qualityScore: number;
  hasTests: boolean;
  hasDocumentation: boolean;
  licensedCode: boolean;
}> {
  try {
    if (!GITHUB_TOKEN) {
      return {
        qualityScore: 0,
        hasTests: false,
        hasDocumentation: false,
        licensedCode: false,
      };
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const filesResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents`,
      { headers }
    );

    if (!filesResponse.ok) {
      return {
        qualityScore: 0,
        hasTests: false,
        hasDocumentation: false,
        licensedCode: false,
      };
    }

    const files = await filesResponse.json();
    const fileNames = files.map((f: any) => f.name.toLowerCase());

    const hasTests = fileNames.some(
      (f: string) =>
        f.includes('test') ||
        f.includes('spec') ||
        f === 'testing' ||
        f === 'tests'
    );

    const hasDocumentation =
      fileNames.includes('readme.md') ||
      fileNames.includes('docs') ||
      fileNames.includes('documentation');

    const licensedCode =
      fileNames.includes('license') ||
      fileNames.includes('license.md') ||
      fileNames.includes('copying');

    const qualityScore = (hasTests ? 30 : 0) + (hasDocumentation ? 30 : 0) + (licensedCode ? 40 : 0);

    return {
      qualityScore,
      hasTests,
      hasDocumentation,
      licensedCode,
    };
  } catch (error) {
    console.error('Code quality analysis error:', error);
    return {
      qualityScore: 0,
      hasTests: false,
      hasDocumentation: false,
      licensedCode: false,
    };
  }
}
