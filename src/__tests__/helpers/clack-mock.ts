import { vi } from 'vitest';

/**
 * @clack/prompts の全エクスポートをモックするファクトリ。
 *
 * 使い方:
 *   vi.mock('@clack/prompts', () => createClackMock())
 *
 * 各テストで:
 *   import * as p from '@clack/prompts'
 *   vi.mocked(p.select).mockResolvedValue('workspace')
 */
export function createClackMock() {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    log: {
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      message: vi.fn(),
    },
    // spinner は呼ばれるたびに新しいオブジェクトを返す
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
    })),
    select: vi.fn(),
    multiselect: vi.fn(),
    text: vi.fn(),
    confirm: vi.fn(),
    // isCancel はデフォルトで false（通常値を返す状況）
    isCancel: vi.fn().mockReturnValue(false),
  };
}

/** @clack/prompts のキャンセルをシミュレートするシンボル */
export const CLACK_CANCEL = Symbol('clack.cancel');
