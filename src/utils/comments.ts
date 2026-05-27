export interface CommentSource {
  title?: string;
  description?: string;
}

export function commentText(source: CommentSource | undefined): string | undefined {
  const value = source?.description || source?.title;
  if (!value) return undefined;
  const text = normalizeComment(value).join('\n');
  return text || undefined;
}

export function jsDoc(lines: Array<string | undefined>, indent = ''): string {
  const normalized = lines.flatMap((line) => normalizeComment(line));
  if (normalized.length === 0) return '';

  return [
    `${indent}/**`,
    ...normalized.map((line) => `${indent} * ${line}`),
    `${indent} */`,
  ].join('\n');
}

export function jsDocFrom(source: CommentSource | undefined, indent = ''): string {
  return jsDoc([commentText(source)], indent);
}

function normalizeComment(value: string | undefined): string[] {
  if (!value) return [];
  const lines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd().replace(/\*\//g, '* /'));

  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();

  return lines.map((line) => line.trim());
}
