# Curated Fossils: Project State & Roadmap

This folder contains **curated fossils**—JSON (and optionally YAML for original human input) snapshots of the project's current state and intended direction.

## What is a Curated Fossil?
A curated fossil is a reviewed, versioned, and committed artifact that serves as the "source of truth" for:
- The current state of the project (automation, tests, fossilization)
- The planned direction and milestones (roadmap)
- Key decisions, milestones, or audit points

## Naming Conventions

| File Example                                 | Overwritten? | Curated? | Use Case                |
|----------------------------------------------|--------------|----------|-------------------------|
| `project_status.yml`                         | Yes          | Yes      | Preserves raw human input for audits, LLMs, Always up-to-date, canonical fossil |
| `roadmap.yml`                                | Yes          | Yes      | Preserves raw human input for audits, LLMs, Always up-to-date, canonical fossil |
| `curated_project_status_YYYY-MM-DD.json`     | No           | Yes      | Machine-readable, milestone, audit, freeze |
| `curated_roadmap_YYYY-MM-DD.json`           | No           | Yes      | Machine-readable, milestone, audit, freeze |
| `.meta.json`                                 | No           | Yes      | Audit/process metadata, provenance |

- **Latest files** (`project_status.yml`, `roadmap.yml`):
  - Always reflect the most recent state and plan
  - Overwritten by automation (E2E/pre-commit/CI)
  - Committed as the canonical, curated source of truth (automation-friendly fossil)
  - Used for traceability, reproducibility, and as the basis for all automation
- **Curated files** (`curated_*.json`):
  - Created at milestones, audits, or when a state needs to be frozen
  - Never overwritten; serve as immutable, historical fossils
  - Machine-readable, used for automation, LLMs, and reproducibility
- **.meta.json**:
  - (Optional) Stores process metadata, audit trails, hashes, timestamps, or curation context
  - Valuable for provenance, reproducibility, and advanced automation

**Automation & Curation Workflow:**
- Both `project_status.yml` and `roadmap.yml` are updated by automation scripts (e.g., `update-project-status.ts`), and should be committed after every meaningful automation run.
- E2E/CI/pre-commit workflows should check that these files are up to date and fail if not.
- Curated snapshots (`curated_*.json`) are created for milestones, audits, or releases and never overwritten.
- This ensures a transparent, reproducible, and automation-friendly project history.

**YAML vs JSON Rationale:**
- **YAML** is used for human editing, planning, and collaborative workflows (more readable, supports comments).
- **JSON** is used for automation, APIs, and LLMs (strict, unambiguous, easy to validate and process).
- For curated fossils, only `.json` is produced for programmatic, automation, and LLM usage. YAML is retained only as the original human input if needed for audits or traceability.

## Why This Matters
- **Traceability:** Every commit shows the project's state and plan at that point in time.
- **Reproducibility:** Anyone can check out any commit and see the exact status and roadmap.
- **Automation:** Scripts and CI/CD always rely on these files as canonical artifacts.

## Example
```
fossils/
  project_status.yml
  roadmap.yml
  curated_project_status_2024-07-01.json
  curated_roadmap_2024-07-01.json
```

## Ephemeral Fossils
- Local, in-progress, or sensitive fossils live in `.context-fossil/` and are **not committed**.
- Only curated fossils are committed here.

---

**Keep this folder as the single source of truth for your project's automation, roadmap, and milestone history!** 