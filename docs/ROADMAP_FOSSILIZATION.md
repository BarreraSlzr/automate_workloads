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