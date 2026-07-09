import * as path from 'node:path';
import { loadConfig } from '../config/config.ts';

export function printHelp() {
  console.log(`
Code Survey - Deterministically maps codebases for AI coding agents.

Usage:
  code-survey [options]

Options:
  --root, -r         The root directory of the codebase to map (default: current directory)
  --output, -o       The output path for the mapped artifact (default: <root>/code-survey.json)
  --config, -c       Path to a configuration file containing survey option profiles (JSON or YAML)
  --exclude, -e      Comma-separated list of additional file/folder patterns to exclude
  --format, -f       The output format: 'json', 'yaml', 'markdown', or 'mermaid' (default: inferred from output path)
  --internal-vars    Include internal/local variables in the mapping (default: false)
  --include-docs     Extract docstring/JSDoc summaries for class/function symbols (default: false)
  --include-signatures Extract function/method parameters and return types (default: false)
  --include-toc      Generate a Table of Contents and navigation links in Markdown format (default: false)
  --split            Split the output into multiple modular files (default: false)
  --max-depth <n>    Maximum directory traversal depth (default: unlimited)
  --symbols-filter   Comma-separated list of symbol types to keep (e.g. class,method) (default: all)
  --diff <target>    Generate map only for files changed since <target> (default: HEAD). Staged/unstaged files are always included.
  --remote <url>     Clone and map a remote Git repository (url/ssh path)
  --ref <name>       The branch, tag, or commit hash to check out when mapping a remote repository
  --watch, -w        Watch for file changes and automatically regenerate surveys (default: false)
  --mcp              Run the built-in MCP (Model Context Protocol) stdio server (default: false)
  --help, -h         Show this help message
`);
}

export async function parseCliArgs(args: string[], cwd: string) {
  let root = cwd;
  let configPath: string | null = null;

  // Pre-scan for root and config args to resolve paths correctly
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' || args[i] === '-r') {
      if (args[i + 1]) root = args[i + 1];
    } else if (args[i] === '--config' || args[i] === '-c') {
      if (args[i + 1]) configPath = args[i + 1];
    }
  }

  const absoluteRoot = path.resolve(root);

  const loadedConfig = await loadConfig(configPath, absoluteRoot);

  let isMultiSurvey = false;
  let surveysList: any[] = [];
  let configOptions: any = {};

  if (loadedConfig) {
    if (Array.isArray(loadedConfig)) {
      isMultiSurvey = true;
      surveysList = loadedConfig;
    } else if (Array.isArray(loadedConfig.surveys)) {
      isMultiSurvey = true;
      surveysList = loadedConfig.surveys;
    } else {
      configOptions = loadedConfig;
    }
  }

  // Set default values from config options (for single survey mode)
  let output = configOptions.output;
  let excludes = configOptions.excludes || [];
  let format = configOptions.format;
  let includeInternalVars = configOptions.includeInternalVars ?? false;
  let includeDocs = configOptions.includeDocs ?? false;
  let includeSignatures = configOptions.includeSignatures ?? false;
  let includeToc = configOptions.includeToc ?? false;
  let split = configOptions.split ?? false;
  let maxDepth = configOptions.maxDepth;
  let symbolsFilter = configOptions.symbolsFilter;
  let diff = configOptions.diff;
  let remote = configOptions.remote;
  let ref = configOptions.ref;
  let watchMode = configOptions.watch ?? false;
  let mcpMode = configOptions.mcp ?? false;

  let hasCliOverrides = false;

  // Command line overrides
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--root' || arg === '-r') {
      i++;
    } else if (arg === '--config' || arg === '-c') {
      i++;
    } else {
      hasCliOverrides = true;
      if (arg === '--output' || arg === '-o') {
        output = args[++i];
      } else if (arg === '--exclude' || arg === '-e') {
        const patterns = args[++i];
        if (patterns) {
          excludes = [
            ...excludes,
            ...patterns.split(',').map(p => p.trim())
          ];
        }
      } else if (arg === '--format' || arg === '-f') {
        const val = args[++i];
        if (val === 'json' || val === 'yaml' || val === 'markdown' || val === 'mermaid') {
          format = val;
        } else {
          console.error(`Error: format must be 'json', 'yaml', 'markdown', or 'mermaid', got '${val}'.`);
          process.exit(1);
        }
      } else if (arg === '--internal-vars') {
        includeInternalVars = true;
      } else if (arg === '--include-docs') {
        includeDocs = true;
      } else if (arg === '--include-signatures') {
        includeSignatures = true;
      } else if (arg === '--include-toc') {
        includeToc = true;
      } else if (arg === '--split') {
        split = true;
      } else if (arg === '--watch' || arg === '-w') {
        watchMode = true;
      } else if (arg === '--mcp') {
        mcpMode = true;
      } else if (arg === '--max-depth') {
        const val = args[++i];
        maxDepth = parseInt(val, 10);
        if (isNaN(maxDepth)) {
          console.error(`Error: --max-depth must be a number, got '${val}'.`);
          process.exit(1);
        }
      } else if (arg === '--symbols-filter') {
        const val = args[++i];
        if (val) {
          symbolsFilter = val.split(',').map(s => s.trim());
        }
      } else if (arg === '--diff') {
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          diff = nextArg;
          i++;
        } else {
          diff = true;
        }
      } else if (arg === '--remote') {
        remote = args[++i];
      } else if (arg === '--ref') {
        ref = args[++i];
      } else {
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
      }
    }
  }

  return {
    absoluteRoot,
    isMultiSurvey,
    surveysList,
    hasCliOverrides,
    options: {
      output,
      excludes,
      format,
      includeInternalVars,
      includeDocs,
      includeSignatures,
      includeToc,
      split,
      maxDepth,
      symbolsFilter,
      diff,
      remote,
      ref,
      watchMode,
      mcpMode
    }
  };
}
