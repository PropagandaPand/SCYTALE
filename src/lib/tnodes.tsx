/**
 * Translate a string that carries **bold** spans and render it as React nodes. Lets
 * a whole sentence stay ONE translation key (good translation quality: word order can
 * differ per language) while keeping the emphasis. The German source key and every
 * translation use `**…**` around the emphasised phrase.
 */
import { Fragment, type ReactNode } from 'react';
import { t } from './i18n';

export function tb(key: string, vars?: Record<string, string | number>): ReactNode {
  const parts = t(key, vars).split('**');
  return parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>));
}
