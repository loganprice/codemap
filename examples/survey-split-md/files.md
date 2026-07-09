## Files

### `src/index.ts`
Hash: a5b15e218895e1c803187726c06d124a11d186a0af754486b736a5e678230c6e
- **Imports**:
  - `node:fs`: fs
  - `node:path`: path
  - `node:os`: os
  - `node:crypto`: crypto
  - `node:child_process`: execSync
  - `./scanner.ts`: scanDirectory
  - `./parser.ts`: CodebaseParser, parsePackageDependencies
  - `./resolver.ts`: resolveImports
  - `./writer.ts`: generateDeterministicJson, generateDeterministicYaml, generateDeterministicMarkdown, generateDeterministicMermaid, generateProjectMarkdown, generateDependenciesMarkdown, generateFilesMarkdown, generateNamespacesMarkdown, generateLinksMarkdown
  - `./types.ts`: CodeSurveySchema, FileEntry, NamespaceEntry, SymbolEntry, CodeSurveyResult
- **Exports**:
  - `CodeSurveyOptions` (type, Ln 22-37)
  - `createCodeSurvey(options: CodeSurveyOptions): Promise<CodeSurveyResult>` (function, Ln 62-368)
- **Symbols**:
  - `getGitChangedFiles(rootDir: string, diffTarget: string | boolean): Set<string>` (function, Ln 39-60)

### `src/parser.ts`
Hash: d5608f905392101a6f30da95366a247f13db0e0ba9f0fa5c0df2e6080fc9b70b
- **Imports**:
  - `node:fs`: fs
  - `node:path`: path
  - `./types.ts`: LanguageParser, ParseResult, PackageDependencies, ParseOptions
  - `./parsers/typescript.ts`: TypeScriptParser
  - `./parsers/python.ts`: PythonParser
  - `./parsers/go.ts`: GoParser
  - `./parsers/java.ts`: JavaParser
  - `./parsers/csharp.ts`: CSharpParser
  - `./parsers/rust.ts`: RustParser
  - `./parsers/javascript.ts`: JavaScriptParser
  - `./utils/wasm-loader.ts`: getWasmPath
- **Exports**:
  - `parsePackageDependencies(dir: string): PackageDependencies` (function, Ln 15-146)
  - `CodebaseParser` (class, Ln 150-194)

### `src/parsers/csharp.ts`
Hash: 5529207c240ced31f291a7bd71c4660a1933a41f4415867ee3f16bd472d1f09a
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `CSharpParser` (class, Ln 19-144)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)
  - `isCSharpPublic(node: Parser.SyntaxNode): boolean` (function, Ln 14-17)

### `src/parsers/go.ts`
Hash: 34e6b8ee8a576afc6eb9df2a3c77fd2097502ef3f7a7ac0c59b882dd5614bf47
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `GoParser` (class, Ln 21-162)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)
  - `isGoExported(name: string): boolean` (function, Ln 14-19)

### `src/parsers/java.ts`
Hash: 34dc5d598bcadaf2046e7d4978c4f71ecb3d88e800ff247aba310f46c600ca24
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `JavaParser` (class, Ln 22-134)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)
  - `isJavaPublic(node: Parser.SyntaxNode): boolean` (function, Ln 14-20)

### `src/parsers/javascript.ts`
Hash: f58f254e21ad5172e959cd0a4abfec56fa39c6102c768e6d94e12632626a9713
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `JavaScriptParser` (class, Ln 14-174)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)

### `src/parsers/python.ts`
Hash: 40f9436b88269c51a3c6e53e819ffd1c5af6dfd56f32086ef223cbb2e810d54c
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `PythonParser` (class, Ln 14-155)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)

### `src/parsers/rust.ts`
Hash: ac9f16b2a4ca7d829f088aacd04c75c02e429e583af1db34dfee11edd9daa153
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `RustParser` (class, Ln 14-183)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)

### `src/parsers/typescript.ts`
Hash: 4f1d7bfae74aadef9757080c354cbd48e354965b157772f31b55fc302c8dcc34
- **Imports**:
  - `web-tree-sitter`: Parser
  - `../types.ts`: LanguageParser, ParseResult, ImportEntry, SymbolEntry, ParseOptions
  - `../types.ts`: formatLocation, formatDocstring
- **Exports**:
  - `TypeScriptParser` (class, Ln 14-186)
- **Symbols**:
  - `isParserInitialized` (variable, Ln 5)
  - `ensureParserInit()` (function, Ln 7-12)

### `src/resolver.ts`
Hash: 26de28af071ddba07dbb1d441293914411ad319c7ef590d315b1f28480774000
- **Imports**:
  - `node:path`: path
  - `./types.ts`: FileEntry, NamespaceEntry, PackageDependencies
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

### `src/scanner.ts`
Hash: eab5916a53d5e8feff3fd5e7a9c59afaddecefcbdc27646890e49c2c6c04ffe7
- **Imports**:
  - `node:fs`: fs
  - `node:path`: path
  - `node:crypto`: crypto
- **Exports**:
  - `ScannedFile` (type, Ln 5-9)
  - `calculateHash(filePath: string): string` (function, Ln 24-27)
  - `scanDirectory(
  rootDir: string,
  customExcludes: string[] = [],
  maxDepth?: number
): ScannedFile[]` (function, Ln 29-72)
- **Symbols**:
  - `DEFAULT_IGNORED_DIRS` (variable, Ln 11-22)
  - `walk(currentDir: string, currentDepth = 0)` (function, Ln 38-68)

### `src/types.ts`
Hash: b44ac3cd1f0df850e3c4727f146d1773b7605034b1efe6dd485a0cd2f9bf1d5b
- **Exports**:
  - `ProjectMetadata` (type, Ln 1-5)
  - `PackageDependencies` (type, Ln 7-13)
  - `ImportEntry` (type, Ln 15-18)
  - `SymbolEntry` (type, Ln 20-26)
  - `formatLocation(start: number, end: number): string` (function, Ln 28-30)
  - `formatDocstring(text: string): string` (function, Ln 32-49)
  - `FileEntry` (type, Ln 51-56)
  - `NamespaceEntry` (type, Ln 58-61)
  - `CodeSurveySchema` (type, Ln 63-72)
  - `ParseOptions` (type, Ln 74-79)
  - `ParseResult` (type, Ln 81-86)
  - `LanguageParser` (type, Ln 88-91)
  - `CodeSurveyResult` (type, Ln 93-104)

### `src/utils/wasm-loader.ts`
Hash: 3cbcff473233d1550543b55cf97168265a07716db39bffff32663b008d6edb76
- **Imports**:
  - `node:fs`: fs
  - `node:path`: path
  - `node:os`: os
  - `node:url`: fileURLToPath
- **Exports**:
  - `getWasmPath(language: string): Promise<string>` (function, Ln 18-79)
- **Symbols**:
  - `WASM_FILE_MAP` (variable, Ln 6-14)
  - `CDN_BASE_URL` (variable, Ln 16)

### `src/writer.ts`
Hash: bd4325817cd37eb6afa18da39897001fc6f7691d74bb7900e6a56aecac4f6768
- **Imports**:
  - `yaml`: stringify
  - `./types.ts`: CodeSurveySchema, FileEntry, NamespaceEntry
- **Exports**:
  - `sortCodeSurveyData(data: CodeSurveySchema): CodeSurveySchema` (function, Ln 22-75)
  - `generateDeterministicJson(data: CodeSurveySchema): string` (function, Ln 77-80)
  - `generateDeterministicYaml(data: CodeSurveySchema): string` (function, Ln 82-85)
  - `generateDeterministicMermaid(data: CodeSurveySchema): string` (function, Ln 87-126)
  - `generateProjectMarkdown(data: CodeSurveySchema): string` (function, Ln 128-130)
  - `generateDependenciesMarkdown(data: CodeSurveySchema): string` (function, Ln 132-146)
  - `generateFilesMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string` (function, Ln 148-193)
  - `generateNamespacesMarkdown(data: CodeSurveySchema): string` (function, Ln 195-208)
  - `generateLinksMarkdown(data: CodeSurveySchema): string` (function, Ln 210-221)
  - `generateDeterministicMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string` (function, Ln 223-264)
- **Symbols**:
  - `sortObjectKeys(obj: any): any` (function, Ln 5-20)

### `tests/integration.test.ts`
Hash: eb6d5ddadc2a859cd5332c172fc762e634d7bc72d41a920245fd106508aeef74
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `node:child_process`: execSync
  - `../src/index.ts`: createCodeSurvey
  - `yaml`: parse

### `tests/package-parser.test.ts`
Hash: 97dd9e8e959f7abbdb7953bfbbef7743b4dec40d3f9a6391ba13cfbcb3ffae17
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `../src/parser.ts`: parsePackageDependencies

### `tests/parsers.test.ts`
Hash: a307e980d58c65490fa60cff169792757f225e89737234fa8d47e84399ab12b6
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `../src/utils/wasm-loader.ts`: getWasmPath
  - `../src/parsers/typescript.ts`: TypeScriptParser
  - `../src/parsers/python.ts`: PythonParser
  - `../src/parsers/go.ts`: GoParser
  - `../src/parsers/java.ts`: JavaParser
  - `../src/parsers/csharp.ts`: CSharpParser
  - `../src/parsers/rust.ts`: RustParser
  - `../src/parsers/javascript.ts`: JavaScriptParser

### `tests/remote.test.ts`
Hash: 3fa2dd8b4ec6e0a2589b197952791785716776053e21c4bb1438ee7551491948
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `node:os`: os
  - `../src/index.ts`: createCodeSurvey

### `tests/resolver.test.ts`
Hash: 65cf32a0902937498da9c0f1626e59d89b7021dcf57bef20caf9fba7389e1964
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `../src/resolver.ts`: resolveImports
  - `../src/types.ts`: FileEntry, NamespaceEntry, PackageDependencies

### `tests/scanner.test.ts`
Hash: c097e41b86674c525597bf95bc0ad98ae93bd5416599b5df1dbd49a0c2f658f5
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `node:fs`: fs
  - `node:path`: path
  - `../src/scanner.ts`: scanDirectory

### `tests/wasm-loader.test.ts`
Hash: 49c0d02dbe091c5866a42bd6b6890020496df21bd47b4304101f66493b8523a4
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `node:fs`: fs
  - `../src/utils/wasm-loader.ts`: getWasmPath

### `tests/writer.test.ts`
Hash: 92b89ad69d24e1cd20d45ab3f699893ccfac601826772d58dda4b2eb0e816b69
- **Imports**:
  - `node:test`: test
  - `node:assert`: assert
  - `../src/writer.ts`: generateDeterministicJson, generateDeterministicYaml, generateDeterministicMarkdown, generateDeterministicMermaid
  - `../src/types.ts`: CodeSurveySchema
  - `yaml`: parse
