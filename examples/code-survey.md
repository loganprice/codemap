# Project: bold-hypatia
Languages: typescript

## Table of Contents
- [Dependencies](#dependencies)
- [Files](#files)
  - [src/index.ts](#srcindexts)
  - [src/parser.ts](#srcparserts)
  - [src/parsers/csharp.ts](#srcparserscsharpts)
  - [src/parsers/go.ts](#srcparsersgots)
  - [src/parsers/java.ts](#srcparsersjavats)
  - [src/parsers/javascript.ts](#srcparsersjavascriptts)
  - [src/parsers/python.ts](#srcparserspythonts)
  - [src/parsers/rust.ts](#srcparsersrustts)
  - [src/parsers/typescript.ts](#srcparserstypescriptts)
  - [src/resolver.ts](#srcresolverts)
  - [src/scanner.ts](#srcscannerts)
  - [src/types.ts](#srctypests)
  - [src/utils/wasm-loader.ts](#srcutilswasmloaderts)
  - [src/writer.ts](#srcwriterts)
  - [tests/integration.test.ts](#testsintegrationtestts)
  - [tests/package-parser.test.ts](#testspackageparsertestts)
  - [tests/parsers.test.ts](#testsparserstestts)
  - [tests/remote.test.ts](#testsremotetestts)
  - [tests/resolver.test.ts](#testsresolvertestts)
  - [tests/scanner.test.ts](#testsscannertestts)
  - [tests/wasm-loader.test.ts](#testswasmloadertestts)
  - [tests/writer.test.ts](#testswritertestts)
- [Links](#links)

## Dependencies
- **npm**: @types/node (^20.11.0), tree-sitter-wasms (^0.1.11), typescript (^5.3.3), web-tree-sitter (^0.22.4), yaml (^2.4.5)

## Files

### `src/index.ts`
Hash: a5b15e218895e1c803187726c06d124a11d186a0af754486b736a5e678230c6e
- **Imports**:
  - `./parser.ts`: CodebaseParser, parsePackageDependencies
  - `./resolver.ts`: resolveImports
  - `./scanner.ts`: scanDirectory
  - `./types.ts`: CodeSurveyResult, CodeSurveySchema, FileEntry, NamespaceEntry, SymbolEntry
  - `./writer.ts`: generateDependenciesMarkdown, generateDeterministicJson, generateDeterministicMarkdown, generateDeterministicMermaid, generateDeterministicYaml, generateFilesMarkdown, generateLinksMarkdown, generateNamespacesMarkdown, generateProjectMarkdown
  - `node:child_process`: execSync
  - `node:crypto`: crypto
  - `node:fs`: fs
  - `node:os`: os
  - `node:path`: path
- **Exports**:
  - `CodeSurveyOptions` (type, Ln 22-37)
  - `createCodeSurvey(options: CodeSurveyOptions): Promise<CodeSurveyResult>` (function, Ln 62-368)
- **Symbols**:
  - `getGitChangedFiles(rootDir: string, diffTarget: string | boolean): Set<string>` (function, Ln 39-60)

[Back to Table of Contents](#table-of-contents)

### `src/parser.ts`
Hash: d5608f905392101a6f30da95366a247f13db0e0ba9f0fa5c0df2e6080fc9b70b
- **Imports**:
  - `./parsers/csharp.ts`: CSharpParser
  - `./parsers/go.ts`: GoParser
  - `./parsers/java.ts`: JavaParser
  - `./parsers/javascript.ts`: JavaScriptParser
  - `./parsers/python.ts`: PythonParser
  - `./parsers/rust.ts`: RustParser
  - `./parsers/typescript.ts`: TypeScriptParser
  - `./types.ts`: LanguageParser, PackageDependencies, ParseOptions, ParseResult
  - `./utils/wasm-loader.ts`: getWasmPath
  - `node:fs`: fs
  - `node:path`: path
- **Exports**:
  - `CodebaseParser` (class, Ln 150-194)
  - `parsePackageDependencies(dir: string): PackageDependencies` (function, Ln 15-146)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/csharp.ts`
Hash: 5529207c240ced31f291a7bd71c4660a1933a41f4415867ee3f16bd472d1f09a
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `CSharpParser` (class, Ln 19-144)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isCSharpPublic(node: Parser.SyntaxNode): boolean` (function, Ln 14-17)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/go.ts`
Hash: 34e6b8ee8a576afc6eb9df2a3c77fd2097502ef3f7a7ac0c59b882dd5614bf47
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `GoParser` (class, Ln 21-162)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isGoExported(name: string): boolean` (function, Ln 14-19)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/java.ts`
Hash: 34dc5d598bcadaf2046e7d4978c4f71ecb3d88e800ff247aba310f46c600ca24
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `JavaParser` (class, Ln 22-134)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isJavaPublic(node: Parser.SyntaxNode): boolean` (function, Ln 14-20)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/javascript.ts`
Hash: f58f254e21ad5172e959cd0a4abfec56fa39c6102c768e6d94e12632626a9713
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `JavaScriptParser` (class, Ln 14-174)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/python.ts`
Hash: 40f9436b88269c51a3c6e53e819ffd1c5af6dfd56f32086ef223cbb2e810d54c
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `PythonParser` (class, Ln 14-155)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/rust.ts`
Hash: ac9f16b2a4ca7d829f088aacd04c75c02e429e583af1db34dfee11edd9daa153
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `RustParser` (class, Ln 14-183)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/parsers/typescript.ts`
Hash: 4f1d7bfae74aadef9757080c354cbd48e354965b157772f31b55fc302c8dcc34
- **Imports**:
  - `../types.ts`: ImportEntry, LanguageParser, ParseOptions, ParseResult, SymbolEntry
  - `../types.ts`: formatDocstring, formatLocation
  - `web-tree-sitter`: Parser
- **Exports**:
  - `TypeScriptParser` (class, Ln 14-186)
- **Symbols**:
  - `ensureParserInit()` (function, Ln 7-12)
  - `isParserInitialized` (variable, Ln 5)

[Back to Table of Contents](#table-of-contents)

### `src/resolver.ts`
Hash: 26de28af071ddba07dbb1d441293914411ad319c7ef590d315b1f28480774000
- **Imports**:
  - `./types.ts`: FileEntry, NamespaceEntry, PackageDependencies
  - `node:path`: path
- **Exports**:
  - `resolveImports(
  files: Record<string, FileEntry>,
  namespaces: Record<string, NamespaceEntry>,
  packageDeps: PackageDependencies
): {
  externalImports: Record<string, string[]>;
  internalLinks: Record<string, string[]>;
}` (function, Ln 4-184)
- **Symbols**:
  - `isExternal(source: string): boolean` (function, Ln 45-53)

[Back to Table of Contents](#table-of-contents)

### `src/scanner.ts`
Hash: eab5916a53d5e8feff3fd5e7a9c59afaddecefcbdc27646890e49c2c6c04ffe7
- **Imports**:
  - `node:crypto`: crypto
  - `node:fs`: fs
  - `node:path`: path
- **Exports**:
  - `calculateHash(filePath: string): string` (function, Ln 24-27)
  - `scanDirectory(
  rootDir: string,
  customExcludes: string[] = [],
  maxDepth?: number
): ScannedFile[]` (function, Ln 29-72)
  - `ScannedFile` (type, Ln 5-9)
- **Symbols**:
  - `DEFAULT_IGNORED_DIRS` (variable, Ln 11-22)
  - `walk(currentDir: string, currentDepth = 0)` (function, Ln 38-68)

[Back to Table of Contents](#table-of-contents)

### `src/types.ts`
Hash: b44ac3cd1f0df850e3c4727f146d1773b7605034b1efe6dd485a0cd2f9bf1d5b
- **Exports**:
  - `CodeSurveyResult` (type, Ln 93-104)
  - `CodeSurveySchema` (type, Ln 63-72)
  - `FileEntry` (type, Ln 51-56)
  - `formatDocstring(text: string): string` (function, Ln 32-49)
  - `formatLocation(start: number, end: number): string` (function, Ln 28-30)
  - `ImportEntry` (type, Ln 15-18)
  - `LanguageParser` (type, Ln 88-91)
  - `NamespaceEntry` (type, Ln 58-61)
  - `PackageDependencies` (type, Ln 7-13)
  - `ParseOptions` (type, Ln 74-79)
  - `ParseResult` (type, Ln 81-86)
  - `ProjectMetadata` (type, Ln 1-5)
  - `SymbolEntry` (type, Ln 20-26)

[Back to Table of Contents](#table-of-contents)

### `src/utils/wasm-loader.ts`
Hash: 3cbcff473233d1550543b55cf97168265a07716db39bffff32663b008d6edb76
- **Imports**:
  - `node:fs`: fs
  - `node:os`: os
  - `node:path`: path
  - `node:url`: fileURLToPath
- **Exports**:
  - `getWasmPath(language: string): Promise<string>` (function, Ln 18-79)
- **Symbols**:
  - `CDN_BASE_URL` (variable, Ln 16)
  - `WASM_FILE_MAP` (variable, Ln 6-14)

[Back to Table of Contents](#table-of-contents)

### `src/writer.ts`
Hash: bd4325817cd37eb6afa18da39897001fc6f7691d74bb7900e6a56aecac4f6768
- **Imports**:
  - `./types.ts`: CodeSurveySchema, FileEntry, NamespaceEntry
  - `yaml`: stringify
- **Exports**:
  - `generateDependenciesMarkdown(data: CodeSurveySchema): string` (function, Ln 132-146)
  - `generateDeterministicJson(data: CodeSurveySchema): string` (function, Ln 77-80)
  - `generateDeterministicMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string` (function, Ln 223-264)
  - `generateDeterministicMermaid(data: CodeSurveySchema): string` (function, Ln 87-126)
  - `generateDeterministicYaml(data: CodeSurveySchema): string` (function, Ln 82-85)
  - `generateFilesMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string` (function, Ln 148-193)
  - `generateLinksMarkdown(data: CodeSurveySchema): string` (function, Ln 210-221)
  - `generateNamespacesMarkdown(data: CodeSurveySchema): string` (function, Ln 195-208)
  - `generateProjectMarkdown(data: CodeSurveySchema): string` (function, Ln 128-130)
  - `sortCodeSurveyData(data: CodeSurveySchema): CodeSurveySchema` (function, Ln 22-75)
- **Symbols**:
  - `sortObjectKeys(obj: any): any` (function, Ln 5-20)

[Back to Table of Contents](#table-of-contents)

### `tests/integration.test.ts`
Hash: eb6d5ddadc2a859cd5332c172fc762e634d7bc72d41a920245fd106508aeef74
- **Imports**:
  - `../src/index.ts`: createCodeSurvey
  - `node:assert`: assert
  - `node:child_process`: execSync
  - `node:fs`: fs
  - `node:path`: path
  - `node:test`: test
  - `yaml`: parse

[Back to Table of Contents](#table-of-contents)

### `tests/package-parser.test.ts`
Hash: 97dd9e8e959f7abbdb7953bfbbef7743b4dec40d3f9a6391ba13cfbcb3ffae17
- **Imports**:
  - `../src/parser.ts`: parsePackageDependencies
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/parsers.test.ts`
Hash: a307e980d58c65490fa60cff169792757f225e89737234fa8d47e84399ab12b6
- **Imports**:
  - `../src/parsers/csharp.ts`: CSharpParser
  - `../src/parsers/go.ts`: GoParser
  - `../src/parsers/java.ts`: JavaParser
  - `../src/parsers/javascript.ts`: JavaScriptParser
  - `../src/parsers/python.ts`: PythonParser
  - `../src/parsers/rust.ts`: RustParser
  - `../src/parsers/typescript.ts`: TypeScriptParser
  - `../src/utils/wasm-loader.ts`: getWasmPath
  - `node:assert`: assert
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/remote.test.ts`
Hash: 3fa2dd8b4ec6e0a2589b197952791785716776053e21c4bb1438ee7551491948
- **Imports**:
  - `../src/index.ts`: createCodeSurvey
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:os`: os
  - `node:path`: path
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/resolver.test.ts`
Hash: 65cf32a0902937498da9c0f1626e59d89b7021dcf57bef20caf9fba7389e1964
- **Imports**:
  - `../src/resolver.ts`: resolveImports
  - `../src/types.ts`: FileEntry, NamespaceEntry, PackageDependencies
  - `node:assert`: assert
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/scanner.test.ts`
Hash: c097e41b86674c525597bf95bc0ad98ae93bd5416599b5df1dbd49a0c2f658f5
- **Imports**:
  - `../src/scanner.ts`: scanDirectory
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/wasm-loader.test.ts`
Hash: 49c0d02dbe091c5866a42bd6b6890020496df21bd47b4304101f66493b8523a4
- **Imports**:
  - `../src/utils/wasm-loader.ts`: getWasmPath
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:test`: test

[Back to Table of Contents](#table-of-contents)

### `tests/writer.test.ts`
Hash: 92b89ad69d24e1cd20d45ab3f699893ccfac601826772d58dda4b2eb0e816b69
- **Imports**:
  - `../src/types.ts`: CodeSurveySchema
  - `../src/writer.ts`: generateDeterministicJson, generateDeterministicMarkdown, generateDeterministicMermaid, generateDeterministicYaml
  - `node:assert`: assert
  - `node:test`: test
  - `yaml`: parse

[Back to Table of Contents](#table-of-contents)

## Links
- `src/index.ts:createCodeSurvey` -> `tests/integration.test.ts`, `tests/remote.test.ts`
- `src/parser.ts:CodebaseParser` -> `src/index.ts`
- `src/parser.ts:parsePackageDependencies` -> `src/index.ts`, `tests/package-parser.test.ts`
- `src/parsers/csharp.ts:CSharpParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/go.ts:GoParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/java.ts:JavaParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/javascript.ts:JavaScriptParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/python.ts:PythonParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/rust.ts:RustParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/parsers/typescript.ts:TypeScriptParser` -> `src/parser.ts`, `tests/parsers.test.ts`
- `src/resolver.ts:resolveImports` -> `src/index.ts`, `tests/resolver.test.ts`
- `src/scanner.ts:scanDirectory` -> `src/index.ts`, `tests/scanner.test.ts`
- `src/types.ts:CodeSurveyResult` -> `src/index.ts`
- `src/types.ts:CodeSurveySchema` -> `src/index.ts`, `src/writer.ts`, `tests/writer.test.ts`
- `src/types.ts:FileEntry` -> `src/index.ts`, `src/resolver.ts`, `src/writer.ts`, `tests/resolver.test.ts`
- `src/types.ts:ImportEntry` -> `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:LanguageParser` -> `src/parser.ts`, `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:NamespaceEntry` -> `src/index.ts`, `src/resolver.ts`, `src/writer.ts`, `tests/resolver.test.ts`
- `src/types.ts:PackageDependencies` -> `src/parser.ts`, `src/resolver.ts`, `tests/resolver.test.ts`
- `src/types.ts:ParseOptions` -> `src/parser.ts`, `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:ParseResult` -> `src/parser.ts`, `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:SymbolEntry` -> `src/index.ts`, `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:formatDocstring` -> `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/types.ts:formatLocation` -> `src/parsers/csharp.ts`, `src/parsers/go.ts`, `src/parsers/java.ts`, `src/parsers/javascript.ts`, `src/parsers/python.ts`, `src/parsers/rust.ts`, `src/parsers/typescript.ts`
- `src/utils/wasm-loader.ts:getWasmPath` -> `src/parser.ts`, `tests/parsers.test.ts`, `tests/wasm-loader.test.ts`
- `src/writer.ts:generateDependenciesMarkdown` -> `src/index.ts`
- `src/writer.ts:generateDeterministicJson` -> `src/index.ts`, `tests/writer.test.ts`
- `src/writer.ts:generateDeterministicMarkdown` -> `src/index.ts`, `tests/writer.test.ts`
- `src/writer.ts:generateDeterministicMermaid` -> `src/index.ts`, `tests/writer.test.ts`
- `src/writer.ts:generateDeterministicYaml` -> `src/index.ts`, `tests/writer.test.ts`
- `src/writer.ts:generateFilesMarkdown` -> `src/index.ts`
- `src/writer.ts:generateLinksMarkdown` -> `src/index.ts`
- `src/writer.ts:generateNamespacesMarkdown` -> `src/index.ts`
- `src/writer.ts:generateProjectMarkdown` -> `src/index.ts`
