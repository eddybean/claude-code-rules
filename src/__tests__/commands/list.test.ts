import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_RULES } from '../fixtures/rules.js';
import { createClackMock } from '../helpers/clack-mock.js';

vi.mock('@clack/prompts', () => createClackMock());
vi.mock('../../utils/rules.js', () => ({
  listRules: vi.fn(),
}));
vi.mock('../../utils/paths.js', () => ({
  getRulesDir: vi.fn((loc: string) =>
    loc === 'workspace' ? '/project/.claude/rules' : '/home/user/.claude/rules',
  ),
}));
vi.mock('../../sources/bundled.js', () => ({
  listBundledRules: vi.fn(),
}));

import { listCommand } from '../../commands/list.js';
import { listBundledRules } from '../../sources/bundled.js';
import { listRules } from '../../utils/rules.js';

beforeEach(() => {
  vi.mocked(listRules).mockReturnValue([]);
  vi.mocked(listBundledRules).mockReturnValue([]);
});

describe('listCommand - --bundled フラグ', () => {
  it('--bundled フラグで同梱ルール一覧を表示する', () => {
    vi.mocked(listBundledRules).mockReturnValue(FIXTURE_RULES);
    const logs = captureLog(() => listCommand({ bundled: true }));

    expect(logs.some((l) => l.includes('typescript'))).toBe(true);
    expect(logs.some((l) => l.includes('react'))).toBe(true);
  });

  it('--bundled フラグで paths フィルターを表示する', () => {
    vi.mocked(listBundledRules).mockReturnValue([FIXTURE_RULES[1]]); // react (paths: src/components/**)
    const logs = captureLog(() => listCommand({ bundled: true }));

    expect(logs.some((l) => l.includes('[paths:'))).toBe(true);
  });

  it('同梱ルールが0件の場合は空である旨を表示する', () => {
    vi.mocked(listBundledRules).mockReturnValue([]);
    const logs = captureLog(() => listCommand({ bundled: true }));

    // ロケールにより "none" または "なし" が出力される
    const allOutput = logs.join('\n');
    expect(allOutput).toMatch(/none|なし/i);
  });

  it('--bundled フラグ使用時は listRules を呼ばない', () => {
    listCommand({ bundled: true });
    expect(listRules).not.toHaveBeenCalled();
  });
});

describe('listCommand - インストール済みルール一覧', () => {
  it('ルールが存在する場合はルール名を表示する', () => {
    vi.mocked(listRules).mockImplementation((loc) =>
      loc === 'workspace' ? [FIXTURE_RULES[0]] : [],
    );

    const logs = captureLog(() => listCommand({}));
    expect(logs.some((l) => l.includes('typescript'))).toBe(true);
  });

  it('paths フィルター付きのルールは [paths: ...] タグを表示する', () => {
    vi.mocked(listRules).mockImplementation(
      (loc) => (loc === 'workspace' ? [FIXTURE_RULES[1]] : []), // react with paths
    );

    const logs = captureLog(() => listCommand({}));
    expect(logs.some((l) => l.includes('[paths:'))).toBe(true);
  });

  it('ルールが0件の場合は空である旨を表示する', () => {
    vi.mocked(listRules).mockReturnValue([]);

    const logs = captureLog(() => listCommand({}));
    const allOutput = logs.join('\n');
    expect(allOutput).toMatch(/none|なし/i);
  });

  it('workspace と user の両方のセクションを出力する', () => {
    vi.mocked(listRules).mockImplementation((loc) =>
      loc === 'workspace' ? [FIXTURE_RULES[0]] : [FIXTURE_RULES[2]],
    );

    const logs = captureLog(() => listCommand({}));
    const allOutput = logs.join('\n');
    expect(allOutput).toContain('typescript');
    expect(allOutput).toContain('testing');
  });

  it('引数なしで呼ばれた場合も正常に動作する', () => {
    expect(() => listCommand()).not.toThrow();
  });
});

// --- ヘルパー ---

function captureLog(fn: () => void): string[] {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
    logs.push(args.map(String).join(' '));
  });
  fn();
  spy.mockRestore();
  return logs;
}
