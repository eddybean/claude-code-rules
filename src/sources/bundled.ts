import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Rule } from '../types.js';
import { parseFrontmatter } from '../utils/frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getBundledRulesDir(): string {
  // dist/cli.js から実行時: dist/../rules
  // src/cli.ts から実行時: src/../rules
  const candidates = [join(__dirname, '..', 'rules'), join(__dirname, '..', '..', 'rules')];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

export function listBundledRules(): Rule[] {
  const dir = getBundledRulesDir();
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

export function getBundledRule(name: string): Rule | undefined {
  const dir = getBundledRulesDir();
  const filename = name.endsWith('.md') ? name : `${name}.md`;
  const filepath = join(dir, filename);
  if (!existsSync(filepath)) return undefined;

  const content = readFileSync(filepath, 'utf-8');
  const { paths, body } = parseFrontmatter(content);
  return {
    name: basename(filename, '.md'),
    filename,
    content: body,
    paths,
  };
}
