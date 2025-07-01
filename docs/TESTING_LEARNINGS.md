# Testing Learnings & Suggestions for Automation CLI Ecosystem

## Key Learnings

- **Direct function calls are more robust than subprocesses**: Refactor CLI orchestrators to import and call logic directly for better testability and reliability.
- **Commander.js is excellent for argument parsing**: Use Commander in all CLI scripts for consistent, robust flag and argument handling.
- **Mock external dependencies in unit tests**: For LLM and GitHub API calls, use mocks to ensure fast, reliable tests.
- **Integration tests should cover CLI workflows**: Use Bun's test runner and spawnSync to run CLI scripts and check outputs/files.
- **Always gate CLI entrypoints with `if (import.meta.main)`**: Prevents accidental CLI execution when importing modules for tests or orchestration.
- **Test all output formats and error scenarios**: Especially for scripts that support `--json`, `--table`, etc.
- **Remove unused E2E/Jest infrastructure**: Keep the test suite focused and maintainable.
- **Use a shared `test-mocks.ts` for reusable mocks**: Centralize common test mocks (e.g., for LLM or API calls) and monkey-patch dependencies in your tests. Bun does not provide a built-in mocking API, so manual monkey-patching is the recommended approach.
- **Validate required API keys and credentials at startup**: Use a config loader to check for required env vars (like `OPENAI_API_KEY`) and fail fast with a clear error if missing or invalid.
- **Test config loading and error handling, not every env var permutation**: Focus on unit tests for your config loader and a few integration tests for missing/invalid keys. Rely on types and schema validation for most guarantees.
- **Document all required keys in `.env.example`**: Keep this file up to date so contributors know what is required.

## Suggestions

- **Unit test all core service logic** (e.g., LLMPlanningService, GitHubService).
- **Unit test your config loader** for missing/invalid/valid env vars and error messages.
- **Integration test all CLI entrypoints** for expected outputs and error handling, including missing/invalid credentials.
- **Document test coverage and gaps** in a dedicated section of the repo.
- **Add CI checks for all test types** to catch regressions early.
- **Refactor for testability**: Extract pure functions and logic from CLI entrypoints where possible.
- **Use environment variables or test flags** to enable mock/test modes for integration tests.
- **Do not over-test every env var permutation**: Focus on main error paths and rely on types/schema validation for the rest.

## Learnings from Automation Improvements (June 2025)

### Idempotency and Clean Automation
- Always check for existing resources (e.g., issues) before creating new ones to prevent duplicates.
- Make automation safe to run repeatedly by ensuring it does not create clutter or redundant data.

### Accurate State Reflection
- Use the most reliable CLI commands for state queries (e.g., `gh issue list --json number` for open issues).
- Avoid using paginated or partial API endpoints unless you handle pagination and aggregation.
- Clearly separate health diagnostics (problems) from repository state (counts, status) in outputs.

### Robust Error Handling
- Handle each health check independently and provide specific, actionable error messages.
- Avoid generic catch-all error handling that can mask the real problem.

### Testing and Verification
- Always verify automation by running it multiple times and checking for idempotency and correct state reflection.
- Test edge cases, such as when resources already exist or when the repo is empty.

### Issue Organization and Labeling
- Automatically label all automation-created issues to maintain consistent organization.
- Create labels if they don't exist to ensure the automation can always apply proper labeling.
- Label existing unlabeled issues to improve overall repository organization.
- This makes it easier to filter, search, and manage issues by category.

---

_Last updated: [auto-generated]_ 