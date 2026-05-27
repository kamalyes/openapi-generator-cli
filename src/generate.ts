import type { GeneratorOptions } from './types.js';
import { buildContext } from './build-context.js';
import { generateApiFiles, apiIndexFiles } from './generators/api-generator.js';
import { generateDocsFiles } from './generators/docs-generator.js';
import { generateModelFiles, modelIndexFiles, type GeneratedFile } from './generators/model-generator.js';
import { loadOpenApiDocuments } from './openapi-loader.js';
import { cleanOutput, writeProject } from './writers/write-project.js';
import { staticFiles } from './writers/static-files.js';

export async function generate(options: GeneratorOptions): Promise<void> {
  const docs = await loadOpenApiDocuments(options);
  const context = buildContext(docs);
  const modelFiles = generateModelFiles(context);
  const apiFiles = generateApiFiles(context);
  const files: GeneratedFile[] = [
    ...modelFiles,
    ...modelIndexFiles(modelFiles),
    ...apiFiles,
    ...apiIndexFiles(apiFiles),
    ...staticFiles(),
  ];

  if (options.docs) {
    files.push(...generateDocsFiles(context));
  }

  if (options.clean) {
    await cleanOutput(options.output);
  }

  await writeProject(options.output, files);

  for (const warning of context.warnings) {
    console.warn(`[warn] ${warning}`);
  }

  console.log(
    `Generated ${files.length} files from ${docs.length} OpenAPI document(s) into ${options.output}`,
  );
}
