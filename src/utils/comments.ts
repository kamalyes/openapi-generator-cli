export interface CommentSource {
  title?: string;
  description?: string;
}

export function commentText(source: CommentSource | undefined): string | undefined {
  // OpenAPI 里 description 信息更完整；没有 description 时再退回 title
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
  // 注释内容来自外部 Swagger，必须规整换行并转义 */，避免生成非法 TS
  const lines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd().replace(/\*\//g, '* /'));

  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();

  return lines.map((line) => line.trim());
}
