import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createCodeSurvey } from '../src/index.ts';

test('Remote - clone and map remote repository', async () => {
  const tempOutputDir = path.resolve('./temp_remote_test');
  if (fs.existsSync(tempOutputDir)) {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempOutputDir, { recursive: true });

  const outputPath = path.join(tempOutputDir, 'code-survey.json');

  try {
    const result = await createCodeSurvey({
      root: process.cwd(), // Will be overridden by remote
      output: outputPath,
      remote: 'https://github.com/loganprice/codemap.git'
    });

    assert.ok(result.filesCount > 0, 'Should have scanned files from the remote repository');
    assert.ok(fs.existsSync(outputPath), 'Output file should have been written');

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    assert.strictEqual(content.project.name, 'codemap');
    assert.ok(content.files['src/index.ts'], 'Should have mapped src/index.ts');
  } finally {
    // Clean up local temp output directory
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }
  }
});
