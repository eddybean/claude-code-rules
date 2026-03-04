export interface Rule {
  name: string;      // ファイル名（拡張子なし）
  filename: string;  // ファイル名（.md 付き）
  content: string;   // フロントマター除去後の本文
  paths?: string;    // paths フィルター（省略可）
}

export interface InstalledRule {
  source: 'bundled' | string; // 'bundled' or GitHub URL
  installedAt: string;        // ISO8601
}

export interface CcrConfig {
  rules: Record<string, InstalledRule>;
}

export type RuleLocation = 'workspace' | 'user';

export interface GitHubFileEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  url: string;
}

export interface GitHubFileContent {
  content: string;   // base64 encoded
  encoding: string;
}

export interface AddOptions {
  path?: string;
  source?: string;
  user?: boolean;
}
