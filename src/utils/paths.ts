import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { RuleLocation } from '../types.js';

export function findWorkspaceRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;
  while (true) {
    const claudePath = join(current, '.claude');
    if (existsSync(claudePath) && statSync(claudePath).isDirectory()) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function getRulesDir(location: RuleLocation): string {
  if (location === 'user') {
    return join(homedir(), '.claude', 'rules');
  }
  const root = findWorkspaceRoot();
  if (!root) {
    // ワークスペースルートが見つからない場合は cwd に .claude/ を作成
    return join(process.cwd(), '.claude', 'rules');
  }
  return join(root, '.claude', 'rules');
}
