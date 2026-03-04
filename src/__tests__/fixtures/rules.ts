import type { GitHubFileContent, GitHubFileEntry, Rule } from '../../types.js';

export const FIXTURE_RULES: Rule[] = [
  {
    name: 'typescript',
    filename: 'typescript.md',
    content: '# TypeScript Rules\n\nUse strict mode.',
    paths: undefined,
  },
  {
    name: 'react',
    filename: 'react.md',
    content: '# React Rules\n\nUse functional components.',
    paths: 'src/components/**',
  },
  {
    name: 'testing',
    filename: 'testing.md',
    content: '# Testing Rules\n\nAAA pattern.',
    paths: undefined,
  },
];

export const FIXTURE_RULE_WITH_PATHS: Rule = {
  name: 'backend',
  filename: 'backend.md',
  content: '# Backend Rules',
  paths: 'src/backend/**',
};

/** paths フィルター付きのルール Markdown 文字列 */
export const FIXTURE_MD_WITH_PATHS =
  '---\npaths: "src/backend/**"\n---\n# Backend Rules\n\nContent here.';

/** フロントマターなしのルール Markdown 文字列 */
export const FIXTURE_MD_NO_PATHS = '# Simple Rule\n\nContent here.';

/** GitHub API: ディレクトリエントリのフィクスチャ */
export const FIXTURE_GITHUB_DIR_ENTRIES: GitHubFileEntry[] = [
  {
    name: 'typescript.md',
    path: 'rules/typescript.md',
    type: 'file',
    download_url: 'https://raw.githubusercontent.com/owner/repo/main/rules/typescript.md',
    url: 'https://api.github.com/repos/owner/repo/contents/rules/typescript.md',
  },
  {
    name: 'react.md',
    path: 'rules/react.md',
    type: 'file',
    download_url: 'https://raw.githubusercontent.com/owner/repo/main/rules/react.md',
    url: 'https://api.github.com/repos/owner/repo/contents/rules/react.md',
  },
  {
    name: 'subdir',
    path: 'rules/subdir',
    type: 'dir',
    download_url: null,
    url: 'https://api.github.com/repos/owner/repo/contents/rules/subdir',
  },
];

/** GitHub API: ファイルコンテンツのフィクスチャ */
export const FIXTURE_GITHUB_FILE_CONTENT: GitHubFileContent = {
  content: Buffer.from('# TypeScript Rules\n\nUse strict mode.').toString('base64'),
  encoding: 'base64',
};
