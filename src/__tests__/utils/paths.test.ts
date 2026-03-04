import { homedir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs');

import * as fs from 'node:fs';
import { findWorkspaceRoot, getRulesDir } from '../../utils/paths.js';
import { setupFsMock } from '../helpers/fs-mock.js';

const fsMock = setupFsMock(fs);

beforeEach(() => {
  // デフォルトはすべて false（.claude が見つからない）
  fsMock.existsSync.mockReturnValue(false);
});

describe('findWorkspaceRoot', () => {
  it('開始ディレクトリに .claude が存在する場合はそのディレクトリを返す', () => {
    fsMock.existsSync.mockImplementation((p) => String(p) === '/project/.claude');
    expect(findWorkspaceRoot('/project')).toBe('/project');
  });

  it('.claude が見つからない場合は null を返す', () => {
    fsMock.existsSync.mockReturnValue(false);
    // process.cwd() の祖先ツリーにある架空のパスを指定して、見つからないことを確認
    expect(findWorkspaceRoot('/nonexistent/deep/path')).toBeNull();
  });

  it('親ディレクトリを遡って .claude を見つける', () => {
    fsMock.existsSync.mockImplementation((p) => String(p) === '/project/.claude');
    expect(findWorkspaceRoot('/project/src/deep')).toBe('/project');
  });

  it('2階層上の親ディレクトリに .claude がある場合も見つける', () => {
    fsMock.existsSync.mockImplementation((p) => String(p) === '/workspace/.claude');
    expect(findWorkspaceRoot('/workspace/packages/myapp/src')).toBe('/workspace');
  });

  it('ルートディレクトリには到達しても見つからない場合は null を返す', () => {
    fsMock.existsSync.mockReturnValue(false);
    expect(findWorkspaceRoot('/')).toBeNull();
  });
});

describe('getRulesDir', () => {
  it('user location はホームディレクトリ配下を返す', () => {
    const result = getRulesDir('user');
    expect(result).toBe(join(homedir(), '.claude', 'rules'));
  });

  it('workspace location でワークスペースルートが見つかる場合はそのパスを返す', () => {
    // findWorkspaceRoot が process.cwd() から始まるため、cwd に .claude があると見せる
    const cwdClaudePath = join(process.cwd(), '.claude');
    fsMock.existsSync.mockImplementation((p) => String(p) === cwdClaudePath);

    const result = getRulesDir('workspace');
    expect(result).toBe(join(process.cwd(), '.claude', 'rules'));
  });

  it('workspace location でワークスペースルートが見つからない場合は cwd を使う', () => {
    fsMock.existsSync.mockReturnValue(false);
    const result = getRulesDir('workspace');
    expect(result).toBe(join(process.cwd(), '.claude', 'rules'));
  });
});
