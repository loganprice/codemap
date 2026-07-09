import Parser from 'web-tree-sitter';
import type { ParseResult, ImportEntry, SymbolEntry, ParseOptions } from '../types.ts';
import { formatLocation, formatDocstring } from '../types.ts';
import { BaseTreeSitterParser } from './base.ts';

export class RustParser extends BaseTreeSitterParser {
  parse(code: string, options?: ParseOptions): ParseResult {
    const tree = this.parser.parse(code);
    const imports: ImportEntry[] = [];
    const exports: SymbolEntry[] = [];
    const symbols: SymbolEntry[] = [];

    const getRustDocstring = (n: Parser.SyntaxNode): string | undefined => {
      if (!options?.includeDocs) return undefined;
      let prev = n.previousSibling;
      const comments: string[] = [];
      while (prev && (prev.type === 'line_comment' || prev.type === 'block_comment')) {
        comments.unshift(prev.text);
        prev = prev.previousSibling;
      }
      if (comments.length > 0) {
        const combined = comments.join('\n').replace(/\/\/\/|\/\/\!/g, '');
        return formatDocstring(combined);
      }
      return undefined;
    };

    const isRustExported = (n: Parser.SyntaxNode): boolean => {
      const vis = n.children.find(c => c.type === 'visibility_modifier');
      if (vis) {
        return vis.text.startsWith('pub');
      }
      return false;
    };

    const visit = (node: Parser.SyntaxNode) => {
      // 1. Imports: use std::fs::File;
      if (node.type === 'use_declaration') {
        const fullText = node.text;
        const cleaned = fullText.replace(/^use\s+/, '').replace(/;$/, '').trim();
        if (cleaned) {
          const braceIndex = cleaned.indexOf('{');
          if (braceIndex !== -1) {
            const source = cleaned.substring(0, braceIndex).replace(/::$/, '').trim();
            const listText = cleaned.substring(braceIndex + 1, cleaned.indexOf('}')).trim();
            const symbolsList = listText.split(',').map(s => s.trim()).filter(Boolean);
            imports.push({ source, symbols: symbolsList });
          } else {
            const parts = cleaned.split('::');
            if (parts.length > 1) {
              const symbolsList = [parts[parts.length - 1]];
              const source = parts.slice(0, parts.length - 1).join('::');
              imports.push({ source, symbols: symbolsList });
            } else {
              imports.push({ source: cleaned, symbols: [] });
            }
          }
        }
      }

      // 2. Definitions: Struct, Enum, Trait, Type, Function
      const isExported = isRustExported(node);

      const addRustSymbol = (name: string, type: SymbolEntry['type'], startNode: Parser.SyntaxNode, signature?: string) => {
        const item: SymbolEntry = {
          name,
          type,
          location: formatLocation(startNode.startPosition.row + 1, startNode.endPosition.row + 1)
        };
        if (signature) {
          item.signature = signature;
        }
        const doc = getRustDocstring(startNode);
        if (doc) {
          item.doc = doc;
        }
        if (isExported) {
          exports.push(item);
        } else {
          symbols.push(item);
        }
      };

      if (node.type === 'struct_item') {
        const nameNode = node.children.find(c => c.type === 'type_identifier' || c.type === 'identifier');
        if (nameNode) addRustSymbol(nameNode.text, 'struct', node);
      }

      if (node.type === 'enum_item') {
        const nameNode = node.children.find(c => c.type === 'type_identifier' || c.type === 'identifier');
        if (nameNode) addRustSymbol(nameNode.text, 'type', node);
      }

      if (node.type === 'trait_item') {
        const nameNode = node.children.find(c => c.type === 'type_identifier' || c.type === 'identifier');
        if (nameNode) addRustSymbol(nameNode.text, 'interface', node);
      }

      if (node.type === 'type_item') {
        const nameNode = node.children.find(c => c.type === 'type_identifier' || c.type === 'identifier');
        if (nameNode) addRustSymbol(nameNode.text, 'type', node);
      }

      if (node.type === 'function_item') {
        const nameNode = node.children.find(c => c.type === 'identifier');
        if (nameNode) {
          let parent = node.parent;
          let isMethod = false;
          while (parent) {
            if (parent.type === 'impl_item') {
              isMethod = true;
              break;
            }
            parent = parent.parent;
          }
          const symType = isMethod ? 'method' : 'function';
          
          let signature: string | undefined;
          if (options?.includeSignatures) {
            const params = node.children.find(c => c.type === 'parameters');
            if (params) {
              const paramIndex = node.children.indexOf(params);
              const blockIndex = node.children.findIndex(c => c.type === 'block');
              let returnType = '';
              if (paramIndex !== -1 && blockIndex !== -1 && blockIndex > paramIndex + 1) {
                returnType = node.children
                  .slice(paramIndex + 1, blockIndex)
                  .map(c => c.text)
                  .join(' ')
                  .trim();
              }
              signature = params.text + (returnType ? ' ' + returnType : '');
            }
          }
          addRustSymbol(nameNode.text, symType, node, signature);
        }
      }

      // 3. Local variables inside functions (if requested)
      if (node.type === 'let_declaration' && options?.includeInternalVars) {
        const idNode = node.children.find(c => c.type === 'identifier') ||
                      node.children.find(c => c.type === 'pattern')?.children.find(c => c.type === 'identifier');
        if (idNode) {
          const item: SymbolEntry = {
            name: idNode.text,
            type: 'variable',
            location: formatLocation(node.startPosition.row + 1, node.endPosition.row + 1)
          };
          const doc = getRustDocstring(node);
          if (doc) {
            item.doc = doc;
          }
          symbols.push(item);
        }
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(tree.rootNode);
    return { imports, exports, symbols };
  }
}
