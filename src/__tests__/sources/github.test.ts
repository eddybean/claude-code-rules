import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_GITHUB_DIR_ENTRIES, FIXTURE_GITHUB_FILE_CONTENT } from '../fixtures/rules.js';

const mockFetch = vi.fn();

// fetch のスタブとモジュールリセットを全 describe で共有
beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('isGithubUrl', () => {
  it('有効な GitHub HTTPS URL を true とみなす', async () => {
    const { isGithubUrl } = await import('../../sources/github.js');
    expect(isGithubUrl('https://github.com/owner/repo')).toBe(true);
  });

  it('HTTP の GitHub URL も true とみなす', async () => {
    const { isGithubUrl } = await import('../../sources/github.js');
    expect(isGithubUrl('http://github.com/owner/repo')).toBe(true);
  });

  it('GitLab URL は false とみなす', async () => {
    const { isGithubUrl } = await import('../../sources/github.js');
    expect(isGithubUrl('https://gitlab.com/owner/repo')).toBe(false);
  });

  it('URL でない文字列は false とみなす', async () => {
    const { isGithubUrl } = await import('../../sources/github.js');
    expect(isGithubUrl('not-a-url')).toBe(false);
    expect(isGithubUrl('')).toBe(false);
  });

  it('.git サフィックス付き URL も true とみなす', async () => {
    const { isGithubUrl } = await import('../../sources/github.js');
    expect(isGithubUrl('https://github.com/owner/repo.git')).toBe(true);
  });
});

describe('listGithubRules', () => {
  it('有効な GitHub URL でルール一覧を取得する', async () => {
    // rules/ エントリ（ファイル2件 + ディレクトリ1件）
    mockFetch
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_DIR_ENTRIES))
      // .claude/rules/ は空
      .mockResolvedValueOnce(makeJsonResponse([]))
      // typescript.md の内容
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT))
      // react.md の内容
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT));

    const { listGithubRules } = await import('../../sources/github.js');
    const rules = await listGithubRules('https://github.com/owner/repo');

    // ディレクトリエントリは除外され、.md ファイルのみ
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.filename)).toContain('typescript.md');
    expect(rules.map((r) => r.filename)).toContain('react.md');
  });

  it('rules/ と .claude/rules/ の両パスを並列探索してマージする', async () => {
    const entry = [FIXTURE_GITHUB_DIR_ENTRIES[0]]; // typescript.md のみ

    mockFetch
      .mockResolvedValueOnce(makeJsonResponse(entry)) // rules/
      .mockResolvedValueOnce(
        makeJsonResponse([
          {
            // .claude/rules/ に別のルール
            name: 'extra.md',
            path: '.claude/rules/extra.md',
            type: 'file',
            download_url: null,
            url: 'https://api.github.com/repos/owner/repo/contents/.claude/rules/extra.md',
          },
        ]),
      )
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT)) // typescript.md
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT)); // extra.md

    const { listGithubRules } = await import('../../sources/github.js');
    const rules = await listGithubRules('https://github.com/owner/repo');

    expect(rules).toHaveLength(2);
    const names = rules.map((r) => r.filename);
    expect(names).toContain('typescript.md');
    expect(names).toContain('extra.md');
  });

  it('rules/ と .claude/rules/ に同名ファイルがある場合は重複を除去する', async () => {
    const entry = [FIXTURE_GITHUB_DIR_ENTRIES[0]]; // typescript.md のみ

    mockFetch
      .mockResolvedValueOnce(makeJsonResponse(entry)) // rules/ に typescript.md
      .mockResolvedValueOnce(makeJsonResponse(entry)) // .claude/rules/ にも typescript.md
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT))
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT));

    const { listGithubRules } = await import('../../sources/github.js');
    const rules = await listGithubRules('https://github.com/owner/repo');

    expect(rules).toHaveLength(1);
  });

  it('無効な GitHub URL はエラーをスローする', async () => {
    const { listGithubRules } = await import('../../sources/github.js');
    await expect(listGithubRules('https://gitlab.com/owner/repo')).rejects.toThrow();
  });

  it('403 レスポンスは Rate Limit エラーをスローする', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(403, 'Forbidden'));

    const { listGithubRules } = await import('../../sources/github.js');
    await expect(listGithubRules('https://github.com/owner/repo')).rejects.toThrow();
  });

  it('401 レスポンスは認証エラーをスローする', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));

    const { listGithubRules } = await import('../../sources/github.js');
    await expect(listGithubRules('https://github.com/owner/repo')).rejects.toThrow();
  });

  it('401 と 403 は異なるエラーメッセージをスローする', async () => {
    const { listGithubRules } = await import('../../sources/github.js');

    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));
    const err401 = await listGithubRules('https://github.com/owner/repo').catch((e) => e);

    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    const { listGithubRules: listGithubRules2 } = await import('../../sources/github.js');
    mockFetch.mockResolvedValue(makeErrorResponse(403, 'Forbidden'));
    const err403 = await listGithubRules2('https://github.com/owner/repo').catch((e) => e);

    expect(err401.message).not.toBe(err403.message);
  });

  it('GITHUB_TOKEN が設定されている場合は Authorization ヘッダーを送信する', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token');
    mockFetch
      .mockResolvedValueOnce(makeJsonResponse([]))
      .mockResolvedValueOnce(makeJsonResponse([]));

    const { listGithubRules } = await import('../../sources/github.js');
    await listGithubRules('https://github.com/owner/repo');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('GITHUB_TOKEN が未設定の場合は Authorization ヘッダーを送信しない', async () => {
    delete process.env.GITHUB_TOKEN;
    mockFetch
      .mockResolvedValueOnce(makeJsonResponse([]))
      .mockResolvedValueOnce(makeJsonResponse([]));

    const { listGithubRules } = await import('../../sources/github.js');
    await listGithubRules('https://github.com/owner/repo');

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect((callArgs.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('rules/ が 404 の場合は空配列として扱いエラーをスローしない', async () => {
    mockFetch
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found')) // rules/ が存在しない
      .mockResolvedValueOnce(makeJsonResponse([])); // .claude/rules/ は空

    const { listGithubRules } = await import('../../sources/github.js');
    const rules = await listGithubRules('https://github.com/owner/repo');
    expect(rules).toEqual([]);
  });

  it('rules/ と .claude/rules/ 両方が存在しない場合は空配列を返す', async () => {
    mockFetch
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found'))
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found'));

    const { listGithubRules } = await import('../../sources/github.js');
    const rules = await listGithubRules('https://github.com/owner/repo');
    expect(rules).toEqual([]);
  });
});

describe('fetchGithubRule', () => {
  it('rules/ にあるファイルを取得する', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT));

    const { fetchGithubRule } = await import('../../sources/github.js');
    const rule = await fetchGithubRule('https://github.com/owner/repo', 'typescript.md');

    expect(rule).not.toBeUndefined();
    expect(rule?.name).toBe('typescript');
    expect(rule?.filename).toBe('typescript.md');
  });

  it('.md 拡張子なしのファイル名でも取得できる', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT));

    const { fetchGithubRule } = await import('../../sources/github.js');
    // フィクスチャには typescript.md を想定
    const rule = await fetchGithubRule('https://github.com/owner/repo', 'typescript.md');
    expect(rule?.name).toBe('typescript');
  });

  it('rules/ になく .claude/rules/ にあるファイルを取得する', async () => {
    mockFetch
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found')) // rules/ にない
      .mockResolvedValueOnce(makeJsonResponse(FIXTURE_GITHUB_FILE_CONTENT)); // .claude/rules/ にある

    const { fetchGithubRule } = await import('../../sources/github.js');
    const rule = await fetchGithubRule('https://github.com/owner/repo', 'custom.md');
    expect(rule).not.toBeUndefined();
  });

  it('どちらのパスにも存在しない場合は undefined を返す', async () => {
    mockFetch
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found'))
      .mockResolvedValueOnce(makeErrorResponse(404, 'Not Found'));

    const { fetchGithubRule } = await import('../../sources/github.js');
    const rule = await fetchGithubRule('https://github.com/owner/repo', 'nonexistent.md');
    expect(rule).toBeUndefined();
  });
});

// --- ヘルパー ---

function makeJsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

function makeErrorResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  } as unknown as Response;
}
