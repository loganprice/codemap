import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PackageDependencies } from './types.ts';

export function parsePackageDependencies(dir: string): PackageDependencies {
  const deps: PackageDependencies = {};

  // NPM (package.json)
  const pkgJsonPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      deps.npm = {
        ...(content.dependencies || {}),
        ...(content.devDependencies || {})
      };
    } catch {
      // Ignore parse errors
    }
  }

  // Go Modules (go.mod)
  const goModPath = path.join(dir, 'go.mod');
  if (fs.existsSync(goModPath)) {
    try {
      const content = fs.readFileSync(goModPath, 'utf-8');
      const goDeps: Record<string, string> = {};

      // Match multi-line require blocks
      const requireBlockRegex = /require\s*\(([\s\S]*?)\)/g;
      let match;
      while ((match = requireBlockRegex.exec(content)) !== null) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2 && !parts[0].startsWith('//')) {
            goDeps[parts[0]] = parts[1];
          }
        }
      }

      // Match single-line require statements: require github.com/foo/bar v1.0.0
      const singleRequireRegex = /^\s*require\s+([a-zA-Z0-9.\-_\/]+)\s+([^\s]+)/gm;
      while ((match = singleRequireRegex.exec(content)) !== null) {
        goDeps[match[1]] = match[2];
      }

      if (Object.keys(goDeps).length > 0) {
        deps.go = goDeps;
      }
    } catch {
      // Ignore
    }
  }

  // Java Maven (pom.xml)
  const pomPath = path.join(dir, 'pom.xml');
  if (fs.existsSync(pomPath)) {
    try {
      const content = fs.readFileSync(pomPath, 'utf-8');
      const mavenDeps: Record<string, string> = {};
      const depRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
      let match;
      while ((match = depRegex.exec(content)) !== null) {
        const block = match[1];
        const groupId = block.match(/<groupId>(.*?)<\/groupId>/)?.[1]?.trim();
        const artifactId = block.match(/<artifactId>(.*?)<\/artifactId>/)?.[1]?.trim();
        const version = block.match(/<version>(.*?)<\/version>/)?.[1]?.trim();
        if (groupId && artifactId && version) {
          mavenDeps[`${groupId}:${artifactId}`] = version;
        }
      }
      if (Object.keys(mavenDeps).length > 0) {
        deps.maven = mavenDeps;
      }
    } catch {
      // Ignore
    }
  }

  // NuGet (CSProj files)
  const files = fs.readdirSync(dir);
  const csprojFile = files.find(f => f.endsWith('.csproj'));
  if (csprojFile) {
    try {
      const content = fs.readFileSync(path.join(dir, csprojFile), 'utf-8');
      const nugetDeps: Record<string, string> = {};
      
      const packageRefRegex = /<PackageReference\s+([\s\S]*?)\/>/g;
      let match;
      while ((match = packageRefRegex.exec(content)) !== null) {
        const attrs = match[1];
        const include = attrs.match(/Include="([^"]+)"/)?.[1];
        const version = attrs.match(/Version="([^"]+)"/)?.[1];
        if (include && version) {
          nugetDeps[include] = version;
        }
      }

      if (Object.keys(nugetDeps).length > 0) {
        deps.nuget = nugetDeps;
      }
    } catch {
      // Ignore
    }
  }

  // Python Pip (requirements.txt)
  const reqPath = path.join(dir, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const lines = fs.readFileSync(reqPath, 'utf-8').split('\n');
      const pipDeps: Record<string, string> = {};
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // Parse package>=version or package==version
          const match = trimmed.match(/^([^>=<#\s]+)\s*(>=|<=|==|!=|<|>)\s*([^\s]+)/);
          if (match) {
            pipDeps[match[1]] = match[2] + match[3];
          } else {
            // No specifier, e.g. requests
            pipDeps[trimmed] = 'latest';
          }
        }
      }
      if (Object.keys(pipDeps).length > 0) {
        deps.pip = pipDeps;
      }
    } catch {
      // Ignore
    }
  }

  return deps;
}
