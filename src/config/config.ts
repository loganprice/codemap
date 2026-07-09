import * as fs from 'node:fs';
import * as path from 'node:path';

export async function resolveConfigOptions(configFilePath: string): Promise<any> {
  const ext = path.extname(configFilePath).toLowerCase();
  const content = fs.readFileSync(configFilePath, 'utf-8');
  if (ext === '.yaml' || ext === '.yml') {
    try {
      const { parse: parseYaml } = await import('yaml');
      return parseYaml(content);
    } catch (err: any) {
      console.error(`Error parsing YAML config at ${configFilePath}: ${err.message}`);
      process.exit(1);
    }
  } else {
    try {
      return JSON.parse(content);
    } catch (err: any) {
      console.error(`Error parsing JSON config at ${configFilePath}: ${err.message}`);
      process.exit(1);
    }
  }
}

export async function loadConfig(configPath: string | null, absoluteRoot: string): Promise<any> {
  if (configPath) {
    const absoluteConfig = path.resolve(configPath);
    if (!fs.existsSync(absoluteConfig)) {
      console.error(`Error: Configuration file not found at ${absoluteConfig}`);
      process.exit(1);
    }
    return resolveConfigOptions(absoluteConfig);
  }

  const jsonConfig = path.join(absoluteRoot, 'code-survey.config.json');
  const yamlConfig = path.join(absoluteRoot, 'code-survey.config.yaml');
  const ymlConfig = path.join(absoluteRoot, 'code-survey.config.yml');

  if (fs.existsSync(jsonConfig)) {
    return resolveConfigOptions(jsonConfig);
  } else if (fs.existsSync(yamlConfig)) {
    return resolveConfigOptions(yamlConfig);
  } else if (fs.existsSync(ymlConfig)) {
    return resolveConfigOptions(ymlConfig);
  }

  return null;
}
