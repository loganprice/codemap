import { stringify } from 'yaml';
import type { CodeSurveySchema, FileEntry, NamespaceEntry } from './types.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Recursively sort object keys alphabetically
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedObj: any = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

export function sortCodeSurveyData(data: CodeSurveySchema): CodeSurveySchema {
  // Deep clone data to avoid mutating original inputs
  const clone: CodeSurveySchema = JSON.parse(JSON.stringify(data));

  // 1. Sort project languages
  if (clone.project?.languages) {
    clone.project.languages.sort();
  }

  // 2. Sort file elements
  if (clone.files) {
    for (const fileKey of Object.keys(clone.files)) {
      const fileEntry: FileEntry = clone.files[fileKey];
      if (fileEntry.imports) {
        fileEntry.imports.sort((a, b) => a.source.localeCompare(b.source));
        for (const imp of fileEntry.imports) {
          if (imp.symbols) imp.symbols.sort();
        }
      }
      if (fileEntry.exports) {
        fileEntry.exports.sort((a, b) => a.name.localeCompare(b.name));
      }
      if (fileEntry.symbols) {
        fileEntry.symbols.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  }

  // 3. Sort namespace elements
  if (clone.namespaces) {
    for (const nsKey of Object.keys(clone.namespaces)) {
      const nsEntry: NamespaceEntry = clone.namespaces[nsKey];
      if (nsEntry.files) nsEntry.files.sort();
      if (nsEntry.exports) nsEntry.exports.sort();
    }
  }

  // 4. Sort external imports lists
  if (clone.externalImports) {
    for (const extKey of Object.keys(clone.externalImports)) {
      clone.externalImports[extKey].sort();
    }
  }

  // 5. Sort internal links lists
  if (clone.internalLinks) {
    for (const linkKey of Object.keys(clone.internalLinks)) {
      clone.internalLinks[linkKey].sort();
    }
  }

  // 6. Recursively sort all keys
  return sortObjectKeys(clone);
}

export function generateDeterministicJson(data: CodeSurveySchema): string {
  const sortedData = sortCodeSurveyData(data);
  return JSON.stringify(sortedData, null, 2);
}

export function generateDeterministicYaml(data: CodeSurveySchema): string {
  const sortedData = sortCodeSurveyData(data);
  return stringify(sortedData, { sortMapEntries: true });
}

export function generateDeterministicMermaid(data: CodeSurveySchema): string {
  const sortedData = sortCodeSurveyData(data);
  const lines: string[] = ['graph TD'];

  const fileKeys = Object.keys(sortedData.files).sort();
  if (fileKeys.length === 0) {
    return 'graph TD\n';
  }

  // Create node declarations
  const fileToId: Record<string, string> = {};
  fileKeys.forEach((fileKey, index) => {
    fileToId[fileKey] = `node_${index}`;
    lines.push(`  node_${index}["${fileKey}"]`);
  });

  // Collect edges deterministically
  const linkSet = new Set<string>();
  const linkKeys = Object.keys(sortedData.internalLinks).sort();
  for (const linkKey of linkKeys) {
    const sourceFile = linkKey.split(':')[0];
    const sourceId = fileToId[sourceFile];
    if (!sourceId) continue;

    const targets = sortedData.internalLinks[linkKey];
    for (const targetFile of targets) {
      const targetId = fileToId[targetFile];
      if (targetId && sourceId !== targetId) {
        const edge = `  ${targetId} --> ${sourceId}`;
        linkSet.add(edge);
      }
    }
  }

  // Sort edges to ensure output is deterministic
  const sortedEdges = Array.from(linkSet).sort();
  lines.push(...sortedEdges);

  return lines.join('\n') + '\n';
}

export function generateProjectMarkdown(data: CodeSurveySchema): string {
  return `# Project: ${data.project.name}\nLanguages: ${data.project.languages.join(', ')}\n`;
}

export function generateDependenciesMarkdown(data: CodeSurveySchema): string {
  const lines: string[] = [];
  const depKeys = Object.keys(data.packageDependencies).sort();
  if (depKeys.length > 0) {
    lines.push('## Dependencies');
    for (const key of depKeys) {
      const deps = (data.packageDependencies as any)[key];
      const items = Object.keys(deps).sort().map(d => `${d} (${deps[d]})`);
      if (items.length > 0) {
        lines.push(`- **${key}**: ${items.join(', ')}`);
      }
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

export function generateFilesMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string {
  const lines: string[] = [];
  const fileKeys = Object.keys(data.files).sort();
  if (fileKeys.length > 0) {
    lines.push('## Files');
    for (const fileKey of fileKeys) {
      const fileEntry = data.files[fileKey];
      lines.push(`\n### \`${fileKey}\``);
      lines.push(`Hash: ${fileEntry.hash}`);

      // Imports
      if (fileEntry.imports.length > 0) {
        lines.push('- **Imports**:');
        for (const imp of fileEntry.imports) {
          const syms = imp.symbols.length > 0 ? `: ${imp.symbols.join(', ')}` : '';
          lines.push(`  - \`${imp.source}\`${syms}`);
        }
      }

      // Exports
      if (fileEntry.exports.length > 0) {
        lines.push('- **Exports**:');
        for (const exp of fileEntry.exports) {
          const docStr = exp.doc ? ` - ${exp.doc}` : '';
          const dispName = exp.signature ? `${exp.name}${exp.signature}` : exp.name;
          lines.push(`  - \`${dispName}\` (${exp.type}, ${exp.location})${docStr}`);
        }
      }

      // Symbols
      if (fileEntry.symbols.length > 0) {
        lines.push('- **Symbols**:');
        for (const sym of fileEntry.symbols) {
          const docStr = sym.doc ? ` - ${sym.doc}` : '';
          const dispName = sym.signature ? `${sym.name}${sym.signature}` : sym.name;
          lines.push(`  - \`${dispName}\` (${sym.type}, ${sym.location})${docStr}`);
        }
      }

      if (options?.includeToc) {
        lines.push('\n[Back to Table of Contents](#table-of-contents)');
      }
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

export function generateNamespacesMarkdown(data: CodeSurveySchema): string {
  const lines: string[] = [];
  const nsKeys = Object.keys(data.namespaces).sort();
  if (nsKeys.length > 0) {
    lines.push('## Namespaces');
    for (const nsKey of nsKeys) {
      const nsEntry = data.namespaces[nsKey];
      lines.push(`\n### ${nsKey}`);
      lines.push(`- **Files**: ${nsEntry.files.join(', ')}`);
      lines.push(`- **Exports**: ${nsEntry.exports.join(', ')}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

export function generateLinksMarkdown(data: CodeSurveySchema): string {
  const lines: string[] = [];
  const linkKeys = Object.keys(data.internalLinks).sort();
  if (linkKeys.length > 0) {
    lines.push('## Links');
    for (const linkKey of linkKeys) {
      const targets = data.internalLinks[linkKey];
      lines.push(`- \`${linkKey}\` -> ${targets.map(t => `\`${t}\``).join(', ')}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

export function generateDeterministicMarkdown(data: CodeSurveySchema, options?: { includeToc?: boolean }): string {
  const sortedData = sortCodeSurveyData(data);
  const parts: string[] = [];

  parts.push(generateProjectMarkdown(sortedData));

  // Table of Contents
  if (options?.includeToc) {
    const tocLines: string[] = [];
    tocLines.push('## Table of Contents');
    tocLines.push('- [Dependencies](#dependencies)');
    tocLines.push('- [Files](#files)');
    const fileKeys = Object.keys(sortedData.files).sort();
    for (const fileKey of fileKeys) {
      const anchor = fileKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      tocLines.push(`  - [${fileKey}](#${anchor})`);
    }
    const nsKeys = Object.keys(sortedData.namespaces).sort();
    if (nsKeys.length > 0) {
      tocLines.push('- [Namespaces](#namespaces)');
    }
    const linkKeys = Object.keys(sortedData.internalLinks).sort();
    if (linkKeys.length > 0) {
      tocLines.push('- [Links](#links)');
    }
    parts.push(tocLines.join('\n') + '\n');
  }

  const depsMd = generateDependenciesMarkdown(sortedData);
  if (depsMd) parts.push(depsMd);

  const filesMd = generateFilesMarkdown(sortedData, options);
  if (filesMd) parts.push(filesMd);

  const nsMd = generateNamespacesMarkdown(sortedData);
  if (nsMd) parts.push(nsMd);

  const linksMd = generateLinksMarkdown(sortedData);
  if (linksMd) parts.push(linksMd);

  return parts.join('\n');
}

export function writeSurveyOutput(
  schemaObj: CodeSurveySchema,
  options: {
    output?: string;
    format?: 'json' | 'yaml' | 'markdown' | 'mermaid';
    split?: boolean;
    includeToc?: boolean;
  }
) {
  if (!options.output) return;

  let format = options.format;
  if (!format) {
    const ext = path.extname(options.output).toLowerCase();
    if (ext === '.yaml' || ext === '.yml') {
      format = 'yaml';
    } else if (ext === '.md' || ext === '.markdown') {
      format = 'markdown';
    } else if (ext === '.mermaid' || ext === '.mmd') {
      format = 'mermaid';
    } else {
      format = 'json';
    }
  }

  if (options.split) {
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }

    const ext = format === 'yaml' ? '.yaml' : format === 'markdown' ? '.md' : format === 'mermaid' ? '.mermaid' : '.json';

    if (format === 'json') {
      fs.writeFileSync(path.join(options.output, `project${ext}`), generateDeterministicJson({ version: schemaObj.version, project: schemaObj.project } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `dependencies${ext}`), generateDeterministicJson({ packageDependencies: schemaObj.packageDependencies } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `files${ext}`), generateDeterministicJson({ files: schemaObj.files } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `namespaces${ext}`), generateDeterministicJson({ namespaces: schemaObj.namespaces } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `links${ext}`), generateDeterministicJson({ externalImports: schemaObj.externalImports, internalLinks: schemaObj.internalLinks } as any), 'utf-8');
    } else if (format === 'yaml') {
      fs.writeFileSync(path.join(options.output, `project${ext}`), generateDeterministicYaml({ version: schemaObj.version, project: schemaObj.project } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `dependencies${ext}`), generateDeterministicYaml({ packageDependencies: schemaObj.packageDependencies } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `files${ext}`), generateDeterministicYaml({ files: schemaObj.files } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `namespaces${ext}`), generateDeterministicYaml({ namespaces: schemaObj.namespaces } as any), 'utf-8');
      fs.writeFileSync(path.join(options.output, `links${ext}`), generateDeterministicYaml({ externalImports: schemaObj.externalImports, internalLinks: schemaObj.internalLinks } as any), 'utf-8');
    } else if (format === 'markdown') {
      fs.writeFileSync(path.join(options.output, `project${ext}`), generateProjectMarkdown(schemaObj), 'utf-8');
      fs.writeFileSync(path.join(options.output, `dependencies${ext}`), generateDependenciesMarkdown(schemaObj), 'utf-8');
      fs.writeFileSync(path.join(options.output, `files${ext}`), generateFilesMarkdown(schemaObj), 'utf-8');
      fs.writeFileSync(path.join(options.output, `namespaces${ext}`), generateNamespacesMarkdown(schemaObj), 'utf-8');
      fs.writeFileSync(path.join(options.output, `links${ext}`), generateLinksMarkdown(schemaObj), 'utf-8');
    } else if (format === 'mermaid') {
      fs.writeFileSync(path.join(options.output, `links${ext}`), generateDeterministicMermaid(schemaObj), 'utf-8');
    }
  } else {
    const outputStr = format === 'yaml'
      ? generateDeterministicYaml(schemaObj)
      : format === 'markdown'
        ? generateDeterministicMarkdown(schemaObj, { includeToc: options.includeToc })
        : format === 'mermaid'
          ? generateDeterministicMermaid(schemaObj)
          : generateDeterministicJson(schemaObj);

    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(options.output, outputStr, 'utf-8');
  }
}


