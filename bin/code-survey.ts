#!/usr/bin/env node
import { createCodeSurvey } from '../src/index.ts';
import { runMcpServer } from '../src/mcp-server.ts';
import { parseCliArgs } from '../src/cli/cli-parser.ts';
import { startWatcher } from '../src/cli/watcher.ts';
import { reportTokenBudget } from '../src/cli/token-estimator.ts';
import * as path from 'node:path';

async function runSurvey(opts: {
  root: string;
  output: string;
  excludes: string[];
  format?: 'json' | 'yaml' | 'markdown' | 'mermaid';
  includeInternalVars: boolean;
  includeDocs: boolean;
  includeSignatures: boolean;
  includeToc: boolean;
  maxDepth?: number;
  symbolsFilter?: string[];
  diff?: boolean | string;
  remote?: string;
  ref?: string;
  split: boolean;
}) {
  const absoluteRoot = path.resolve(opts.root);
  const absoluteOutput = opts.output
    ? path.resolve(opts.output)
    : (opts.split ? path.join(absoluteRoot, 'code-survey-results') : path.join(absoluteRoot, 'code-survey.json'));

  if (opts.remote) {
    console.error(`Remote repository:   ${opts.remote}`);
    if (opts.ref) {
      console.error(`Ref/Branch:          ${opts.ref}`);
    }
  } else {
    console.error(`Mapping codebase at: ${absoluteRoot}`);
  }
  console.error(`Output target:       ${absoluteOutput}`);

  const result = await createCodeSurvey({
    root: absoluteRoot,
    output: absoluteOutput,
    excludes: opts.excludes,
    format: opts.format,
    includeInternalVars: opts.includeInternalVars,
    includeDocs: opts.includeDocs,
    includeSignatures: opts.includeSignatures,
    includeToc: opts.includeToc,
    maxDepth: opts.maxDepth,
    symbolsFilter: opts.symbolsFilter,
    diff: opts.diff,
    remote: opts.remote,
    ref: opts.ref,
    split: opts.split
  });

  console.error('Code Survey generated successfully!');

  // Report token budget
  reportTokenBudget(absoluteOutput, opts.format, opts.split, result);
}

async function main() {
  const { absoluteRoot, isMultiSurvey, surveysList, hasCliOverrides, options } = await parseCliArgs(process.argv.slice(2), process.cwd());

  const executeSurveys = async () => {
    if (isMultiSurvey && !hasCliOverrides) {
      console.error(`Running batch code surveys from configuration (${surveysList.length} targets)...`);
      for (const survey of surveysList) {
        console.error(`\n----------------------------------------`);
        const resolvedRoot = survey.root ? path.resolve(absoluteRoot, survey.root) : absoluteRoot;
        await runSurvey({
          root: resolvedRoot,
          output: survey.output ? path.resolve(resolvedRoot, survey.output) : '',
          excludes: survey.excludes || [],
          format: survey.format,
          includeInternalVars: survey.includeInternalVars ?? false,
          includeDocs: survey.includeDocs ?? false,
          includeSignatures: survey.includeSignatures ?? false,
          includeToc: survey.includeToc ?? false,
          maxDepth: survey.maxDepth,
          symbolsFilter: survey.symbolsFilter,
          diff: survey.diff,
          remote: survey.remote,
          ref: survey.ref,
          split: survey.split ?? false
        });
      }
    } else {
      await runSurvey({
        root: absoluteRoot,
        output: options.output || '',
        excludes: options.excludes,
        format: options.format,
        includeInternalVars: options.includeInternalVars,
        includeDocs: options.includeDocs,
        includeSignatures: options.includeSignatures,
        includeToc: options.includeToc,
        maxDepth: options.maxDepth,
        symbolsFilter: options.symbolsFilter,
        diff: options.diff,
        remote: options.remote,
        ref: options.ref,
        split: options.split
      });
    }
  };

  try {
    if (options.mcpMode) {
      runMcpServer();
    } else {
      await executeSurveys();
      if (options.watchMode) {
        startWatcher(
          absoluteRoot,
          isMultiSurvey,
          hasCliOverrides,
          surveysList,
          options.output,
          options.split,
          options.excludes,
          executeSurveys
        );
      }
    }
  } catch (err: any) {
    console.error(`Error generating code-survey: ${err.message}`);
    process.exit(1);
  }
}

main();
