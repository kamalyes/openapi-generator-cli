# openapi-generator-ts-cli

A lightweight TypeScript CLI that reads OpenAPI or Swagger documents and writes a TypeScript Axios-style client.

This package is generic. It does not contain project-specific module names, schema prefixes, or custom output rules. Swagger/OpenAPI documents are the source of truth.

## Usage

```bash
npm run build
node dist/cli.js generate \
  --swagger-glob "../openapi/**/*.swagger.yaml" \
  --output "../generate" \
  --clean
```

## Options

- `--input <file-or-url>`: read one OpenAPI document from a local file or URL.
- `--swagger-glob <glob>`: read many local OpenAPI documents.
- `--output <dir>`: output directory. Defaults to `generate`.
- `--docs`: write module-level Markdown docs. Disabled by default.
- `--clean`: remove generated output folders before writing.

## Output Shape

```text
generate/
  apis/
    <tag-api>.ts
    index.ts
  models/
    <source-dir>/
      <source-file>.ts
      index.ts
    <shared-schema-namespace>/
      common.ts
      index.ts
    index.ts
  enums/
    common.ts
    index.ts
  base.ts
  common.ts
  configuration.ts
  api.ts
  index.ts
```

Every generated directory has an `index.ts` export file.

## Comments

Generated files preserve Swagger/OpenAPI comments:

- API methods use operation `summary` and `description`.
- Method parameters use parameter `description` or `title`.
- Models, enums, and model properties use schema `description` or `title`.
