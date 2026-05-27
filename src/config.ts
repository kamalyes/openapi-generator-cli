import path from 'node:path';
import { Command } from 'commander';
import type { GeneratorOptions } from './types.js';

export function parseOptions(argv: string[], cwd = process.cwd()): GeneratorOptions {
  const program = new Command();

  program
    .name('openapi-generator-ts-cli')
    .description('Generate a TypeScript OpenAPI client')
    .version('0.1.0');

  program
    .command('generate')
    .description('generate TypeScript client files')
    .option('-i, --input <file-or-url...>', 'OpenAPI JSON/YAML file or URL')
    .option('-g, --swagger-glob <glob>', 'glob for local OpenAPI JSON/YAML files')
    .option('-o, --output <dir>', 'output directory', 'generate')
    .option('--docs', 'generate Markdown docs', false)
    .option('--clean', 'remove generated output folders before writing', false)
    .action((raw) => {
      const inputs = Array.isArray(raw.input) ? raw.input : raw.input ? [raw.input] : [];
      const options: GeneratorOptions = {
        inputs,
        swaggerGlob: raw.swaggerGlob,
        output: path.resolve(cwd, raw.output),
        docs: Boolean(raw.docs),
        clean: Boolean(raw.clean),
        cwd,
      };

      validateOptions(options);
      program.setOptionValue('__generatorOptions', options);
    });

  program.parse(argv);
  const options = program.getOptionValue('__generatorOptions') as GeneratorOptions | undefined;
  if (!options) {
    program.help();
    throw new Error('No command selected.');
  }
  return options;
}

function validateOptions(options: GeneratorOptions): void {
  if (!options.inputs.length && !options.swaggerGlob) {
    throw new Error('Provide --input or --swagger-glob.');
  }
}
