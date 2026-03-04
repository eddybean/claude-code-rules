import type { MockedFunction } from 'vitest';
import { vi } from 'vitest';

export interface FsMockSetup {
  existsSync: MockedFunction<typeof import('node:fs').existsSync>;
  statSync: MockedFunction<typeof import('node:fs').statSync>;
  readdirSync: MockedFunction<typeof import('node:fs').readdirSync>;
  readFileSync: MockedFunction<typeof import('node:fs').readFileSync>;
  writeFileSync: MockedFunction<typeof import('node:fs').writeFileSync>;
  mkdirSync: MockedFunction<typeof import('node:fs').mkdirSync>;
  copyFileSync: MockedFunction<typeof import('node:fs').copyFileSync>;
  unlinkSync: MockedFunction<typeof import('node:fs').unlinkSync>;
}

export function setupFsMock(fs: typeof import('node:fs')): FsMockSetup {
  return {
    existsSync: vi.mocked(fs.existsSync),
    statSync: vi.mocked(fs.statSync),
    readdirSync: vi.mocked(fs.readdirSync),
    readFileSync: vi.mocked(fs.readFileSync),
    writeFileSync: vi.mocked(fs.writeFileSync),
    mkdirSync: vi.mocked(fs.mkdirSync),
    copyFileSync: vi.mocked(fs.copyFileSync),
    unlinkSync: vi.mocked(fs.unlinkSync),
  };
}

/**
 * インメモリ仮想ファイルシステム。
 * fs モックの一貫した実装に使用する。
 */
export class VirtualFs {
  private store = new Map<string, string>();

  write(path: string, content: string): void {
    this.store.set(path, content);
  }

  read(path: string): string {
    const content = this.store.get(path);
    if (content === undefined) throw new Error(`ENOENT: no such file or directory: '${path}'`);
    return content;
  }

  exists(path: string): boolean {
    if (this.store.has(path)) return true;
    // ディレクトリパスの場合、配下にファイルがあれば存在とみなす
    const dirPath = path.endsWith('/') ? path : `${path}/`;
    for (const key of this.store.keys()) {
      if (key.startsWith(dirPath)) return true;
    }
    return false;
  }

  list(dir: string): string[] {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    return [...this.store.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
      .filter((k) => !k.includes('/'));
  }

  delete(path: string): void {
    this.store.delete(path);
  }

  clear(): void {
    this.store.clear();
  }

  isDirectory(path: string): boolean {
    if (this.store.has(path)) return false; // ファイルとして登録されている
    const dirPath = path.endsWith('/') ? path : `${path}/`;
    for (const key of this.store.keys()) {
      if (key.startsWith(dirPath)) return true;
    }
    return false;
  }

  /** FsMockSetup に VirtualFs の実装をバインドする。beforeEach で呼び出す */
  bindTo(mock: FsMockSetup): void {
    mock.existsSync.mockImplementation((p) => this.exists(String(p)));
    mock.statSync.mockImplementation(
      (p) =>
        ({ isDirectory: () => this.isDirectory(String(p)) }) as ReturnType<
          typeof import('node:fs').statSync
        >,
    );
    mock.readdirSync.mockImplementation((p) => this.list(String(p)) as any);
    mock.readFileSync.mockImplementation((p, _enc) => this.read(String(p)));
    mock.writeFileSync.mockImplementation((p, content) => {
      this.write(String(p), String(content));
    });
    mock.mkdirSync.mockImplementation(() => undefined);
    mock.copyFileSync.mockImplementation((src, dest) => {
      this.write(String(dest), this.read(String(src)));
    });
    mock.unlinkSync.mockImplementation((p) => {
      this.delete(String(p));
    });
  }
}
