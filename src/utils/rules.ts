import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import type { Rule, RuleLocation } from '../types.js';
import { buildContent, parseFrontmatter } from './frontmatter.js';
import { getRulesDir } from './paths.js';

export function listRules(location: RuleLocation): Rule[] {
  const dir = getRulesDir(location);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => extname(f) === '.md')
    .map((filename) => {
      const content = readFileSync(join(dir, filename), 'utf-8');
      const { paths, body } = parseFrontmatter(content);
      return {
        name: basename(filename, '.md'),
        filename,
        content: body,
        paths,
      };
    });
}

export function ruleExists(filename: string, location: RuleLocation): boolean {
  return existsSync(join(getRulesDir(location), filename));
}

export function writeRule(
  filename: string,
  body: string,
  paths: string | undefined,
  location: RuleLocation,
): void {
  const dir = getRulesDir(location);
  mkdirSync(dir, { recursive: true });
  const content = buildContent(body, paths);
  writeFileSync(join(dir, filename), content, 'utf-8');
}

export function deleteRule(filename: string, location: RuleLocation): void {
  unlinkSync(join(getRulesDir(location), filename));
}

export function copyRule(filename: string, from: RuleLocation, to: RuleLocation): void {
  const src = join(getRulesDir(from), filename);
  const dest = join(getRulesDir(to), filename);
  mkdirSync(getRulesDir(to), { recursive: true });
  copyFileSync(src, dest);
}

export function moveRule(filename: string, from: RuleLocation, to: RuleLocation): void {
  copyRule(filename, from, to);
  try {
    deleteRule(filename, from);
  } catch (err) {
    // コピー先を削除してロールバック
    try {
      deleteRule(filename, to);
    } catch {
      // ロールバックに失敗しても元のエラーを優先して投げる
    }
    throw err;
  }
}

export function updateRulePaths(
  filename: string,
  location: RuleLocation,
  newPaths: string | undefined,
): void {
  const dir = getRulesDir(location);
  const content = readFileSync(join(dir, filename), 'utf-8');
  const { body } = parseFrontmatter(content);
  writeRule(filename, body, newPaths, location);
}
