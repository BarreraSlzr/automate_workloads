# LLM Onboarding & Development Preferences

## Project Structure

- `config.ts` — Loads and validates environment variables using Zod and Raycast API.
- `obsidianService.ts` — Utilities for reading/writing Obsidian vault files.
- `githubService.ts` — GitHub API helpers using Octokit.
- `gmailService.ts` — Gmail API helpers.
- `bufferService.ts` — Buffer API helpers.
- `twitterService.ts` — Twitter API helpers.
- `cli/` — CLI commands (e.g., `get_mentions.ts`, `daily_note_updater.ts`).

## Development Preferences (Cursor Rules)

- Use **Bun** for all scripts and dependency management.
- Use **TypeScript** for type safety and maintainability.
- Use **Zod** for all runtime validation (especially config/env vars).
- Store all secrets in **Raycast environment variables** (never hardcode credentials).
- Use **Octokit** for GitHub API access.
- Modularize each integration as a service file.
- Document all modules and CLI commands.
- Prefer functional, composable code.

## Onboarding Steps

1. **Install dependencies:**
   ```sh
   bun install
   ```
2. **Set up Raycast environment variables:**
   - `GITHUB_TOKEN`, `GMAIL_TOKEN`, `BUFFER_TOKEN`, `TWITTER_BEARER_TOKEN`
   - Use Raycast Preferences → Extensions → Environment Variables.
3. **Run CLI commands:**
   ```sh
   bun run cli/get_mentions.ts
   ```
4. **Add new modules:**
   - Create a new service file (e.g., `notionService.ts`).
   - Validate all config/env with Zod.
   - Document usage in this file.

## Coding Conventions

- Always validate external input.
- Use async/await for all I/O.
- Keep CLI commands in `cli/` directory.
- Use Raycast for quick access to scripts.

---

Welcome to the automation ecosystem! 🚀
