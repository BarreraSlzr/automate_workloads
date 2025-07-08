# Ephemeral Context Management Guide

This document summarizes the approach for managing **ephemeral (non-canonical, easy-to-erase) data** in the automation ecosystem. It is designed for rapid experimentation, learning, and pattern extraction without polluting canonical memory or causing storage bloat.

---

## Purpose

Provide a scalable, bloat-free, and ML/human-friendly system for managing ephemeral (scratch, draft, temp) data alongside canonical fossils. Enable rapid experimentation, learning, and pattern extraction without polluting the canonical memory or causing storage bloat.

---

## Folder Structure

- **Canonical:**
  - `fossils/context/`
  - `fossils/glossary/`
- **Ephemeral:**
  - `fossils/ephemeral/`
  - `fossils/ephemeral/address/`

---

## Naming Convention

Pattern: `<prefix>.<tag_summary>.<subtopic>.<topic>.<ext>`

- **prefix:** Source (`llm`, `ml`, `human`, `compute`)
- **tag_summary:** Short semantic tag or summary (`pattern`, `insight`, `glossary`, `draft`)
- **subtopic:** Optional, for further categorization (`naming`, `traceability`, etc.)
- **topic:** Main topic or goal (`transversal`, `workflow_vs_workload`, etc.)
- **ext:** File extension (`yml`, `md`, `json`, `ts`)

**Examples:**
- `llm.pattern.transversal.naming.yml`
- `human.insight.naming_conventions.md`
- `ml.glossary.traceability.pattern.json`
- `compute.draft.audit.traceability.yml`

---

## Metadata

Each ephemeral file should include:
- **Required:**
  - `source` (llm, ml, human, compute)
  - `created_by` (user, model, process)
  - `status` (draft, candidate, promoted, archived)
- **Optional:**
  - `deduplication_hash` (for deduplication/traceability)
  - `ttl` (time-to-live, auto-expiry)
  - `auto_promote` (boolean or weight/score)
  - `usage_count` (how often referenced/used)
  - `last_used` (timestamp or event)
  - `related` (other glossary/insight files or canonical fossils)
  - `notes` (freeform, for human/LLM comments)

---

## Lifecycle

1. **Creation:** Ephemeral files are created during LLM/ML/human/compute processes for drafts, temp logs, or in-progress insights.
2. **Deduplication:** Deduplication hash or semantic similarity is used to avoid storing near-duplicates.
3. **Promotion:** Files with high usage, weight, or human/LLM review are promoted to canonical fossils.
4. **Cleanup:** Files with expired TTL or low usage are deleted by cleanup scripts.
5. **Audit:** Optionally, keep a log of promotions, deletions, and merges for traceability.

---

## Integration

- **Canonical Reference:** Promoted ephemeral files are moved to `fossils/context/` or `fossils/glossary/` with updated status and metadata.
- **Feedback Loop:** ML/LLM periodically reviews ephemeral files for promotion or cleanup.
- **Human Review:** Humans can edit, promote, or delete ephemeral files as needed.

---

## Best Practices

- Never store ephemeral files in version control; add `fossils/ephemeral/` to `.gitignore`.
- Use semantic, source-aware naming for all ephemeral files.
- Automate cleanup and promotion with scripts and CI integration.
- Keep canonical fossils lean, deduplicated, and ML-ready.
- Use YAML/MD for human/LLM-friendly editing; JSON/TS for programmatic use.

---

## See Also

- [ephemeral_context_management.yml](./ephemeral_context_management.yml)
- [ephemeral_context_management.json](./ephemeral_context_management.json)
- [ephemeral_context_management.ts](./ephemeral_context_management.ts)
- [Canonical Fossil Management Guide](../CANONICAL_FOSSIL_MANAGEMENT_GUIDE.md)
- [CLI Command Insights](../CLI_COMMAND_INSIGHTS.md)
- [Advanced Fossil Query Patterns Guide](../ADVANCED_FOSSIL_QUERY_PATTERNS_GUIDE.md)

## Ephemeral Pattern Audit & Refactor Utility

To maintain a clean, ML-ready codebase, use the audit utility to detect and refactor all temp/original/backup files/scripts to the ephemeral pattern. This utility enforces the naming convention, moves files to ephemeral folders, and ensures .gitignore compliance. Integrate this as a DX transversal utility for all contributors.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Finds and refactors temp/original/backup files to ephemeral pattern.
- **Why:** Ensures clarity, cleanliness, and automation consistency.
- **Integration:** Recommended for all contributors, can be run pre-commit or in CI.
- **See also:** [Canonical Fossil Management Guide](../../CANONICAL_FOSSIL_MANAGEMENT_GUIDE.md) 