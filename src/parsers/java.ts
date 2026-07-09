import Parser from 'web-tree-sitter';
import type { ParseResult, ImportEntry, SymbolEntry, ParseOptions } from '../types.ts';
import { formatLocation, formatDocstring } from '../types.ts';
import { BaseTreeSitterParser } from './base.ts';

let isParserInitialized = false;

function isJavaPublic(node: Parser.SyntaxNode): boolean {
  const modifiers = node.children.find(c => c.type === 'modifiers');
  if (modifiers) {
    return modifiers.children.some(m => m.type === 'public');
  }
  return false;
}

export class JavaParser extends BaseTreeSitterParser {
  parse(code: string, options?: ParseOptions): ParseResult {
    const tree = this.parser.parse(code);
    const imports: ImportEntry[] = [];
    const exports: SymbolEntry[] = [];
    const symbols: SymbolEntry[] = [];
    let namespace: string | undefined;

    const visit = (node: Parser.SyntaxNode) => {
      // 1. Package declaration (Namespace)
      if (node.type === 'package_declaration') {
        const idNode = node.children.find(
          c => c.type === 'scoped_identifier' || c.type === 'identifier'
        );
        if (idNode) {
          namespace = idNode.text;
        }
      }

      // 2. Imports
      if (node.type === 'import_declaration') {
        const idNode = node.children.find(
          c => c.type === 'scoped_identifier' || c.type === 'identifier' || c.type === 'asterisk_import'
        );
        if (idNode) {
          imports.push({
            source: idNode.text,
            symbols: []
          });
        }
      }

      // Helper to get docstring for Java node
      const getJavaDocstring = (n: Parser.SyntaxNode): string | undefined => {
        if (!options?.includeDocs) return undefined;
        let prev = n.previousSibling;
        const comments: string[] = [];
        while (prev && (prev.type === 'line_comment' || prev.type === 'block_comment')) {
          comments.unshift(prev.text);
          prev = prev.previousSibling;
        }
        if (comments.length > 0) {
          return formatDocstring(comments.join('\n'));
        }
        return undefined;
      };

      // 3. Classes and Interfaces
      if (node.type === 'class_declaration' || node.type === 'interface_declaration') {
        const idNode = node.children.find(c => c.type === 'identifier');
        if (idNode) {
          const item: SymbolEntry = {
            name: idNode.text,
            type: node.type === 'class_declaration' ? 'class' : 'interface',
            location: formatLocation(node.startPosition.row + 1, node.endPosition.row + 1)
          };
          const doc = getJavaDocstring(node);
          if (doc) {
            item.doc = doc;
          }
          if (isJavaPublic(node)) {
            exports.push(item);
          } else {
            symbols.push(item);
          }
        }
      }

      // 4. Methods (inside classes/interfaces)
      if (node.type === 'method_declaration') {
        const idNode = node.children.find(c => c.type === 'identifier');
        if (idNode) {
          const item: SymbolEntry = {
            name: idNode.text,
            type: 'method',
            location: formatLocation(node.startPosition.row + 1, node.endPosition.row + 1)
          };
          if (options?.includeSignatures) {
            const params = node.children.find(c => c.type === 'formal_parameters');
            const idIndex = node.children.indexOf(idNode);
            const returnTypeNode = idIndex > 0 ? node.children[idIndex - 1] : null;
            if (params) {
              item.signature = params.text + (returnTypeNode ? ': ' + returnTypeNode.text : '');
            }
          }
          const doc = getJavaDocstring(node);
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

    return { imports, exports, symbols, namespace };
  }
}
