import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import * as readline from 'node:readline';
import { createCodeSurvey } from '../src/index.ts';
import { parse as parseYaml } from 'yaml';

test('Integration - end-to-end codebase mapping', async () => {
  const tempDir = path.resolve('./temp_integration_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    // 1. Package files
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { lodash: '^4.17.21' } })
    );

    // 2. TypeScript files
    fs.writeFileSync(
      path.join(srcDir, 'utils.ts'),
      `export function format(val: string): string { return val.trim(); }`
    );
    fs.writeFileSync(
      path.join(srcDir, 'index.ts'),
      `import { format } from './utils.ts';`
    );

    // 3. Python files
    fs.writeFileSync(
      path.join(srcDir, 'helper.py'),
      `def do_work(): pass`
    );
    fs.writeFileSync(
      path.join(srcDir, 'main.py'),
      `from src.helper import do_work`
    );

    // 4. C# files
    fs.writeFileSync(
      path.join(srcDir, 'Controller.cs'),
      `namespace App { public class Controller {} }`
    );
    fs.writeFileSync(
      path.join(srcDir, 'Main.cs'),
      `using App;`
    );

    // Run mapping
    const outputPath = path.join(tempDir, 'code-survey.json');
    await createCodeSurvey({
      root: tempDir,
      output: outputPath,
      excludes: []
    });

    assert.ok(fs.existsSync(outputPath), 'Output code-survey.json should be created');
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    // Assert project metadata
    assert.strictEqual(content.project.name, 'temp_integration_test');
    assert.deepEqual(content.project.languages.sort(), ['csharp', 'python', 'typescript']);

    // Assert package dependencies
    assert.deepEqual(content.packageDependencies.npm, { lodash: '^4.17.21' });

    // Assert parsed files count
    assert.ok(content.files['src/utils.ts']);
    assert.ok(content.files['src/index.ts']);
    assert.ok(content.files['src/helper.py']);
    assert.ok(content.files['src/main.py']);
    assert.ok(content.files['src/Controller.cs']);
    assert.ok(content.files['src/Main.cs']);

    // Assert namespace C# parsed
    assert.ok(content.namespaces['App']);
    assert.deepEqual(content.namespaces['App'].files, ['src/Controller.cs']);

    // Assert link resolutions
    assert.deepEqual(content.internalLinks['src/utils.ts:format'], ['src/index.ts']);
    assert.deepEqual(content.internalLinks['src/helper.py:do_work'], ['src/main.py']);
    assert.deepEqual(content.internalLinks['src/Controller.cs'], ['src/Main.cs']);

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - end-to-end YAML codebase mapping', async () => {
  const tempDir = path.resolve('./temp_integration_yaml_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { lodash: '^4.17.21' } })
    );

    fs.writeFileSync(
      path.join(srcDir, 'utils.ts'),
      `export function format(val: string): string { return val.trim(); }`
    );

    const outputPath = path.join(tempDir, 'code-survey.yaml');
    await createCodeSurvey({
      root: tempDir,
      output: outputPath,
      excludes: []
    });

    assert.ok(fs.existsSync(outputPath), 'Output code-survey.yaml should be created');
    const rawYaml = fs.readFileSync(outputPath, 'utf-8');
    const content = parseYaml(rawYaml) as any;

    assert.strictEqual(content.project.name, 'temp_integration_yaml_test');
    assert.deepEqual(content.project.languages, ['typescript']);
    assert.ok(content.files['src/utils.ts']);
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - advanced features (maxDepth, includeDocs, symbolsFilter)', async () => {
  const tempDir = path.resolve('./temp_integration_advanced_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  const subDir = path.join(srcDir, 'sub');
  fs.mkdirSync(subDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: {} })
    );

    // 1. Write file with JSDoc
    fs.writeFileSync(
      path.join(srcDir, 'utils.ts'),
      `
      /**
       * Formats string values.
       */
      export class Formatter {
        format() {}
      }

      export function helper() {}
      `
    );

    // 2. Write file inside nested directory that should be ignored due to depth
    fs.writeFileSync(
      path.join(subDir, 'nested.ts'),
      `export class Nested {}`
    );

    const outputPath = path.join(tempDir, 'code-survey.json');
    await createCodeSurvey({
      root: tempDir,
      output: outputPath,
      excludes: [],
      maxDepth: 1, // Will include src/utils.ts (depth 1) but ignore src/sub/nested.ts (depth 2)
      includeDocs: true,
      symbolsFilter: ['class'] // Exclude helper function
    });

    assert.ok(fs.existsSync(outputPath), 'Output code-survey.json should be created');
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    assert.ok(content.files['src/utils.ts'], 'src/utils.ts should be captured');
    assert.strictEqual(content.files['src/sub/nested.ts'], undefined, 'Nested files past depth limit should be ignored');

    const exports = content.files['src/utils.ts'].exports;
    // Check symbols filter: helper is function, so it should be excluded. Only class Formatter remains.
    assert.strictEqual(exports.length, 1);
    assert.strictEqual(exports[0].name, 'Formatter');
    assert.strictEqual(exports[0].doc, 'Formats string values.');
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - ignore file loading (.codesurveyignore) and result counts', async () => {
  const tempDir = path.resolve('./temp_integration_ignore_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: {} })
    );

    // Write .codesurveyignore
    fs.writeFileSync(
      path.join(tempDir, '.codesurveyignore'),
      `
      # ignore helper
      src/helper.ts
      `
    );

    // Write tracked and ignored files
    fs.writeFileSync(
      path.join(srcDir, 'main.ts'),
      `export class Main {}`
    );

    fs.writeFileSync(
      path.join(srcDir, 'helper.ts'),
      `export function help() {}`
    );

    const outputPath = path.join(tempDir, 'code-survey.json');
    const result = await createCodeSurvey({
      root: tempDir,
      output: outputPath,
      excludes: []
    });

    assert.ok(fs.existsSync(outputPath));
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    // Main should be included, helper ignored
    assert.ok(content.files['src/main.ts']);
    assert.strictEqual(content.files['src/helper.ts'], undefined);

    // Verify result counts
    assert.strictEqual(result.filesCount, 1);
    assert.strictEqual(result.symbolsCount.class, 1);
    assert.strictEqual(result.symbolsCount.function, 0);

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - split directory output', async () => {
  const tempDir = path.resolve('./temp_integration_split_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { "lodash": "^4.17.21" } })
    );

    fs.writeFileSync(
      path.join(srcDir, 'main.ts'),
      `
      import { zip } from 'lodash';
      export class Main {
        run() {}
      }
      `
    );

    const outputDir = path.join(tempDir, 'split-out');
    await createCodeSurvey({
      root: tempDir,
      output: outputDir,
      split: true,
      format: 'json'
    });

    assert.ok(fs.existsSync(path.join(outputDir, 'project.json')), 'project.json should exist');
    assert.ok(fs.existsSync(path.join(outputDir, 'dependencies.json')), 'dependencies.json should exist');
    assert.ok(fs.existsSync(path.join(outputDir, 'files.json')), 'files.json should exist');
    assert.ok(fs.existsSync(path.join(outputDir, 'namespaces.json')), 'namespaces.json should exist');
    assert.ok(fs.existsSync(path.join(outputDir, 'links.json')), 'links.json should exist');

    const projectContent = JSON.parse(fs.readFileSync(path.join(outputDir, 'project.json'), 'utf-8'));
    assert.strictEqual(projectContent.project.name, 'temp_integration_split_test');

    const filesContent = JSON.parse(fs.readFileSync(path.join(outputDir, 'files.json'), 'utf-8'));
    assert.ok(filesContent.files['src/main.ts']);

    const depsContent = JSON.parse(fs.readFileSync(path.join(outputDir, 'dependencies.json'), 'utf-8'));
    assert.ok(depsContent.packageDependencies.npm.lodash);

    // Test Markdown split format
    const outputDirMd = path.join(tempDir, 'split-out-md');
    await createCodeSurvey({
      root: tempDir,
      output: outputDirMd,
      split: true,
      format: 'markdown'
    });

    assert.ok(fs.existsSync(path.join(outputDirMd, 'project.md')), 'project.md should exist');
    assert.ok(fs.existsSync(path.join(outputDirMd, 'dependencies.md')), 'dependencies.md should exist');
    assert.ok(fs.existsSync(path.join(outputDirMd, 'files.md')), 'files.md should exist');
    assert.ok(fs.existsSync(path.join(outputDirMd, 'namespaces.md')), 'namespaces.md should exist');
    assert.ok(fs.existsSync(path.join(outputDirMd, 'links.md')), 'links.md should exist');

    const filesMdContent = fs.readFileSync(path.join(outputDirMd, 'files.md'), 'utf-8');
    assert.ok(filesMdContent.includes('### `src/main.ts`'));
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - multi-survey static configuration execution', async () => {
  const tempDir = path.resolve('./temp_integration_multi_config_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: {} })
    );

    fs.writeFileSync(
      path.join(srcDir, 'main.ts'),
      `export class App { run() {} }`
    );

    // Write a multi-survey config file
    const configPath = path.join(tempDir, 'surveys-config.json');
    const outJson = path.join(tempDir, 'out.json');
    const outMd = path.join(tempDir, 'out.md');

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        surveys: [
          {
            root: tempDir,
            output: outJson,
            format: 'json'
          },
          {
            root: tempDir,
            output: outMd,
            format: 'markdown'
          }
        ]
      })
    );

    // Execute CLI using our portable runner
    const cliPath = path.resolve('bin/code-survey.ts');
    const cmd = typeof (globalThis as any).Deno !== 'undefined'
      ? `deno run --allow-read --allow-write --allow-sys --allow-env --allow-run --allow-net "${cliPath}" --config "${configPath}"`
      : `node --experimental-strip-types "${cliPath}" --config "${configPath}"`;

    execSync(cmd, { stdio: 'pipe' });

    // Assert both outputs were generated
    assert.ok(fs.existsSync(outJson), 'out.json should be generated');
    assert.ok(fs.existsSync(outMd), 'out.md should be generated');

    const jsonContent = JSON.parse(fs.readFileSync(outJson, 'utf-8'));
    assert.ok(jsonContent.files['src/main.ts']);

    const mdContent = fs.readFileSync(outMd, 'utf-8');
    assert.ok(mdContent.includes('### `src/main.ts`'));
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - caching and incremental parsing', async () => {
  const tempDir = path.resolve('./temp_integration_cache_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: {} })
    );

    const mainFile = path.join(srcDir, 'main.ts');
    fs.writeFileSync(mainFile, `export class App { run() {} }`);

    const outJson = path.join(tempDir, 'out.json');
    const cacheFile = path.join(tempDir, '.code-survey', 'cache.json');

    // First scan - should create the cache
    await createCodeSurvey({
      root: tempDir,
      output: outJson,
      format: 'json'
    });

    assert.ok(fs.existsSync(cacheFile), 'cache.json should be created');
    let cacheContent = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    assert.ok(cacheContent.files['src/main.ts'], 'src/main.ts should be cached');
    const firstHash = cacheContent.files['src/main.ts'].hash;

    // Mutate main.ts file and scan again
    fs.writeFileSync(mainFile, `export class App { run() {} }; // modified`);
    await createCodeSurvey({
      root: tempDir,
      output: outJson,
      format: 'json'
    });

    // Verify cache is updated with the new hash
    cacheContent = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    const secondHash = cacheContent.files['src/main.ts'].hash;
    assert.notStrictEqual(firstHash, secondHash, 'File hash in cache should be updated');

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - CLI watch mode execution', async () => {
  const tempDir = path.resolve('./temp_integration_watch_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  let childProcess: any = null;

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: {} })
    );

    const mainFile = path.join(srcDir, 'main.ts');
    fs.writeFileSync(mainFile, `export class App { run() {} }`);

    const outJson = path.join(tempDir, 'out.json');

    const cliPath = path.resolve('bin/code-survey.ts');
    const isDeno = typeof (globalThis as any).Deno !== 'undefined';

    if (isDeno) {
      childProcess = spawn('deno', [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-env',
        '--allow-run',
        '--allow-net',
        cliPath,
        '--root',
        tempDir,
        '--output',
        outJson,
        '--watch'
      ], { stdio: 'ignore' });
    } else {
      childProcess = spawn('node', [
        '--experimental-strip-types',
        cliPath,
        '--root',
        tempDir,
        '--output',
        outJson,
        '--watch'
      ], { stdio: 'ignore' });
    }

    // Wait for the initial output to be generated
    let retries = 0;
    while (!fs.existsSync(outJson) && retries < 60) {
      await new Promise(resolve => setTimeout(resolve, 200));
      retries++;
    }

    assert.ok(fs.existsSync(outJson), 'out.json should be generated initially');
    let content = JSON.parse(fs.readFileSync(outJson, 'utf-8'));
    assert.strictEqual(content.files['src/main.ts'].exports.length, 1);

    // Modify file to trigger watch reload
    fs.writeFileSync(mainFile, `export class App { run() {} }\nexport class Extra {}`);

    // Wait for the watcher to detect, debounce, and regenerate
    let updated = false;
    retries = 0;
    while (retries < 60) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (fs.existsSync(outJson)) {
        try {
          const newContent = JSON.parse(fs.readFileSync(outJson, 'utf-8'));
          if (newContent.files['src/main.ts'].exports.length === 2) {
            updated = true;
            break;
          }
        } catch {
          // JSON might be partially written, try again
        }
      }
      retries++;
    }

    assert.ok(updated, 'out.json should be updated by watch mode');
  } finally {
    if (childProcess) {
      childProcess.kill('SIGTERM');
    }
    if (fs.existsSync(tempDir)) {
      // Small delay to let child process release files before cleanup
      await new Promise(resolve => setTimeout(resolve, 300));
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Integration - MCP server communication', async () => {
  const tempDir = path.resolve('./temp_integration_mcp_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  let childProcess: any = null;

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { lodash: '^4.17.21' } })
    );

    const mainFile = path.join(srcDir, 'main.ts');
    fs.writeFileSync(mainFile, `export class App { run() {} }`);

    const cliPath = path.resolve('bin/code-survey.ts');
    const isDeno = typeof (globalThis as any).Deno !== 'undefined';

    if (isDeno) {
      childProcess = spawn('deno', [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-env',
        '--allow-run',
        '--allow-net',
        cliPath,
        '--mcp'
      ], { stdio: 'pipe' });
    } else {
      childProcess = spawn('node', [
        '--experimental-strip-types',
        cliPath,
        '--mcp'
      ], { stdio: 'pipe' });
    }

    // Capture child process output line-by-line
    const lines: string[] = [];
    const rl = readline.createInterface({
      input: childProcess.stdout,
      terminal: false
    });
    rl.on('line', (l) => {
      lines.push(l);
    });

    const getNextLine = async (timeoutMs = 5000): Promise<string> => {
      const start = Date.now();
      while (lines.length === 0) {
        if (Date.now() - start > timeoutMs) {
          throw new Error('Timeout waiting for stdout from MCP server');
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return lines.shift()!;
    };

    // 1. Send initialize request
    childProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0' }
      }
    }) + '\n');

    let response = JSON.parse(await getNextLine());
    assert.strictEqual(response.id, 1);
    assert.strictEqual(response.result.protocolVersion, '2024-11-05');
    assert.strictEqual(response.result.serverInfo.name, 'code-survey-mcp');

    // 2. Send tools/list request
    childProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }) + '\n');

    response = JSON.parse(await getNextLine());
    assert.strictEqual(response.id, 2);
    const tools = response.result.tools;
    assert.ok(tools.find((t: any) => t.name === 'get_codebase_survey'));
    assert.ok(tools.find((t: any) => t.name === 'get_dependencies'));

    // 3. Send tools/call request for get_dependencies
    childProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_dependencies',
        arguments: { root: tempDir }
      }
    }) + '\n');

    response = JSON.parse(await getNextLine(10000)); // Scan might take a little longer
    assert.strictEqual(response.id, 3);
    assert.strictEqual(response.result.isError, false);
    const data = JSON.parse(response.result.content[0].text);
    assert.ok(data.packageDependencies.npm.lodash);

  } finally {
    if (childProcess) {
      childProcess.kill('SIGTERM');
    }
    if (fs.existsSync(tempDir)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});



