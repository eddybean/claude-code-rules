import * as p from '@clack/prompts';
import { t } from '../i18n/index.js';
import { listBundledRules, getBundledRule } from '../sources/bundled.js';
import { listGithubRules, fetchGithubRule, isGithubUrl } from '../sources/github.js';
import { writeRule, ruleExists } from '../utils/rules.js';
import { recordInstall } from '../utils/config.js';
import type { Rule, RuleLocation, AddOptions } from '../types.js';

async function promptPathsFilter(defaultPaths?: string): Promise<string | undefined> {
  const value = await p.text({
    message: t('add.paths.message'),
    placeholder: t('add.paths.placeholder'),
    initialValue: defaultPaths ?? '',
  });
  if (p.isCancel(value)) return undefined;
  return value?.trim() || undefined;
}

async function promptConflictResolution(filename: string): Promise<'overwrite' | 'skip' | 'rename' | null> {
  const action = await p.select({
    message: `"${filename}" ${t('add.conflict.message')}`,
    options: [
      { value: 'overwrite', label: t('add.conflict.overwrite') },
      { value: 'skip', label: t('add.conflict.skip') },
      { value: 'rename', label: t('add.conflict.rename') },
    ],
  });
  if (p.isCancel(action)) return null;
  return action as 'overwrite' | 'skip' | 'rename';
}

async function promptNewFilename(original: string): Promise<string | null> {
  const name = await p.text({
    message: t('add.rename.message'),
    placeholder: original.replace(/\.md$/, '') + '-custom',
  });
  if (p.isCancel(name) || !name) return null;
  return name.endsWith('.md') ? name : `${name}.md`;
}

async function installRule(
  rule: Rule,
  location: RuleLocation,
  source: string,
  overridePaths?: string,
): Promise<void> {
  const paths = overridePaths !== undefined ? overridePaths : rule.paths;
  let filename = rule.filename;

  if (ruleExists(filename, location)) {
    const action = await promptConflictResolution(filename);
    if (!action || action === 'skip') {
      p.log.warn(`${t('add.skip')} ${filename}`);
      return;
    }
    if (action === 'rename') {
      const newName = await promptNewFilename(filename);
      if (!newName) return;
      filename = newName;
    }
  }

  writeRule(filename, rule.content, paths, location);
  recordInstall(filename, source, location);
  p.log.success(`${t('add.installed')} ${filename}${paths ? ` [paths: ${paths}]` : ''}`);
}

async function selectLocation(): Promise<RuleLocation | null> {
  const loc = await p.select({
    message: t('add.location.message'),
    options: [
      { value: 'workspace', label: t('add.location.workspace') },
      { value: 'user', label: t('add.location.user') },
    ],
  });
  if (p.isCancel(loc)) return null;
  return loc as RuleLocation;
}

async function interactiveAdd(): Promise<void> {
  p.intro(t('add.intro'));

  const sourceType = await p.select({
    message: t('add.selectSource'),
    options: [
      { value: 'bundled', label: t('add.source.bundled') },
      { value: 'github', label: t('add.source.github') },
    ],
  });
  if (p.isCancel(sourceType)) { p.cancel(t('add.cancelled')); return; }

  let rules: Rule[] = [];
  let sourceId = 'bundled';

  if (sourceType === 'bundled') {
    rules = listBundledRules();
    if (rules.length === 0) {
      p.log.error(t('add.bundled.empty'));
      return;
    }
  } else {
    const url = await p.text({
      message: t('add.github.urlMessage'),
      placeholder: t('add.github.urlPlaceholder'),
      validate: (v) => isGithubUrl(v) ? undefined : t('add.github.urlInvalid'),
    });
    if (p.isCancel(url)) { p.cancel(t('add.cancelled')); return; }
    sourceId = url;

    const spinner = p.spinner();
    spinner.start(t('add.github.fetching'));
    try {
      rules = await listGithubRules(url);
      spinner.stop(`${rules.length} ${t('add.github.fetched')}`);
    } catch (err) {
      spinner.stop(t('add.github.fetchFailed'));
      p.log.error(err instanceof Error ? err.message : String(err));
      return;
    }

    if (rules.length === 0) {
      p.log.warn(t('add.github.noRules'));
      return;
    }
  }

  const selected = await p.multiselect({
    message: t('add.select.message'),
    options: rules.map((r) => ({
      value: r.name,
      label: r.name,
      hint: r.paths ? `paths: ${r.paths}` : undefined,
    })),
  });
  if (p.isCancel(selected) || selected.length === 0) {
    p.cancel(t('add.cancelled'));
    return;
  }

  const location = await selectLocation();
  if (!location) { p.cancel(t('add.cancelled')); return; }

  for (const ruleName of selected) {
    const rule = rules.find((r) => r.name === ruleName)!;
    const customPaths = await promptPathsFilter(rule.paths);
    await installRule(rule, location, sourceId, customPaths);
  }

  p.outro(t('add.done'));
}

export async function addCommand(ruleName: string | undefined, opts: AddOptions): Promise<void> {
  // インタラクティブモード
  if (!ruleName && !opts.source) {
    await interactiveAdd();
    return;
  }

  const location: RuleLocation = opts.user ? 'user' : 'workspace';

  // GitHub ソース直接モード
  if (opts.source) {
    if (!isGithubUrl(opts.source)) {
      console.error(t('add.invalidUrl'));
      process.exit(1);
    }

    if (!ruleName) {
      // GitHub インタラクティブ（ソースのみ指定）
      p.intro(t('add.github.intro'));
      const spinner = p.spinner();
      spinner.start(t('add.github.fetching'));
      let rules: Rule[];
      try {
        rules = await listGithubRules(opts.source);
        spinner.stop(`${rules.length} ${t('add.github.fetched')}`);
      } catch (err) {
        spinner.stop(t('add.github.fetchFailed'));
        p.log.error(err instanceof Error ? err.message : String(err));
        return;
      }

      if (rules.length === 0) {
        p.log.warn(t('add.github.noRules'));
        return;
      }

      const selected = await p.multiselect({
        message: t('add.select.messageShort'),
        options: rules.map((r) => ({ value: r.name, label: r.name })),
      });
      if (p.isCancel(selected)) { p.cancel(t('add.cancelled')); return; }

      for (const name of selected) {
        const rule = rules.find((r) => r.name === name)!;
        await installRule(rule, location, opts.source!, opts.path);
      }
      p.outro(t('add.done'));
      return;
    }

    // GitHub 直接指定
    const filename = ruleName.endsWith('.md') ? ruleName : `${ruleName}.md`;
    const rule = await fetchGithubRule(opts.source, filename);
    if (!rule) {
      console.error(`${t('add.bundled.notFound')} "${ruleName}" ${t('add.notFound')}`);
      process.exit(1);
    }
    await installRule(rule, location, opts.source, opts.path);
    return;
  }

  // 同梱ルール直接モード
  const rule = getBundledRule(ruleName!);
  if (!rule) {
    console.error(`${t('add.bundled.notFound')} "${ruleName}"`);
    console.error(t('add.bundled.available'), listBundledRules().map((r) => r.name).join(', '));
    process.exit(1);
  }

  if (ruleExists(rule.filename, location)) {
    p.intro('');
    const action = await promptConflictResolution(rule.filename);
    if (!action || action === 'skip') {
      console.log(t('add.skipped'));
      return;
    }
    if (action === 'rename') {
      const newName = await promptNewFilename(rule.filename);
      if (!newName) return;
      rule.filename = newName;
      rule.name = newName.replace(/\.md$/, '');
    }
  }

  writeRule(rule.filename, rule.content, opts.path ?? rule.paths, location);
  recordInstall(rule.filename, 'bundled', location);
  console.log(`${t('add.installed')} ${rule.filename}${opts.path ? ` [paths: ${opts.path}]` : ''}`);
}
