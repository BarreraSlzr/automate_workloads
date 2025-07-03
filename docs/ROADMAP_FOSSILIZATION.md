# Roadmap & Checklist Fossilization Standard

> 🟢 **Best Practice: Shared Types in @/types**
>
> - Centralize all roadmap/checklist/metadata types in `src/types/`.
> - This ensures that any roadmap, checklist, or fossil structure is:
>   - Type-safe (for code/LLMs)
>   - Reusable (across scripts, CLIs, docs, and automation)
>   - Easy to parse/validate (from YAML or JSON)
> - **YAML for human**
> - **JSON for API/automation**

## Pattern Overview

1. **Define a TypeScript type** in `src/types/` for each roadmap/checklist/metadata fossil.
2. **Store the source of truth** as YAML (preferred for human editing) or JSON (for deeply nested/automated structures).
3. **Parse YAML/JSON** to the shared type for automation, validation, and manipulation.
4. **Render Markdown** from the parsed object for documentation, issues, and previews.
5. **Convert YAML to JSON** for API or further automation usage.

## Fossil Management Workflow

- **Edit fossils in YAML** for clarity and version control.
- **Convert YAML to JSON** using the `yamlToJson` utility for API/automation.
- **Render Markdown** using the `roadmapToMarkdown` utility for docs/issues.
- **Relate fossils to issues, status, and metadata** by including fields like `issues`, `status`, `context`, etc. in the YAML.
- **Keep fossils up to date** with project changes and document all insights and decisions in the fossil metadata.

## Example: Roadmap Fossil with Issues and Metadata

```yaml
type: e2e_automation_roadmap
source: llm-human-collab
createdBy: llm+human
createdAt: 2024-07-01T12:00:00Z
tasks:
  - task: Update integration tests
    status: pending
    issues:
      - 42  # GitHub issue number
      - 57
    context: "Refactor to use real repo for E2E tests"
    owner: emmanuelbarrera
    subtasks:
      - task: Replace repo references
        status: done
      - task: Add auth check
        status: pending
  - task: Document roadmap
    status: ready
    deadline: 2024-07-10
    context: "Ensure all contributors understand fossil workflow"
```

## Guidance for Extending the Pattern

- Use this pattern for any project artifact that benefits from structured, type-safe, and human/LLM-friendly management (e.g., plans, checklists, status reports).
- Add new types to `src/types/`, new YAMLs for each fossil, and update utilities/scripts as needed.
- Always document insights, decisions, and context in the fossil metadata for future reference.

## Benefits

- **LLMs and humans** can both reason about, update, and document project roadmaps and checklists.
- **Automation** is easy: parse, validate, render, and update fossils programmatically.
- **Documentation** is always up to date and consistent with the codebase.

## Glue: Roadmap, Fossils, and GitHub Sync

### Local-First, Deduplication, and Sync
- The automation reads `fossils/roadmap.yml` and checks for existing issues/milestones/labels in the local fossil collection (e.g., `github-fossil-collection.json`).
- Before creating anything on GitHub, the tool checks if the item already exists (by title, label, milestone, or linked issue number).
- If it exists, it updates or skips; if not, it creates.
- Each task in `fossils/roadmap.yml` can reference one or more GitHub issues via the `issues` property, and can be extended to support `milestones` and `labels`.

### Fossilization Percentage and Recommendations
- The tool can calculate what percentage of roadmap tasks are fossilized (i.e., have corresponding issues/milestones/labels on GitHub).
- This can be surfaced as a metric in the CLI or in a report.
- If fossilization is incomplete, the tool can recommend which tasks to sync next, or which labels/milestones are missing.
- The tool can also suggest new labels/milestones based on local fossils that don't exist on GitHub, and recommend cleaning up or merging duplicates.

### CLI/Utility Integration
- CLI tools like `automate-github-fossils` and the Repository Orchestrator use this pattern to ensure traceability, deduplication, and automation.
- All utilities should use Zod schemas for parameter validation and the object params pattern for extensibility.

### Extending fossils/roadmap.yml
- Use the `issues` property to link tasks to GitHub issues.
- Optionally add `milestones` and `labels` properties for explicit linkage.
- Example:
```yaml
  - task: Implement deduplication logic
    status: in progress
    issues: [123, 124]
    milestones: ["Automation Sync"]
    labels: ["automation", "deduplication"]
```

## LLM Insights, Benchmarks, and Discoveries as Fossils

- All LLM outputs (insights, benchmarks, model discoveries) can now be fossilized using type-safe utilities.
- Types are defined in `src/types/llmFossil.ts`.
- Use `fossilizeLLMInsight`, `fossilizeLLMBenchmark`, and `fossilizeLLMDiscovery` from `src/utils/fossilize.ts`.
- Fossils are stored in `fossils/llm_insights/`.

### Example: LLM Insight Fossil JSON
```json
{
  "type": "insight",
  "timestamp": "2025-07-03T12:00:00Z",
  "model": "gpt-4",
  "provider": "openai",
  "excerpt": "Short summary of the insight.",
  "prompt": "What is AI?",
  "response": "AI is ..."
}
```

- This enables full traceability, reproducibility, and retrospective analysis of LLM usage and results.

## Fossil Publication Automation

The roadmap and project status fossils are now automatically published as public-facing markdown and JSON in the `fossils/public/` folder structure. See [Fossil Publication Workflow](./FOSSIL_PUBLICATION_WORKFLOW.md) for details. This process is future-proofed for GitHub Actions/CI integration and public API endpoints. 