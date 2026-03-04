import { messages as en, type MessageKey } from './en.js';
import { messages as ja } from './ja.js';

const lang = process.env.LANGUAGE ?? process.env.LC_ALL ?? process.env.LANG ?? '';
export const locale: 'ja' | 'en' = /^ja/i.test(lang) ? 'ja' : 'en';

const messages = locale === 'ja' ? ja : en;

export function t(key: MessageKey): string {
  return messages[key];
}
