import * as fs from 'node:fs';
import * as path from 'node:path';

export function reportTokenBudget(
  absoluteOutput: string,
  format: string | undefined,
  split: boolean,
  result: {
    filesCount: number;
    symbolsCount: Record<string, number>;
  }
) {
  if (!fs.existsSync(absoluteOutput)) return;

  const isDir = fs.statSync(absoluteOutput).isDirectory();
  let sizeBytes = 0;
  let totalLength = 0;

  const actualExt = isDir ? '' : path.extname(absoluteOutput).toLowerCase();
  const actualFormat = format || (isDir ? 'json' : (actualExt === '.yaml' || actualExt === '.yml' ? 'yaml' : actualExt === '.md' || actualExt === '.markdown' ? 'markdown' : actualExt === '.mermaid' || actualExt === '.mmd' ? 'mermaid' : 'json'));

  if (isDir) {
    const files = fs.readdirSync(absoluteOutput);
    for (const f of files) {
      const fPath = path.join(absoluteOutput, f);
      if (fs.statSync(fPath).isFile()) {
        sizeBytes += fs.statSync(fPath).size;
        totalLength += fs.readFileSync(fPath, 'utf-8').length;
      }
    }
  } else {
    sizeBytes = fs.statSync(absoluteOutput).size;
    totalLength = fs.readFileSync(absoluteOutput, 'utf-8').length;
  }

  const sizeKb = (sizeBytes / 1024).toFixed(1);

  // Estimate tokens based on syntax ratios
  let charToTokenRatio = 3.2; // JSON baseline
  if (actualFormat === 'yaml') {
    charToTokenRatio = 3.7;
  } else if (actualFormat === 'markdown') {
    charToTokenRatio = 4.2;
  } else if (actualFormat === 'mermaid') {
    charToTokenRatio = 3.8;
  }

  const estTokens = Math.round(totalLength / charToTokenRatio);

  process.stderr.write('\n--- Code Survey Token Budget Estimator ---\n');
  process.stderr.write(`Output Format:    ${actualFormat}${isDir ? ' (split)' : ''}\n`);
  process.stderr.write(`Files Mapped:     ${result.filesCount}\n`);

  const symbolLines: string[] = [];
  for (const [key, val] of Object.entries(result.symbolsCount)) {
    if (val > 0) {
      symbolLines.push(`  - ${key}: ${val}`);
    }
  }
  if (symbolLines.length > 0) {
    process.stderr.write('Symbol Breakdown:\n');
    process.stderr.write(symbolLines.join('\n') + '\n');
  }

  process.stderr.write(`File Size:        ${sizeKb} KB (${sizeBytes} bytes)\n`);
  process.stderr.write(`Estimated Tokens: ~${estTokens.toLocaleString()} tokens\n`);
  process.stderr.write('--------------------------------------\n\n');
}
