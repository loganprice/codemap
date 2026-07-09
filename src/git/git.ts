import { execSync } from 'node:child_process';

export function getGitChangedFiles(rootDir: string, diffTarget: string | boolean): Set<string> {
  const changed = new Set<string>();
  try {
    const target = typeof diffTarget === 'string' ? diffTarget : 'HEAD';
    const diffOutput = execSync(`git diff --name-only ${target}`, { cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    for (const line of diffOutput.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) changed.add(trimmed);
    }
    const statusOutput = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    for (const line of statusOutput.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) {
        const filePath = trimmed.substring(3).trim();
        if (filePath) changed.add(filePath);
      }
    }
  } catch {
    // Ignore git errors (e.g. not a git repository)
  }
  return changed;
}
