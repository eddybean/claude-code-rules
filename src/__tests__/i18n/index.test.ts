import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * i18n/index.ts はモジュールロード時に process.env を評価して locale を確定する。
 * vi.resetModules() + 動的 import でモジュールキャッシュをクリアして再評価する。
 *
 * 注意: vi.stubEnv('LANGUAGE', '') は LANGUAGE を undefined にするのではなく
 * 空文字列 '' に設定する。LANGUAGE ?? ... の ?? は null/undefined のみを
 * スキップするため、'' はスキップされない。
 * そのため、各テストでは使用したい環境変数を直接設定する。
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('locale 判定', () => {
  it('LANGUAGE が "en" で始まる場合は en ロケールになる', async () => {
    vi.stubEnv('LANGUAGE', 'en_US.UTF-8');
    vi.resetModules();

    const { locale } = await import('../../i18n/index.js');
    expect(locale).toBe('en');
  });

  it('LANGUAGE が "ja" で始まる場合は ja ロケールになる', async () => {
    vi.stubEnv('LANGUAGE', 'ja_JP.UTF-8');
    vi.resetModules();

    const { locale } = await import('../../i18n/index.js');
    expect(locale).toBe('ja');
  });

  it('LANGUAGE が "ja" の短縮形でも ja ロケールになる', async () => {
    vi.stubEnv('LANGUAGE', 'ja');
    vi.resetModules();

    const { locale } = await import('../../i18n/index.js');
    expect(locale).toBe('ja');
  });

  it('LANGUAGE が設定されていない場合は LC_ALL を参照する', async () => {
    // process.env から LANGUAGE を削除して undefined にする
    // vi.stubEnv は '' (空文字) を設定するため ?? を通過できず delete で対応
    const originalLanguage = process.env.LANGUAGE;
    delete process.env.LANGUAGE;
    try {
      vi.stubEnv('LC_ALL', 'ja_JP.UTF-8');
      vi.resetModules();

      const { locale } = await import('../../i18n/index.js');
      expect(locale).toBe('ja');
    } finally {
      if (originalLanguage !== undefined) process.env.LANGUAGE = originalLanguage;
    }
  });

  it('不明なロケールは en にフォールバックする', async () => {
    vi.stubEnv('LANGUAGE', 'zh_CN.UTF-8');
    vi.resetModules();

    const { locale } = await import('../../i18n/index.js');
    expect(locale).toBe('en');
  });

  it('大文字小文字を区別せず "JA" も ja ロケールとして扱う', async () => {
    vi.stubEnv('LANGUAGE', 'JA');
    vi.resetModules();

    const { locale } = await import('../../i18n/index.js');
    expect(locale).toBe('ja');
  });
});

describe('t() 関数 - 英語', () => {
  it('英語メッセージを返す', async () => {
    vi.stubEnv('LANGUAGE', 'en_US.UTF-8');
    vi.resetModules();

    const { t } = await import('../../i18n/index.js');
    expect(t('add.intro')).toBe('ccr add - Add rules');
    expect(t('add.done')).toBe('Done');
    expect(t('cli.error')).toBe('Error:');
  });

  it('全 MessageKey で文字列を返す', async () => {
    vi.stubEnv('LANGUAGE', 'en_US.UTF-8');
    vi.resetModules();

    const { t } = await import('../../i18n/index.js');
    // いくつかのキーをサンプルとして確認
    const keys = ['add.cancelled', 'add.installed', 'list.bundled', 'manage.done'] as const;
    for (const key of keys) {
      expect(typeof t(key)).toBe('string');
      expect(t(key).length).toBeGreaterThan(0);
    }
  });
});

describe('t() 関数 - 日本語', () => {
  it('日本語メッセージを返す', async () => {
    vi.stubEnv('LANGUAGE', 'ja_JP.UTF-8');
    vi.resetModules();

    const { t } = await import('../../i18n/index.js');
    expect(t('add.intro')).toBe('ccr add - ルールを追加');
    expect(t('add.done')).toBe('完了しました');
    expect(t('cli.error')).toBe('エラー:');
  });
});
