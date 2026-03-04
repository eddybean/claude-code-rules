import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_RULES } from '../fixtures/rules.js';
import { CLACK_CANCEL, createClackMock } from '../helpers/clack-mock.js';

vi.mock('@clack/prompts', () => createClackMock());
vi.mock('../../utils/rules.js', () => ({
  listRules: vi.fn(),
  copyRule: vi.fn(),
  moveRule: vi.fn(),
  deleteRule: vi.fn(),
  updateRulePaths: vi.fn(),
}));

import * as p from '@clack/prompts';
import { manageCommand } from '../../commands/manage.js';
import { copyRule, deleteRule, listRules, moveRule, updateRulePaths } from '../../utils/rules.js';

beforeEach(() => {
  vi.mocked(p.isCancel).mockReturnValue(false);
  vi.mocked(listRules).mockImplementation((loc) => (loc === 'workspace' ? [FIXTURE_RULES[0]] : []));
});

describe('manageCommand - ルールなし', () => {
  it('ルールが0件の場合は警告を表示してループを抜ける', async () => {
    vi.mocked(listRules).mockReturnValue([]);

    await manageCommand();

    expect(p.log.warn).toHaveBeenCalled();
    expect(p.select).not.toHaveBeenCalled();
  });
});

describe('manageCommand - ルール選択キャンセル', () => {
  it('ルール選択をキャンセルするとコマンドが終了する', async () => {
    vi.mocked(p.select).mockResolvedValue(CLACK_CANCEL);
    vi.mocked(p.isCancel).mockReturnValue(true);

    await manageCommand();

    // select は1回呼ばれてキャンセル
    expect(p.select).toHaveBeenCalledTimes(1);
    expect(deleteRule).not.toHaveBeenCalled();
  });
});

describe('manageCommand - formatRuleLabel', () => {
  it('paths なしのルールはルール名のみを含むラベルになる', async () => {
    vi.mocked(listRules).mockImplementation(
      (loc) => (loc === 'workspace' ? [FIXTURE_RULES[0]] : []), // typescript, paths なし
    );
    // 最初の select でキャンセル
    vi.mocked(p.select).mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel).mockReturnValueOnce(true);

    await manageCommand();

    const call = vi.mocked(p.select).mock.calls[0][0] as { options: { label: string }[] };
    expect(call.options[0].label).toContain('typescript');
    expect(call.options[0].label).not.toContain('[paths:');
  });

  it('paths ありのルールはラベルに [paths: ...] タグを含む', async () => {
    vi.mocked(listRules).mockImplementation(
      (loc) => (loc === 'workspace' ? [FIXTURE_RULES[1]] : []), // react, paths: src/components/**
    );
    vi.mocked(p.select).mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel).mockReturnValueOnce(true);

    await manageCommand();

    const call = vi.mocked(p.select).mock.calls[0][0] as { options: { label: string }[] };
    expect(call.options[0].label).toContain('[paths: src/components/**]');
  });
});

describe('manageCommand - 削除フロー', () => {
  it('削除を確認した場合は deleteRule を呼ぶ', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md') // ルール選択
      .mockResolvedValueOnce('delete') // アクション選択
      .mockResolvedValueOnce(CLACK_CANCEL); // 次ループでキャンセル
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false) // ルール選択は正常
      .mockReturnValueOnce(false) // アクション選択は正常
      .mockReturnValueOnce(false) // confirm は正常
      .mockReturnValueOnce(true); // 次ループでキャンセル
    vi.mocked(p.confirm).mockResolvedValue(true);

    await manageCommand();

    expect(deleteRule).toHaveBeenCalledWith('typescript.md', 'workspace');
  });

  it('削除をキャンセルした場合は deleteRule を呼ばない', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('delete')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(p.confirm).mockResolvedValue(false); // キャンセル

    await manageCommand();

    expect(deleteRule).not.toHaveBeenCalled();
  });
});

describe('manageCommand - コピーフロー', () => {
  it('コピーアクションで copyRule を呼ぶ', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('copy')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await manageCommand();

    expect(copyRule).toHaveBeenCalledWith('typescript.md', 'workspace', 'user');
  });
});

describe('manageCommand - 移動フロー', () => {
  it('移動アクションで moveRule を呼ぶ', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('move')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await manageCommand();

    expect(moveRule).toHaveBeenCalledWith('typescript.md', 'workspace', 'user');
  });
});

describe('manageCommand - paths 編集フロー', () => {
  it('paths 編集アクションで updateRulePaths を呼ぶ', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('edit-paths')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(p.text).mockResolvedValue('src/**');

    await manageCommand();

    expect(updateRulePaths).toHaveBeenCalledWith('typescript.md', 'workspace', 'src/**');
  });

  it('空文字を入力した場合は paths を undefined に設定する', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('edit-paths')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(p.text).mockResolvedValue(''); // 空文字 = paths クリア

    await manageCommand();

    expect(updateRulePaths).toHaveBeenCalledWith('typescript.md', 'workspace', undefined);
  });
});

describe('manageCommand - back アクション', () => {
  it('back を選んだ場合はループを継続する（次のイテレーションでキャンセル）', async () => {
    vi.mocked(p.select)
      .mockResolvedValueOnce('workspace:typescript.md')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce(CLACK_CANCEL);
    vi.mocked(p.isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await manageCommand();

    expect(deleteRule).not.toHaveBeenCalled();
    expect(copyRule).not.toHaveBeenCalled();
    // ループが継続して 3 回 select が呼ばれる
    expect(p.select).toHaveBeenCalledTimes(3);
  });
});
