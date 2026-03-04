import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import type { RuleLocation } from '../types.js';

export function findWorkspaceRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, '.claude'))) {
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

export function getConfigPath(location: RuleLocation): string {
  if (location === 'user') {
    return join(homedir(), '.claude', 'ccr.json');
  }
  const root = findWorkspaceRoot() ?? process.cwd();
  return join(root, '.claude', 'ccr.json');
}
