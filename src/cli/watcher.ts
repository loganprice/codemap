import * as fs from 'node:fs';
import * as path from 'node:path';

export function startWatcher(
  absoluteRoot: string,
  isMultiSurvey: boolean,
  hasCliOverrides: boolean,
  surveysList: any[],
  output: string | undefined,
  split: boolean,
  excludes: string[],
  executeSurveys: () => Promise<void>
) {
  // Gather output targets to ignore them
  const allOutputPaths = new Set<string>();
  if (isMultiSurvey && !hasCliOverrides) {
    for (const s of surveysList) {
      const resolvedRoot = s.root ? path.resolve(absoluteRoot, s.root) : absoluteRoot;
      const out = s.output
        ? path.resolve(resolvedRoot, s.output)
        : (s.split ? path.join(resolvedRoot, 'code-survey-results') : path.join(resolvedRoot, 'code-survey.json'));
      allOutputPaths.add(out);
    }
  } else {
    const out = output
      ? path.resolve(output)
      : (split ? path.join(absoluteRoot, 'code-survey-results') : path.join(absoluteRoot, 'code-survey.json'));
    allOutputPaths.add(out);
  }

  console.error(`\nWatching for changes in ${absoluteRoot}... (Press Ctrl+C to stop)`);
  let debounceTimeout: NodeJS.Timeout | null = null;
  let isRunning = false;

  return fs.watch(absoluteRoot, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const relPath = filename.replace(/\\/g, '/');

    // 1. Default ignores
    if (
      relPath.startsWith('.git/') || relPath === '.git' ||
      relPath.startsWith('.code-survey/') || relPath === '.code-survey' ||
      relPath.startsWith('node_modules/') || relPath === 'node_modules'
    ) {
      return;
    }

    // 2. Custom excludes
    for (const pattern of excludes) {
      if (relPath.includes(pattern) || relPath.startsWith(pattern)) {
        return;
      }
    }

    // 3. Ignore output files/dirs (exact matches or sub-paths)
    const absChangedPath = path.resolve(absoluteRoot, filename);
    for (const outPath of allOutputPaths) {
      if (absChangedPath === outPath || absChangedPath.startsWith(outPath + path.sep)) {
        return;
      }
    }

    if (isRunning) return;

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      isRunning = true;
      console.error(`\nFile change detected: ${relPath}. Regenerating surveys...`);
      try {
        await executeSurveys();
        console.error(`Regeneration complete.`);
      } catch (err: any) {
        console.error(`Error regenerating: ${err.message}`);
      } finally {
        isRunning = false;
      }
    }, 300);
  });
}
