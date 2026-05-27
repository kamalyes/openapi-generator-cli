import type { BuildContext } from '../types.js';
import type { GeneratedFile } from './model-generator.js';
import { targetKey } from '../build-context.js';

export function generateDocsFiles(context: BuildContext): GeneratedFile[] {
  const byTarget = new Map<string, string[]>();
  for (const operation of context.operations) {
    const key = targetKey(operation.target);
    const lines = byTarget.get(key) ?? [];
    lines.push(`- \`${operation.method.toUpperCase()} ${operation.path}\` ${operation.operation.summary ?? ''}`.trim());
    byTarget.set(key, lines);
  }

  return Array.from(byTarget.entries()).map(([key, lines]) => ({
    filePath: `docs/${key}.md`,
    content: [`# ${key}`, '', ...lines.sort()].join('\n'),
  }));
}
