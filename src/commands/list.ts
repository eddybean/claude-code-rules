import { t } from '../i18n/index.js';
import { listRules } from '../utils/rules.js';
import { getInstallInfo } from '../utils/config.js';
import { getRulesDir } from '../utils/paths.js';
import { listBundledRules } from '../sources/bundled.js';

export function listCommand(opts: { bundled?: boolean } = {}): void {
  if (opts.bundled) {
    const rules = listBundledRules();
    const label = t('list.bundled');
    console.log(`\n${label}`);
    console.log('─'.repeat(label.length));
    if (rules.length === 0) {
      console.log(`  ${t('list.empty')}`);
    } else {
      for (const rule of rules) {
        const pathsTag = rule.paths ? ` [paths: ${rule.paths}]` : '';
        console.log(`  • ${rule.name}${pathsTag}`);
      }
    }
    console.log('');
    return;
  }

  const locations = ['workspace', 'user'] as const;

  for (const location of locations) {
    const dir = getRulesDir(location);
    const label = location === 'workspace'
      ? `${t('list.workspace')} (${dir})`
      : `${t('list.user')} (${dir})`;

    console.log(`\n${label}`);
    console.log('─'.repeat(label.length));

    const rules = listRules(location);
    if (rules.length === 0) {
      console.log(`  ${t('list.empty')}`);
      continue;
    }

    for (const rule of rules) {
      const info = getInstallInfo(rule.filename, location);
      const pathsTag = rule.paths ? ` [paths: ${rule.paths}]` : '';
      const sourceTag = info
        ? ` (${info.source === 'bundled' ? 'bundled' : info.source})`
        : '';
      console.log(`  ✓ ${rule.name}${pathsTag}${sourceTag}`);
    }
  }
  console.log('');
}
