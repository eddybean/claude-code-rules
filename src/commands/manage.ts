import * as p from '@clack/prompts';
import { t } from '../i18n/index.js';
import type { RuleLocation } from '../types.js';
import { copyRule, deleteRule, listRules, moveRule, updateRulePaths } from '../utils/rules.js';

function formatRuleLabel(name: string, paths?: string, location?: RuleLocation): string {
  const pathsTag = paths ? ` [paths: ${paths}]` : '';
  const locTag = location
    ? ` (${t(location === 'workspace' ? 'manage.workspace' : 'manage.user')})`
    : '';
  return `${name}${pathsTag}${locTag}`;
}

export async function manageCommand(): Promise<void> {
  p.intro(t('manage.intro'));

  while (true) {
    const workspaceRules = listRules('workspace');
    const userRules = listRules('user');

    if (workspaceRules.length === 0 && userRules.length === 0) {
      p.log.warn(t('manage.noRules'));
      break;
    }

    const options = [
      ...workspaceRules.map((r) => ({
        value: `workspace:${r.filename}`,
        label: formatRuleLabel(r.name, r.paths, 'workspace'),
      })),
      ...userRules.map((r) => ({
        value: `user:${r.filename}`,
        label: formatRuleLabel(r.name, r.paths, 'user'),
      })),
    ];

    const selected = await p.select({
      message: t('manage.selectRule'),
      options,
    });
    if (p.isCancel(selected)) break;

    const [locationStr, filename] = (selected as string).split(':') as [string, string];
    const location = locationStr as RuleLocation;
    const otherLocation: RuleLocation = location === 'workspace' ? 'user' : 'workspace';
    const otherLabel = t(
      otherLocation === 'workspace' ? 'manage.location.workspace' : 'manage.location.user',
    );

    const action = await p.select({
      message: `"${filename}" ${t('manage.action.message')}`,
      options: [
        { value: 'copy', label: `${otherLabel} ${t('manage.action.copy')}` },
        { value: 'move', label: `${otherLabel} ${t('manage.action.move')}` },
        { value: 'edit-paths', label: t('manage.action.editPaths') },
        { value: 'delete', label: t('manage.action.delete') },
        { value: 'back', label: t('manage.action.cancel') },
      ],
    });
    if (p.isCancel(action) || action === 'back') continue;

    if (action === 'copy') {
      try {
        copyRule(filename, location, otherLocation);
        p.log.success(`${otherLabel} ${t('manage.copied')} ${filename}`);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
      }
    } else if (action === 'move') {
      try {
        moveRule(filename, location, otherLocation);
        p.log.success(`${otherLabel} ${t('manage.moved')} ${filename}`);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
      }
    } else if (action === 'edit-paths') {
      const currentRule = [...workspaceRules, ...userRules].find((r) => r.filename === filename);
      const currentPaths = currentRule?.paths ?? '';
      const newPaths = await p.text({
        message: t('manage.editPaths.message'),
        placeholder: currentPaths || t('add.paths.placeholder'),
        initialValue: currentPaths,
      });
      if (!p.isCancel(newPaths)) {
        updateRulePaths(filename, location, newPaths?.trim() || undefined);
        p.log.success(`${t('manage.editPaths.updated')} ${filename}`);
      }
    } else if (action === 'delete') {
      const confirmed = await p.confirm({
        message: `${t('manage.delete.confirm')} "${filename}"${t('manage.delete.question')}`,
        initialValue: false,
      });
      if (!p.isCancel(confirmed) && confirmed) {
        deleteRule(filename, location);
        p.log.success(`${t('manage.deleted')} ${filename}`);
      }
    }
  }

  p.outro(t('manage.done'));
}
