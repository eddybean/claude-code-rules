import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getConfigPath } from './paths.js';
import type { CcrConfig, InstalledRule, RuleLocation } from '../types.js';

function loadConfig(location: RuleLocation): CcrConfig {
  const configPath = getConfigPath(location);
  if (!existsSync(configPath)) return { rules: {} };
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as CcrConfig;
  } catch {
    return { rules: {} };
  }
}

function saveConfig(location: RuleLocation, config: CcrConfig): void {
  const configPath = getConfigPath(location);
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function recordInstall(filename: string, source: string, location: RuleLocation): void {
  const config = loadConfig(location);
  config.rules[filename] = { source, installedAt: new Date().toISOString() } satisfies InstalledRule;
  saveConfig(location, config);
}

export function removeRecord(filename: string, location: RuleLocation): void {
  const config = loadConfig(location);
  delete config.rules[filename];
  saveConfig(location, config);
}

export function getInstallInfo(filename: string, location: RuleLocation): InstalledRule | undefined {
  return loadConfig(location).rules[filename];
}
