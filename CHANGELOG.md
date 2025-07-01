## [Unreleased]
- LLM-generated excerpt field for all fossils (context-aware, one-sentence summary)
- Unified summary logic for CLI, Markdown, and JSON outputs
- Cleanup scripts for test/demo fossils
- Improved auditability and reporting
- Fossil provenance and traceability: all fossil entries now include a high-level `source` and a detailed `invocation` (script name and arguments) in metadata for full traceability.
- Removed the `--output` option from repo-orchestrator and related scripts; all output is now printed to the console.
- Refactored fossilization logic: unified all fossil creation into a single helper function, reducing code duplication and improving maintainability.
- Testing/linting adjustments: fixed linter errors related to fossil summary calls, enforced stricter function signatures for fossilization helpers, and improved code consistency. 