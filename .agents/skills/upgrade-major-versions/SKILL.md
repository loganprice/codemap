---
name: upgrade-major-versions
description: Upgrade project dependencies to a new major version, utilizing the 'codemap' tool to map codebase structure, locate breaking API usages, and verify refactoring.
---

# Upgrading Major Versions with Codemap

This skill guides the agent through the process of upgrading a codebase's dependency to a new major version. It leverages the **Codemap** tool to locate all import entry points in the current project, perform remote API diffing on the dependency itself between versions, and orchestrate AST-informed refactoring of breaking changes.

---

## Prerequisites

Ensure the **Codemap** CLI is installed or run it via the local script:
- Local/Deno execution: `deno run --allow-read --allow-write --allow-sys --allow-env --allow-net <path_to_codemap>/bin/codemap.ts`
- NPM execution: `npx @lprice/codemap` (or local npm script/binary if installed)

---

## Step-by-Step Workflow

### Phase 1: Pre-Upgrade Usages Mapping

Before updating any version configurations, map the codebase to find where the target dependency is imported and used.

1. **Generate a Detailed Codebase Map**:
   Run `codemap` in JSON or YAML format with internal variables and docstrings included to get complete symbol context:
   ```bash
   npx @lprice/codemap --format json --internal-vars --include-docs -o codemap.json
   ```

2. **Locate Target Dependency Usages**:
   Analyze the generated `codemap.json` to find all files importing the package. Look for:
   - Imports where the `source` or `resolved` paths match the target package name (e.g., `"react"`, `"lodash"`, or internal sub-paths like `"lodash/map"`).
   - The specific symbols (`importedSymbols`) imported from the package.

3. **Map the Coupling Graph**:
   For deeply integrated packages, generate a Mermaid dependency graph to visualize how modules interact with the target dependency:
   ```bash
   npx @lprice/codemap --format mermaid -o coupling_graph.mermaid
   ```

---

### Phase 2: Remote Dependency API Diffing

When upgrading a dependency, you can map the dependency's own repository at its old vs. new versions to identify public API changes.

1. **Clone the Dependency Repository**:
   Clone the dependency's source repository twice, checking out the old and new version tags into temporary directories:
   ```bash
   git clone --branch <old-version-tag> --depth 1 <dependency-repo-url> /tmp/dep-old
   git clone --branch <new-version-tag> --depth 1 <dependency-repo-url> /tmp/dep-new
   ```

2. **Map the Remote Dependency Repositories**:
   Run `codemap` on both cloned repositories, outputting JSON formats:
   ```bash
   npx @lprice/codemap -r /tmp/dep-old -f json -o dep-old-map.json
   npx @lprice/codemap -r /tmp/dep-new -f json -o dep-new-map.json
   ```

3. **Perform API Export Diffing**:
   Compare the exported symbols (`exports`) in `dep-old-map.json` and `dep-new-map.json`:
   - Identify **deleted exports** (direct breaking changes).
   - Identify **altered signatures** (modified parameters, return types, or locations of classes/functions).
   - Identify **new exports** that could serve as replacements.
   Use this comparison to generate a targeted checklist of exactly what symbol changes will affect your project's usages (from Phase 1).

---

### Phase 3: Gathering Breaking Changes & Changelogs

1. Search for the release notes, changelog, or migration guide of the target package (from version `X.y.z` to `Y.0.0`).
2. Supplement the automated API diff from Phase 2 with any documentation regarding:
   - Behavioral or runtime changes not visible in static signatures.
   - Configuration schema or environment updates.
3. Consolidate the Phase 2 diff and documentation into a single list of files in your project that require structural refactoring.

---

### Phase 4: Package Config Update & Install

1. Update the dependency version in the project package configuration:
   - **Node.js**: Update `package.json`
   - **Deno**: Update `deno.json` or import map
   - **Go**: Update `go.mod`
   - **Rust**: Update `Cargo.toml`
   - **Python**: Update `pyproject.toml` or `requirements.txt`
2. Run the package installer (e.g. `npm install`, `cargo update`, `go get -u`) to pull down the new major version.

---

### Phase 5: AST-Guided Refactoring

1. **Run Compile / Diagnostics**:
   Run the project's type-checker or compiler (e.g. `npx tsc`, `cargo check`, `go build`) to locate compilation errors.
2. **Perform Targeted Updates**:
   For each file reported with a compilation error, or identified in Phase 1/2 as using a deprecated or modified API:
   - Reference `codemap.json` (your codebase map) and the dependency's `dep-new-map.json` to map signatures correctly.
   - Refactor the code to match the new API structure.
3. **Leverage Git Diffs with Codemap**:
   To keep your context window clean during large refactorings, generate a delta map showing only changed files in your repository:
   ```bash
   npx @lprice/codemap --diff main --format markdown -o diff_map.md
   ```

---

### Phase 6: Verification & Walkthrough

1. **Verify Codebase Type-Safety**:
   Ensure the compiler or type-checker exits with code `0`.
2. **Run Test Suites**:
   Execute the full test suite to catch runtime regressions.
3. **Generate Walkthrough**:
   Document the upgraded dependency, the list of refactored files, and test results in a `walkthrough.md` artifact. Include a git diff summary of the modifications.
