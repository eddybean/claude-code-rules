import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_RULES } from '../fixtures/rules.js';
import { CLACK_CANCEL, createClackMock } from '../helpers/clack-mock.js';

vi.mock('@clack/prompts', () => createClackMock());
vi.mock('../../utils/rules.js', () => ({
  writeRule: vi.fn(),
  ruleExists: vi.fn().mockReturnValue(false),
  ensureRulesDir: vi.fn(),
}));
vi.mock('../../sources/bundled.js', () => ({
  listBundledRules: vi.fn().mockReturnValue([]),
  getBundledRule: vi.fn(),
}));
vi.mock('../../sources/github.js', () => ({
  listGithubRules: vi.fn().mockResolvedValue([]),
  fetchGithubRule: vi.fn(),
  isGithubUrl: vi.fn().mockReturnValue(true),
}));

import * as p from '@clack/prompts';
import { addCommand } from '../../commands/add.js';
import { getBundledRule, listBundledRules } from '../../sources/bundled.js';
import { fetchGithubRule, isGithubUrl } from '../../sources/github.js';
import { ensureRulesDir, ruleExists, writeRule } from '../../utils/rules.js';

/** process.exit をモックして throw させる（後続コードの実行を防ぐ） */
function mockProcessExit() {
  return vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
}

beforeEach(() => {
  vi.mocked(ruleExists).mockReturnValue(false);
  vi.mocked(p.isCancel).mockReturnValue(false);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('addCommand - 同梱ルール直接指定モード', () => {
  it('ルール名を直接指定した場合は writeRule を呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]); // typescript

    await addCommand('typescript', {});

    expect(writeRule).toHaveBeenCalledWith(
      'typescript.md',
      expect.any(String),
      undefined,
      'workspace',
    );
  });

  it('--user フラグで user location にインストールする', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);

    await addCommand('typescript', { user: true });

    expect(writeRule).toHaveBeenCalledWith('typescript.md', expect.any(String), undefined, 'user');
  });

  it('--path オプションで paths フィルターを渡す', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);

    await addCommand('typescript', { path: 'src/**' });

    expect(writeRule).toHaveBeenCalledWith(
      'typescript.md',
      expect.any(String),
      'src/**',
      'workspace',
    );
  });

  it('存在しないルール名の場合は process.exit(1) を呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(undefined);
    vi.mocked(listBundledRules).mockReturnValue(FIXTURE_RULES);
    const exitSpy = mockProcessExit();
    try {
      await expect(addCommand('nonexistent', {})).rejects.toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
    }
  });
});

describe('addCommand - 競合解決フロー', () => {
  it('ファイルが既存で overwrite を選んだ場合は writeRule を呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);
    vi.mocked(ruleExists).mockReturnValue(true);
    vi.mocked(p.select).mockResolvedValue('overwrite');

    await addCommand('typescript', {});

    expect(writeRule).toHaveBeenCalled();
  });

  it('ファイルが既存で skip を選んだ場合は writeRule を呼ばない', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);
    vi.mocked(ruleExists).mockReturnValue(true);
    vi.mocked(p.select).mockResolvedValue('skip');

    await addCommand('typescript', {});

    expect(writeRule).not.toHaveBeenCalled();
  });

  it('ファイルが既存で rename を選んだ場合は新しいファイル名で writeRule を呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);
    vi.mocked(ruleExists).mockReturnValue(true);
    vi.mocked(p.select).mockResolvedValue('rename');
    vi.mocked(p.text).mockResolvedValue('typescript-custom');

    await addCommand('typescript', {});

    expect(writeRule).toHaveBeenCalledWith(
      'typescript-custom.md',
      expect.any(String),
      undefined,
      'workspace',
    );
  });

  it('競合解決でキャンセルした場合は writeRule を呼ばない', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);
    vi.mocked(ruleExists).mockReturnValue(true);
    vi.mocked(p.isCancel).mockReturnValue(true);
    vi.mocked(p.select).mockResolvedValue(CLACK_CANCEL);

    await addCommand('typescript', {});

    expect(writeRule).not.toHaveBeenCalled();
  });
});

describe('addCommand - GitHub ソース直接指定モード', () => {
  it('--source と rule 名を指定した場合に fetchGithubRule を呼ぶ', async () => {
    vi.mocked(isGithubUrl).mockReturnValue(true);
    vi.mocked(fetchGithubRule).mockResolvedValue(FIXTURE_RULES[0]);

    await addCommand('typescript', { source: 'https://github.com/owner/repo' });

    expect(fetchGithubRule).toHaveBeenCalledWith('https://github.com/owner/repo', 'typescript.md');
    expect(writeRule).toHaveBeenCalled();
  });

  it('GitHub ルールが見つからない場合は process.exit(1) を呼ぶ', async () => {
    vi.mocked(isGithubUrl).mockReturnValue(true);
    vi.mocked(fetchGithubRule).mockResolvedValue(undefined);
    const exitSpy = mockProcessExit();
    try {
      await expect(
        addCommand('nonexistent', { source: 'https://github.com/owner/repo' }),
      ).rejects.toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
    }
  });

  it('無効な --source URL は process.exit(1) を呼ぶ', async () => {
    vi.mocked(isGithubUrl).mockReturnValue(false);
    const exitSpy = mockProcessExit();
    try {
      await expect(
        addCommand('typescript', { source: 'https://invalid.com/repo' }),
      ).rejects.toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
    }
  });
});

describe('addCommand - ディレクトリ作成とエラーハンドリング', () => {
  it('同梱ルール直接指定時に ensureRulesDir を呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);

    await addCommand('typescript', {});

    expect(ensureRulesDir).toHaveBeenCalledWith('workspace');
  });

  it('--user フラグ時に ensureRulesDir を user で呼ぶ', async () => {
    vi.mocked(getBundledRule).mockReturnValue(FIXTURE_RULES[0]);

    await addCommand('typescript', { user: true });

    expect(ensureRulesDir).toHaveBeenCalledWith('user');
  });

  it('writeRule が失敗した場合はエラーメッセージを表示する', async () => {
    const rule = { ...FIXTURE_RULES[0], name: 'testing-err', filename: 'testing-err.md' };
    vi.mocked(getBundledRule).mockReturnValue(rule);
    vi.mocked(writeRule).mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied');
    });

    await addCommand('testing-err', {});

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('testing-err.md'));
  });

  it('writeRule が失敗しても process.exit しない（次のルールを処理できる）', async () => {
    const rule = { ...FIXTURE_RULES[0], name: 'testing-err2', filename: 'testing-err2.md' };
    vi.mocked(getBundledRule).mockReturnValue(rule);
    vi.mocked(writeRule).mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied');
    });

    // エラーをスローせずに正常に完了すること
    await expect(addCommand('testing-err2', {})).resolves.toBeUndefined();
  });

  it('GitHub 直接指定時にも ensureRulesDir を呼ぶ', async () => {
    vi.mocked(isGithubUrl).mockReturnValue(true);
    vi.mocked(fetchGithubRule).mockResolvedValue(FIXTURE_RULES[0]);

    await addCommand('typescript', { source: 'https://github.com/owner/repo' });

    expect(ensureRulesDir).toHaveBeenCalledWith('workspace');
  });
});
