import { t } from '../i18n/index.js';
import type { GitHubFileContent, GitHubFileEntry, Rule } from '../types.js';
import { parseFrontmatter } from '../utils/frontmatter.js';

class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

async function githubFetch<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'claude-code-rules',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (res.status === 401) {
    throw new GitHubApiError(401, t('github.unauthorized'));
  }
  if (res.status === 403) {
    throw new GitHubApiError(403, t('github.rateLimited'));
  }
  if (!res.ok) {
    throw new GitHubApiError(res.status, `${t('github.apiError')} ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function fetchRulesFromPath(owner: string, repo: string, rulesPath: string): Promise<Rule[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${rulesPath}`;

  let entries: GitHubFileEntry[];
  try {
    entries = await githubFetch<GitHubFileEntry[]>(apiUrl);
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) {
      return [];
    }
    throw err;
  }

  const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));

  const rules: Rule[] = [];
  for (const file of mdFiles) {
    try {
      const fileData = await githubFetch<GitHubFileContent>(file.url);
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const { paths, body } = parseFrontmatter(content);
      rules.push({
        name: file.name.replace(/\.md$/, ''),
        filename: file.name,
        content: body,
        paths,
      });
    } catch {
      // 個別ファイルの取得失敗はスキップ
    }
  }
  return rules;
}

export async function listGithubRules(repoUrl: string): Promise<Rule[]> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) throw new Error(`${t('github.invalidUrl')} ${repoUrl}`);

  const { owner, repo } = parsed;

  // rules/ と .claude/rules/ の両方を探索してマージ（重複はfilenameで除去）
  const [fromRules, fromClaudeRules] = await Promise.all([
    fetchRulesFromPath(owner, repo, 'rules'),
    fetchRulesFromPath(owner, repo, '.claude/rules'),
  ]);

  const seen = new Set<string>();
  const merged: Rule[] = [];
  for (const rule of [...fromRules, ...fromClaudeRules]) {
    if (!seen.has(rule.filename)) {
      seen.add(rule.filename);
      merged.push(rule);
    }
  }
  return merged;
}

export async function fetchGithubRule(
  repoUrl: string,
  filename: string,
): Promise<Rule | undefined> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) throw new Error(`${t('github.invalidUrl')} ${repoUrl}`);

  const { owner, repo } = parsed;

  // rules/ → .claude/rules/ の順に試す
  for (const rulesPath of ['rules', '.claude/rules']) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${rulesPath}/${filename}`;
    try {
      const fileData = await githubFetch<GitHubFileContent>(apiUrl);
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const { paths, body } = parseFrontmatter(content);
      return {
        name: filename.replace(/\.md$/, ''),
        filename,
        content: body,
        paths,
      };
    } catch {
      // 次のパスを試す
    }
  }
  return undefined;
}

export function isGithubUrl(url: string): boolean {
  return /^https?:\/\/github\.com\//.test(url);
}
