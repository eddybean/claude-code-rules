import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs');
vi.mock('../../utils/paths.js', () => ({
  getRulesDir: vi.fn((location: string) =>
    location === 'workspace' ? '/mock/workspace/rules' : '/mock/user/rules',
  ),
}));

import * as fs from 'node:fs';
import {
  copyRule,
  deleteRule,
  ensureRulesDir,
  listRules,
  moveRule,
  ruleExists,
  updateRulePaths,
  writeRule,
} from '../../utils/rules.js';
import { setupFsMock, VirtualFs } from '../helpers/fs-mock.js';

const fsMock = setupFsMock(fs);
const vfs = new VirtualFs();

const WS_DIR = '/mock/workspace/rules';
const US_DIR = '/mock/user/rules';

beforeEach(() => {
  vfs.clear();
  vfs.bindTo(fsMock);
});

describe('listRules', () => {
  it('ディレクトリが存在しない場合は空配列を返す', () => {
    // VirtualFs が空なので existsSync は false を返す
    expect(listRules('workspace')).toEqual([]);
  });

  it('.md ファイルのみを Rule オブジェクトとして返す', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TypeScript Rules');
    vfs.write(`${WS_DIR}/README.txt`, 'not a rule');

    const rules = listRules('workspace');
    expect(rules).toHaveLength(1);
    expect(rules[0].filename).toBe('typescript.md');
    expect(rules[0].name).toBe('typescript');
  });

  it('複数のルールを返す', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TS');
    vfs.write(`${WS_DIR}/react.md`, '# React');

    const rules = listRules('workspace');
    expect(rules).toHaveLength(2);
    const names = rules.map((r) => r.name);
    expect(names).toContain('typescript');
    expect(names).toContain('react');
  });

  it('paths フィルター付きのルールは paths を返す', () => {
    vfs.write(`${WS_DIR}/backend.md`, '---\npaths: "src/**"\n---\n# Backend');

    const rules = listRules('workspace');
    expect(rules[0].paths).toBe('src/**');
    expect(rules[0].content).toBe('# Backend');
  });

  it('user location のルールを返す', () => {
    vfs.write(`${US_DIR}/security.md`, '# Security');

    const rules = listRules('user');
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('security');
  });
});

describe('ruleExists', () => {
  it('ファイルが存在する場合は true を返す', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TS');
    expect(ruleExists('typescript.md', 'workspace')).toBe(true);
  });

  it('ファイルが存在しない場合は false を返す', () => {
    expect(ruleExists('nonexistent.md', 'workspace')).toBe(false);
  });
});

describe('writeRule', () => {
  it('ファイルを作成する', () => {
    writeRule('test.md', '# Test Rule', undefined, 'workspace');
    expect(vfs.exists(`${WS_DIR}/test.md`)).toBe(true);
  });

  it('paths なしの場合はフロントマターなしで保存する', () => {
    writeRule('test.md', '# Test Rule', undefined, 'workspace');
    const content = vfs.read(`${WS_DIR}/test.md`);
    expect(content).toBe('# Test Rule');
    expect(content).not.toContain('---');
  });

  it('paths ありの場合はフロントマター付きで保存する', () => {
    writeRule('backend.md', '# Backend', 'src/**', 'workspace');
    const content = vfs.read(`${WS_DIR}/backend.md`);
    expect(content).toContain('paths:');
    expect(content).toContain('src/**');
    expect(content).toContain('# Backend');
  });

  it('user location に書き込む', () => {
    writeRule('security.md', '# Security', undefined, 'user');
    expect(vfs.exists(`${US_DIR}/security.md`)).toBe(true);
  });
});

describe('deleteRule', () => {
  it('ファイルを削除する', () => {
    vfs.write(`${WS_DIR}/old.md`, '# Old Rule');
    deleteRule('old.md', 'workspace');
    expect(vfs.exists(`${WS_DIR}/old.md`)).toBe(false);
  });
});

describe('copyRule', () => {
  it('workspace から user へコピーする', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TypeScript');
    copyRule('typescript.md', 'workspace', 'user');
    expect(vfs.exists(`${US_DIR}/typescript.md`)).toBe(true);
    expect(vfs.read(`${US_DIR}/typescript.md`)).toBe('# TypeScript');
    // 元ファイルも残っている
    expect(vfs.exists(`${WS_DIR}/typescript.md`)).toBe(true);
  });

  it('user から workspace へコピーする', () => {
    vfs.write(`${US_DIR}/security.md`, '# Security');
    copyRule('security.md', 'user', 'workspace');
    expect(vfs.exists(`${WS_DIR}/security.md`)).toBe(true);
  });
});

describe('moveRule', () => {
  it('workspace から user へ移動し、元ファイルを削除する', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TypeScript');
    moveRule('typescript.md', 'workspace', 'user');
    expect(vfs.exists(`${US_DIR}/typescript.md`)).toBe(true);
    expect(vfs.exists(`${WS_DIR}/typescript.md`)).toBe(false);
  });

  it('移動後もコンテンツが保持される', () => {
    vfs.write(`${WS_DIR}/react.md`, '# React Rules');
    moveRule('react.md', 'workspace', 'user');
    expect(vfs.read(`${US_DIR}/react.md`)).toBe('# React Rules');
  });

  it('削除に失敗した場合はコピー先を削除してロールバックしエラーをスローする', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TypeScript');
    // unlinkSync を一時的に失敗させる
    fsMock.unlinkSync.mockImplementationOnce(() => {
      throw new Error('EPERM: operation not permitted');
    });

    expect(() => moveRule('typescript.md', 'workspace', 'user')).toThrow('EPERM');
    // コピー先にファイルが残っていない（ロールバック成功）
    expect(vfs.exists(`${US_DIR}/typescript.md`)).toBe(false);
    // 元ファイルは残っている
    expect(vfs.exists(`${WS_DIR}/typescript.md`)).toBe(true);
  });
});

describe('ensureRulesDir', () => {
  it('ディレクトリが存在しない場合は mkdirSync を呼ぶ', () => {
    ensureRulesDir('workspace');
    expect(fsMock.mkdirSync).toHaveBeenCalledWith(WS_DIR, { recursive: true });
  });

  it('user location でも mkdirSync を呼ぶ', () => {
    ensureRulesDir('user');
    expect(fsMock.mkdirSync).toHaveBeenCalledWith(US_DIR, { recursive: true });
  });

  it('mkdirSync が失敗した場合はエラーをスローする', () => {
    fsMock.mkdirSync.mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied');
    });
    expect(() => ensureRulesDir('workspace')).toThrow('EACCES');
  });
});

describe('updateRulePaths', () => {
  it('paths フィルターを更新する', () => {
    vfs.write(`${WS_DIR}/typescript.md`, '# TypeScript Rules');
    updateRulePaths('typescript.md', 'workspace', 'src/**');
    const content = vfs.read(`${WS_DIR}/typescript.md`);
    expect(content).toContain('paths:');
    expect(content).toContain('src/**');
  });

  it('paths を undefined に設定するとフロントマターが消える', () => {
    vfs.write(`${WS_DIR}/backend.md`, '---\npaths: "src/**"\n---\n# Backend');
    updateRulePaths('backend.md', 'workspace', undefined);
    const content = vfs.read(`${WS_DIR}/backend.md`);
    expect(content).not.toContain('paths:');
    expect(content).toBe('# Backend');
  });

  it('既存の paths を別の値に更新する', () => {
    vfs.write(`${WS_DIR}/api.md`, '---\npaths: "old/**"\n---\n# API');
    updateRulePaths('api.md', 'workspace', 'new/**');
    const content = vfs.read(`${WS_DIR}/api.md`);
    expect(content).toContain('new/**');
    expect(content).not.toContain('old/**');
  });
});
