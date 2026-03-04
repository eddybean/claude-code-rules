import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * bundled.ts は import.meta.url をモジュールトップレベルで評価して __dirname を確定する。
 * 実際の rules/ ディレクトリを使うハイブリッドアプローチを採用。
 */

describe('listBundledRules', () => {
  let listBundledRules: Awaited<typeof import('../../sources/bundled.js')>['listBundledRules'];

  beforeEach(async () => {
    vi.resetModules();
    ({ listBundledRules } = await import('../../sources/bundled.js'));
  });

  it('実際の rules/ ディレクトリから全ルールを返す', () => {
    const rules = listBundledRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.filename.endsWith('.md'))).toBe(true);
  });

  it('各 Rule オブジェクトが必須フィールドを持つ', () => {
    const rules = listBundledRules();
    for (const rule of rules) {
      expect(typeof rule.name).toBe('string');
      expect(typeof rule.filename).toBe('string');
      expect(typeof rule.content).toBe('string');
      expect(rule.name).toBe(rule.filename.replace(/\.md$/, ''));
    }
  });

  it('typescript ルールが含まれる', () => {
    const rules = listBundledRules();
    const tsRule = rules.find((r) => r.name === 'typescript');
    expect(tsRule).toBeDefined();
  });
});

describe('getBundledRule', () => {
  let getBundledRule: Awaited<typeof import('../../sources/bundled.js')>['getBundledRule'];

  beforeEach(async () => {
    vi.resetModules();
    ({ getBundledRule } = await import('../../sources/bundled.js'));
  });

  it('存在するルール名で Rule オブジェクトを返す', () => {
    const rule = getBundledRule('typescript');
    expect(rule).toBeDefined();
    expect(rule?.name).toBe('typescript');
    expect(rule?.filename).toBe('typescript.md');
    expect(typeof rule?.content).toBe('string');
    expect(rule!.content.length).toBeGreaterThan(0);
  });

  it('.md 拡張子付きのルール名でも動作する', () => {
    const rule = getBundledRule('typescript.md');
    expect(rule).toBeDefined();
    expect(rule?.name).toBe('typescript');
  });

  it('存在しないルール名で undefined を返す', () => {
    expect(getBundledRule('nonexistent-rule-xyz')).toBeUndefined();
  });

  it('react ルールが取得できる', () => {
    const rule = getBundledRule('react');
    expect(rule).toBeDefined();
    expect(rule?.name).toBe('react');
  });

  it('security ルールが取得できる', () => {
    const rule = getBundledRule('security');
    expect(rule).toBeDefined();
  });
});
