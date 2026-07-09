import Parser from 'web-tree-sitter';
import type { LanguageParser, ParseResult, ParseOptions } from '../types.ts';

let isTreeSitterInitialized = false;

export async function ensureParserInit() {
  if (!isTreeSitterInitialized) {
    await Parser.init();
    isTreeSitterInitialized = true;
  }
}

export abstract class BaseTreeSitterParser implements LanguageParser {
  protected parser!: Parser;
  protected lang!: Parser.Language;

  async initialize(wasmPath: string): Promise<void> {
    await ensureParserInit();
    this.lang = await Parser.Language.load(wasmPath);
    this.parser = new Parser();
    this.parser.setLanguage(this.lang);
  }

  abstract parse(code: string, options?: ParseOptions): ParseResult;
}
