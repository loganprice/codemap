import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { scanDirectory } from './scanner.ts';
import { CodebaseParser } from './parser.ts';
import { parsePackageDependencies } from './package-parser.ts';
import { resolveImports } from './resolver.ts';
import { writeSurveyOutput } from './writer.ts';
import { loadCache, saveCache } from './cache/cache.ts';
import { getGitChangedFiles } from './git/git.ts';
import type { CodeSurveySchema, FileEntry, NamespaceEntry, SymbolEntry, CodeSurveyResult } from './types.ts';

export interface CodeSurveyOptions {
  root: string;
  output?: string;
  excludes?: string[];
  format?: 'json' | 'yaml' | 'markdown' | 'mermaid';
  includeInternalVars?: boolean;
  includeDocs?: boolean;
  includeSignatures?: boolean;
  maxDepth?: number;
  symbolsFilter?: string[];
  diff?: boolean | string;
  includeToc?: boolean;
  remote?: string;
  ref?: string;
  split?: boolean;
}


export async function createCodeSurvey(options: CodeSurveyOptions): Promise<CodeSurveyResult> {
  let rootDir = path.resolve(options.root);
  let tempDir: string | null = null;

  try {
    if (options.remote) {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-survey-remote-'));
      const refArg = options.ref ? `--branch ${options.ref} ` : '';
      execSync(`git clone --depth 1 ${refArg}${options.remote} "${tempDir}"`, { stdio: ['ignore', 'ignore', 'pipe'] });
      rootDir = tempDir;
    }

    // Load .codesurveyignore if it exists
    const ignoreFile = path.join(rootDir, '.codesurveyignore');
    const ignoreExcludes: string[] = [];
    if (fs.existsSync(ignoreFile)) {
      const content = fs.readFileSync(ignoreFile, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          ignoreExcludes.push(trimmed);
        }
      }
    }
    const excludes = [...(options.excludes || []), ...ignoreExcludes];

    // 1. Scan directory
    const scannedFiles = scanDirectory(rootDir, excludes, options.maxDepth);
    let filesToProcess = scannedFiles;
    if (options.diff) {
      const changedFiles = getGitChangedFiles(rootDir, options.diff);
      filesToProcess = scannedFiles.filter(f => changedFiles.has(f.relativePath));
    }

    const symbolsCount = {
      class: 0,
      interface: 0,
      struct: 0,
      method: 0,
      function: 0,
      variable: 0,
      type: 0
    };

    // 2. Initialize parser with detected file extensions for lazy loading
    const parser = new CodebaseParser();
    const extensionsToInitialize = new Set(filesToProcess.map(f => path.extname(f.relativePath)));
    await parser.initialize(extensionsToInitialize);

    const files: Record<string, FileEntry> = {};
    const namespaces: Record<string, NamespaceEntry> = {};
    const detectedLanguages = new Set<string>();

    // Setup caching
    const { cache, cacheDir, cacheFile } = loadCache(rootDir, options);



    // 3. Filter and parse supported files
    const supportedExtensions = new Set([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.go',
      '.java',
      '.cs',
      '.rs'
    ]);

    for (const file of filesToProcess) {
      const ext = path.extname(file.relativePath);
      if (!supportedExtensions.has(ext)) {
        continue;
      }

      let lang = '';
      if (ext === '.ts' || ext === '.tsx') {
        lang = 'typescript';
      } else if (ext === '.js' || ext === '.jsx') {
        lang = 'javascript';
      } else if (ext === '.py') {
        lang = 'python';
      } else if (ext === '.go') {
        lang = 'go';
      } else if (ext === '.java') {
        lang = 'java';
      } else if (ext === '.cs') {
        lang = 'csharp';
      } else if (ext === '.rs') {
        lang = 'rust';
      }

      if (lang) {
        detectedLanguages.add(lang);
      }

      try {
        let parseResult: any;
        const cached = cache.files[file.relativePath];
        if (cached && cached.hash === file.hash) {
          parseResult = cached;
        } else {
          const code = fs.readFileSync(file.absolutePath, 'utf-8');
          parseResult = parser.parseFile(file.relativePath, code, {
            includeInternalVars: options.includeInternalVars,
            includeDocs: options.includeDocs,
            includeSignatures: options.includeSignatures
          });

          cache.files[file.relativePath] = {
            hash: file.hash,
            imports: parseResult.imports,
            exports: parseResult.exports,
            symbols: parseResult.symbols,
            namespace: parseResult.namespace
          };
        }

        const filterSymbols = (list: SymbolEntry[]) => {
          if (!options.symbolsFilter) return list;
          return list.filter(s => options.symbolsFilter!.includes(s.type));
        };

        const filteredExports = filterSymbols(parseResult.exports);
        const filteredSymbols = filterSymbols(parseResult.symbols);

        for (const exp of filteredExports) {
          if (exp.type in symbolsCount) {
            symbolsCount[exp.type as keyof typeof symbolsCount]++;
          }
        }
        for (const sym of filteredSymbols) {
          if (sym.type in symbolsCount) {
            symbolsCount[sym.type as keyof typeof symbolsCount]++;
          }
        }

        files[file.relativePath] = {
          hash: file.hash,
          imports: parseResult.imports,
          exports: filteredExports,
          symbols: filteredSymbols
        };

        // Handle namespace
        if (parseResult.namespace) {
          const ns = parseResult.namespace;
          if (!namespaces[ns]) {
            namespaces[ns] = { files: [], exports: [] };
          }
          if (!namespaces[ns].files.includes(file.relativePath)) {
            namespaces[ns].files.push(file.relativePath);
          }
          for (const exp of filteredExports) {
            if (!namespaces[ns].exports.includes(exp.name)) {
              namespaces[ns].exports.push(exp.name);
            }
          }
        }
      } catch {
        // Ignore reading or parsing errors for robustness
      }
    }

    // Save cache if not a remote repo
    if (!options.remote) {
      saveCache(cacheDir, cacheFile, cache);
    }

    // 4. Parse package dependencies
    const packageDependencies = parsePackageDependencies(rootDir);

    // 5. Resolve links
    const { externalImports, internalLinks } = resolveImports(
      files,
      namespaces,
      packageDependencies
    );

    let projectName = path.basename(rootDir) || 'project';
    if (options.remote) {
      const parts = options.remote.split('/');
      const last = parts[parts.length - 1];
      if (last) {
        projectName = last.replace(/\.git$/, '');
      }
    }

    // 6. Build schema object
    const schemaObj: CodeSurveySchema = {
      version: '1.0.0',
      $schema: 'https://raw.githubusercontent.com/username/code-survey/main/schema.json',
      project: {
        name: projectName,
        languages: Array.from(detectedLanguages),
        root: '.'
      },
      packageDependencies,
      files,
      namespaces,
      externalImports,
      internalLinks
    };

    // 7. Write output deterministically if output path is specified
    writeSurveyOutput(schemaObj, options);

    return {
      filesCount: Object.keys(files).length,
      symbolsCount,
      data: schemaObj
    };
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
