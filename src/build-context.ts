import type {
  BuildContext,
  HttpMethod,
  LoadedDocument,
  ModelDefinition,
  OpenApiDocument,
  OperationDefinition,
  SchemaObject,
  TypeTarget,
} from './types.js';
import { refName, safeFileBase, toKebabCase, toPascalCase } from './utils/names.js';

const HTTP_METHODS = new Set<HttpMethod>([
  'get',
  'put',
  'post',
  'delete',
  'patch',
  'head',
  'options',
]);

export function buildContext(docs: LoadedDocument[]): BuildContext {
  const warnings: string[] = [];
  const models: ModelDefinition[] = [];
  const modelBySchema = new Map<string, ModelDefinition>();
  const ownerBySchema = new Map<string, LoadedDocument>();

  for (const loaded of docs) {
    const schemas = collectSchemas(loaded.document);
    for (const [schemaName, schema] of Object.entries(schemas)) {
      if (!ownerBySchema.has(schemaName)) {
        ownerBySchema.set(schemaName, loaded);
        const model = createModel(schemaName, schema, loaded);
        models.push(model);
        modelBySchema.set(schemaName, model);
      }
    }
  }

  const operations: OperationDefinition[] = [];
  for (const loaded of docs) {
    for (const [urlPath, pathItem] of Object.entries(loaded.document.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const normalizedMethod = method.toLowerCase() as HttpMethod;
        if (!HTTP_METHODS.has(normalizedMethod)) continue;
        operations.push({
          method: normalizedMethod,
          path: urlPath,
          operation,
          target: {
            modulePath: [],
            fileBase: apiFileBase(operation.tags?.[0]),
          },
        });
      }
    }
  }

  return { models, operations, modelBySchema, warnings };
}

function collectSchemas(document: OpenApiDocument): Record<string, SchemaObject> {
  return {
    ...(document.definitions ?? {}),
    ...(document.components?.schemas ?? {}),
  };
}

function createModel(
  schemaName: string,
  schema: SchemaObject,
  loaded: LoadedDocument,
): ModelDefinition {
  const typeName = toPascalCase(schemaName);
  const namespace = schemaNamespace(schemaName);

  return {
    schemaName,
    typeName,
    schema,
    target: modelTarget(namespace, loaded),
  };
}

export function refsInSchema(schema: SchemaObject | undefined): string[] {
  if (!schema) return [];
  const refs = new Set<string>();
  const visit = (node: SchemaObject | undefined): void => {
    if (!node) return;
    if (node.$ref) refs.add(refName(node.$ref));
    visit(node.items);
    if (typeof node.additionalProperties === 'object') visit(node.additionalProperties);
    for (const child of Object.values(node.properties ?? {})) visit(child);
    for (const child of [...(node.allOf ?? []), ...(node.oneOf ?? []), ...(node.anyOf ?? [])]) visit(child);
  };
  visit(schema);
  return Array.from(refs);
}

export function stableOperationName(method: HttpMethod, urlPath: string, operationId?: string): string {
  if (operationId) return toPascalCase(operationId).replace(/^./, (c) => c.toLowerCase());
  return toPascalCase(`${method}_${urlPath}`).replace(/^./, (c) => c.toLowerCase());
}

export function targetKey(target: TypeTarget): string {
  return [target.rootDir ?? 'models', ...target.modulePath, target.fileBase].join('/');
}

export function modelFilePath(target: TypeTarget): string {
  return [target.rootDir ?? 'models', ...target.modulePath, safeFileBase(target.fileBase)].join('/');
}

function apiFileBase(tag: string | undefined): string {
  return safeFileBase(`${tag || 'Default'}Api`);
}

function schemaNamespace(schemaName: string): string | undefined {
  const snakeMatch = schemaName.match(/^([a-z][a-z0-9_]+)[A-Z]/);
  if (snakeMatch) return toKebabCase(snakeMatch[1]);

  const camelMatch = schemaName.match(/^([a-z][a-z0-9]*)(?=[A-Z])/);
  if (camelMatch) return toKebabCase(camelMatch[1]);

  return undefined;
}

function modelTarget(namespace: string | undefined, loaded: LoadedDocument): TypeTarget {
  if (namespace === 'enums') {
    return { rootDir: 'enums', modulePath: [], fileBase: 'common' };
  }

  if (namespace && namespace !== loaded.sourceModule) {
    return { rootDir: 'models', modulePath: [namespace], fileBase: 'common' };
  }

  return { rootDir: 'models', modulePath: [loaded.sourceModule], fileBase: loaded.sourceName };
}
