import * as fs from 'node:fs';
import * as path from 'node:path';
import type { LanguageParser, ParseResult, ParseOptions } from './types.ts';
import { getWasmPath } from './wasm/wasm-loader.ts';

// 1. Parser Orchestrator

export class CodebaseParser {
  private parsers: Record<string, LanguageParser> = {};

  async initialize(fileExtensions?: Set<string> | string[]): Promise<void> {
    const extensions = fileExtensions ? new Set(fileExtensions) : null;

    const loadParser = async (exts: string[], importPath: string, className: string, wasmName: string) => {
      if (extensions) {
        const needsLoad = exts.some(ext => extensions.has(ext));
        if (!needsLoad) return;
      }

      try {
        const module = await import(importPath);
        const constructor = module[className];
        const parser = new constructor();
        await parser.initialize(await getWasmPath(wasmName));
        for (const ext of exts) {
          this.parsers[ext] = parser;
        }
      } catch (err: any) {
        console.error(`Failed to initialize parser for ${wasmName}: ${err.message}`);
      }
    };

    // Sequential initialization to prevent global tree-sitter WASM initialization conflicts
    await loadParser(['.ts', '.tsx'], './parsers/typescript.ts', 'TypeScriptParser', 'typescript');
    await loadParser(['.js', '.jsx'], './parsers/javascript.ts', 'JavaScriptParser', 'javascript');
    await loadParser(['.py'], './parsers/python.ts', 'PythonParser', 'python');
    await loadParser(['.go'], './parsers/go.ts', 'GoParser', 'go');
    await loadParser(['.java'], './parsers/java.ts', 'JavaParser', 'java');
    await loadParser(['.cs'], './parsers/csharp.ts', 'CSharpParser', 'csharp');
    await loadParser(['.rs'], './parsers/rust.ts', 'RustParser', 'rust');
  }

  getParserForFile(filePath: string): LanguageParser | null {
    const ext = path.extname(filePath);
    return this.parsers[ext] || null;
  }

  parseFile(filePath: string, code: string, options?: ParseOptions): ParseResult {
    const parser = this.getParserForFile(filePath);
    if (!parser) {
      return { imports: [], exports: [], symbols: [] };
    }
    return parser.parse(code, options);
  }
}
