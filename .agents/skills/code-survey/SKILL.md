---
name: Code Survey Codebase Mapping
description: Generate dynamic codebase maps, search symbols, analyze package dependencies, and map file structural symbols. Trigger this skill when the user wants to understand the codebase structure, locate symbols (classes, functions, types), or run/configure code-survey.
---

# Codebase Mapping & Navigation Skill

This skill explains how to utilize `code-survey` (via CLI or the registered MCP server) to scan codebases, query structural maps, and inspect symbol locations.

## Using the MCP Server Tools

Antigravity has the `code-survey` MCP server configured and enabled. You can invoke the following lazy tools on the `code-survey` server:

1. **`get_codebase_survey`**:
   - **Description:** Scans the target workspace and retrieves the complete JSON map of the project, including metadata, dependencies, files, namespaces, and internal links.
   - **Arguments:** None.
2. **`search_symbols`**:
   - **Description:** Search for symbol definitions across the entire codebase.
   - **Arguments:**
     - `query` (string): The search query (matched case-insensitively against class, function, method, variable, or type names).
3. **`get_file_symbols`**:
   - **Description:** Retrieves the parsed structure, imports, exports, and symbols for a single file.
   - **Arguments:**
     - `filePath` (string): The relative path of the file from the workspace root.
4. **`get_dependencies`**:
   - **Description:** Returns the external/npm and internal package dependencies of the repository.
   - **Arguments:** None.

## Using the CLI Directly

If you need to generate persistent surveys, watch files, or build customized representations, execute the CLI entrypoint:

```bash
node --experimental-strip-types bin/code-survey.ts [options]
```

### Key CLI Options:
- `--root <path>`: Scans a custom directory root.
- `--output <path>`: Specifies output target file/folder.
- `--format <format>`: Generates `json`, `yaml`, `markdown`, or `mermaid` representation.
- `--watch` or `-w`: Automatically re-maps the codebase on file change.
- `--split`: Splices the survey into separate component files.
- `--diff <ref>`: Maps only files changed since Git reference `<ref>`.
- `--include-signatures`: Extract parameter lists and return types.
