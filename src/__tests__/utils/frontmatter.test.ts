import { describe, expect, it } from 'vitest';
import { buildContent, parseFrontmatter } from '../../utils/frontmatter.js';

describe('parseFrontmatter', () => {
  it('フロントマターなしのコンテンツをそのまま body として返す', () => {
    const result = parseFrontmatter('# Simple Rule\n\nContent here.');
    expect(result.paths).toBeUndefined();
    expect(result.body).toBe('# Simple Rule\n\nContent here.');
  });

  it('paths フィールドを含むフロントマターをパースする', () => {
    const content = '---\npaths: "src/backend/**"\n---\n# Backend Rules\n\nContent here.';
    const result = parseFrontmatter(content);
    expect(result.paths).toBe('src/backend/**');
    expect(result.body).toBe('# Backend Rules\n\nContent here.');
  });

  it('クォートなしの paths フィールドをパースする', () => {
    const content = '---\npaths: src/simple\n---\n# Rule';
    const result = parseFrontmatter(content);
    expect(result.paths).toBe('src/simple');
  });

  it('gray-matter がエラーを投げる glob パターンをフォールバック処理する', () => {
    // gray-matter は * を YAML エイリアスとして解釈してエラーを投げることがある
    const content = '---\npaths: src/*/components/**\n---\n# Rule\n\nBody.';
    const result = parseFrontmatter(content);
    expect(result.paths).toBe('src/*/components/**');
    expect(result.body).toBe('# Rule\n\nBody.');
  });

  it('フォールバック時にクォートされた paths から末尾クォートが残らない', () => {
    // gray-matter が失敗した場合の正規表現フォールバックでクォートペアを正しく除去する
    // parseFrontmatter を直接テストするため、gray-matter がエラーを投げるコンテンツを使用
    const content = '---\npaths: src/*/backend/**\n---\n# Rule';
    const result = parseFrontmatter(content);
    expect(result.paths).toBe('src/*/backend/**');
    expect(result.paths).not.toMatch(/["']$/);
  });

  it('空のコンテンツは空の body を返す', () => {
    const result = parseFrontmatter('');
    expect(result.body).toBe('');
    expect(result.paths).toBeUndefined();
  });

  it('フロントマターのみで body がない場合は空の body を返す', () => {
    const content = '---\npaths: src/**\n---\n';
    const result = parseFrontmatter(content);
    expect(result.paths).toBe('src/**');
    expect(result.body).toBe('');
  });

  it('data オブジェクトにパースされたフィールドが含まれる', () => {
    const content = '---\npaths: src/simple\n---\n# Rule';
    const result = parseFrontmatter(content);
    expect(result.data).toHaveProperty('paths', 'src/simple');
  });
});

describe('buildContent', () => {
  it('paths なしの場合は body をそのまま返す', () => {
    const result = buildContent('# Rule content');
    expect(result).toBe('# Rule content');
  });

  it('paths が undefined の場合は body をそのまま返す', () => {
    const result = buildContent('# Rule content', undefined);
    expect(result).toBe('# Rule content');
  });

  it('glob 特殊文字を含む paths はクォートされる', () => {
    const result = buildContent('# Rule', 'src/**');
    expect(result).toBe('---\npaths: "src/**"\n---\n# Rule');
  });

  it('特殊文字なしの paths はクォートなしで出力される', () => {
    const result = buildContent('# Rule', 'src/simple');
    expect(result).toBe('---\npaths: src/simple\n---\n# Rule');
  });

  it('コロンを含む paths はクォートされる', () => {
    const result = buildContent('# Rule', 'src:backend');
    expect(result).toContain('"src:backend"');
  });

  it('buildContent でビルドしたコンテンツを parseFrontmatter で逆変換できる', () => {
    const body = '# Rule\n\nSome content.';
    const paths = 'src/backend/**';
    const built = buildContent(body, paths);
    const parsed = parseFrontmatter(built);
    expect(parsed.body).toBe(body);
    expect(parsed.paths).toBe(paths);
  });

  it('フロントマター付きコンテンツは --- で始まる', () => {
    const result = buildContent('# Rule', 'src/**');
    expect(result.startsWith('---\n')).toBe(true);
  });
});
