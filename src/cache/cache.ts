import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export function loadCache(rootDir: string, options: any) {
  const optionsHash = crypto.createHash('md5')
    .update(JSON.stringify({
      includeInternalVars: !!options.includeInternalVars,
      includeDocs: !!options.includeDocs,
      includeSignatures: !!options.includeSignatures
    }))
    .digest('hex');

  const cacheDir = path.join(rootDir, '.code-survey');
  const cacheFile = path.join(cacheDir, 'cache.json');
  let cache: { optionsHash: string; files: Record<string, any> } = {
    optionsHash,
    files: {}
  };

  if (fs.existsSync(cacheFile)) {
    try {
      const rawCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      if (rawCache && rawCache.optionsHash === optionsHash && rawCache.files) {
        cache = rawCache;
      }
    } catch {
      // Ignore parsing errors and start fresh
    }
  }

  return { cache, cacheDir, cacheFile };
}

export function saveCache(cacheDir: string, cacheFile: string, cache: any) {
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Ignore cache saving errors
  }
}
