import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import YAML from 'yaml';
import { safeFileBase, toKebabCase } from './utils/names.js';
export async function loadOpenApiDocuments(options) {
    const sources = await collectSources(options);
    const docs = [];
    for (const source of sources) {
        const content = await readSource(source, options);
        const document = YAML.parse(content);
        const sourceInfo = describeSource(source, options.cwd);
        docs.push({ ...sourceInfo, document });
    }
    return docs;
}
async function collectSources(options) {
    const sources = [...options.inputs];
    if (options.swaggerGlob) {
        const matches = await fg(options.swaggerGlob, {
            cwd: options.cwd,
            absolute: true,
            onlyFiles: true,
            unique: true,
        });
        sources.push(...matches);
    }
    return Array.from(new Set(sources)).sort((a, b) => a.localeCompare(b));
}
async function readSource(source, options) {
    if (/^https?:\/\//i.test(source)) {
        const response = await fetch(source, { headers: options.headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
        }
        return response.text();
    }
    return fs.readFile(path.resolve(options.cwd, source), 'utf8');
}
function describeSource(source, cwd) {
    if (/^https?:\/\//i.test(source)) {
        const url = new URL(source);
        const base = path.posix.basename(url.pathname) || 'openapi';
        return {
            sourceId: source,
            sourceModule: 'remote',
            sourceName: safeFileBase(base.replace(/\.(json|ya?ml)$/i, '')),
        };
    }
    const absolutePath = path.resolve(cwd, source);
    const modulePart = path.basename(path.dirname(absolutePath));
    const base = path.basename(absolutePath).replace(/\.(json|ya?ml)$/i, '');
    return {
        absolutePath,
        sourceId: path.relative(cwd, absolutePath),
        sourceModule: toKebabCase(modulePart) || 'default',
        sourceName: safeFileBase(base),
    };
}
//# sourceMappingURL=openapi-loader.js.map