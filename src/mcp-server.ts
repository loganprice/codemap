import { createCodeSurvey } from './index.ts';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as readline from 'node:readline';

const PROTOCOL_VERSION = '2024-11-05';

export function runMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  console.error('Code Survey MCP Server started.');

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const message = JSON.parse(line);
      const { jsonrpc, id, method, params } = message;

      if (jsonrpc !== '2.0') {
        sendError(id, -32600, 'Invalid Request');
        return;
      }

      switch (method) {
        case 'initialize': {
          sendResponse(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'code-survey-mcp',
              version: '1.0.0'
            }
          });
          break;
        }

        case 'notifications/initialized': {
          break;
        }

        case 'tools/list': {
          sendResponse(id, {
            tools: [
              {
                name: 'get_codebase_survey',
                description: 'Generates and returns the complete codebase survey data, including project details, file mappings, dependencies, and syntax symbols.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    root: { type: 'string', description: 'The absolute or relative path to the codebase root (defaults to current working directory).' },
                    includeSignatures: { type: 'boolean', description: 'Include function parameter signatures and return types (defaults to false).' },
                    includeDocs: { type: 'boolean', description: 'Extract docstrings/JSDocs for symbols (defaults to false).' },
                    includeInternalVars: { type: 'boolean', description: 'Include local/internal variables (defaults to false).' }
                  }
                }
              },
              {
                name: 'search_symbols',
                description: 'Searches for matching symbols (classes, functions, methods, variables, types) across the codebase.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'The search term/substring to look for (case-insensitive).' },
                    root: { type: 'string', description: 'The codebase root directory path.' }
                  },
                  required: ['query']
                }
              },
              {
                name: 'get_file_symbols',
                description: 'Retrieves parsed symbol structure, imports, and exports for a specific file relative to codebase root.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', description: 'The relative file path (e.g. src/index.ts).' },
                    root: { type: 'string', description: 'The codebase root directory path.' }
                  },
                  required: ['file']
                }
              },
              {
                name: 'get_dependencies',
                description: 'Retrieves project-level external/npm and package dependencies.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    root: { type: 'string', description: 'The codebase root directory path.' }
                  }
                }
              }
            ]
          });
          break;
        }

        case 'tools/call': {
          const { name, arguments: args } = params || {};
          const result = await handleToolCall(name, args || {});
          sendResponse(id, result);
          break;
        }

        default: {
          if (id !== undefined) {
            sendError(id, -32601, `Method not found: ${method}`);
          }
          break;
        }
      }
    } catch (err: any) {
      sendError(null, -32700, `Parse error: ${err.message}`);
    }
  });

  function sendResponse(id: any, result: any) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
  }

  function sendError(id: any, code: number, message: string) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
  }

  async function handleToolCall(name: string, args: any): Promise<any> {
    const root = args.root ? path.resolve(args.root) : process.cwd();

    try {
      switch (name) {
        case 'get_codebase_survey': {
          const resultObj = await createCodeSurvey({
            root,
            includeSignatures: !!args.includeSignatures,
            includeDocs: !!args.includeDocs,
            includeInternalVars: !!args.includeInternalVars
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resultObj.data, null, 2)
              }
            ],
            isError: false
          };
        }

        case 'search_symbols': {
          const resultObj = await createCodeSurvey({
            root,
            includeSignatures: true,
            includeDocs: true
          });
          const query = String(args.query).toLowerCase();
          const matches: any[] = [];

          for (const [filePath, fileEntry] of Object.entries(resultObj.data.files || {})) {
            const allSymbols = [...(fileEntry.exports || []), ...(fileEntry.symbols || [])];
            for (const sym of allSymbols) {
              if (sym.name.toLowerCase().includes(query)) {
                matches.push({
                  file: filePath,
                  name: sym.name,
                  type: sym.type,
                  location: sym.location,
                  signature: sym.signature,
                  doc: sym.doc
                });
              }
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(matches, null, 2)
              }
            ],
            isError: false
          };
        }

        case 'get_file_symbols': {
          const resultObj = await createCodeSurvey({
            root,
            includeSignatures: true,
            includeDocs: true,
            includeInternalVars: true
          });
          const relativeFile = String(args.file).replace(/\\/g, '/');
          const fileEntry = resultObj.data.files?.[relativeFile];

          if (!fileEntry) {
            return {
              content: [
                {
                  type: 'text',
                  text: `File not found or has no symbols in survey: ${relativeFile}`
                }
              ],
              isError: true
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(fileEntry, null, 2)
              }
            ],
            isError: false
          };
        }

        case 'get_dependencies': {
          const resultObj = await createCodeSurvey({
            root
          });
          const deps = {
            packageDependencies: resultObj.data.packageDependencies || {},
            externalImports: resultObj.data.externalImports || []
          };
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(deps, null, 2)
              }
            ],
            isError: false
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`
              }
            ],
            isError: true
          };
      }
    } catch (err: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
}
