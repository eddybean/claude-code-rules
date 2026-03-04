#!/usr/bin/env node
import { Command } from 'commander';
import { t } from './i18n/index.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { manageCommand } from './commands/manage.js';

const program = new Command();

program
  .name('ccr')
  .description(t('cli.desc'))
  .version('0.1.0');

program
  .command('add [rule-name]')
  .description(t('cli.add.desc'))
  .option('-p, --path <glob>', t('cli.add.opt.path'))
  .option('-s, --source <url>', t('cli.add.opt.source'))
  .option('-u, --user', t('cli.add.opt.user'))
  .action(async (ruleName: string | undefined, opts: { path?: string; source?: string; user?: boolean }) => {
    try {
      await addCommand(ruleName, opts);
    } catch (err) {
      console.error(t('cli.error'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('list')
  .description(t('cli.list.desc'))
  .action(() => {
    listCommand();
  });

program
  .command('manage')
  .description(t('cli.manage.desc'))
  .action(async () => {
    try {
      await manageCommand();
    } catch (err) {
      console.error(t('cli.error'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
