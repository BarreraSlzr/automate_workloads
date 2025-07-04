# E2E Automation & Testing Roadmap
_Source: e2e-pre-commit | Created: Mon Jul 01 2024 06:00:00 GMT-0600 (Central Standard Time)_

- [ ] **Project Setup, Onboarding, and Audit Readiness**

- [x] **Update integration tests to use real repo**

- [x] **Document fossilization workflow**

- [x] **Automate roadmap to GitHub issue/project sync**

- [ ] **Prototype Gist-based fossilization for account-level fossils**

- [x] **Tag all test-created issues/labels for cleanup**
  - Recommendation: Use unique tags/labels
  - Preference: Automate cleanup

- [x] **Add reporting/cleanup scripts for test artifacts**
  - Recommendation: Run post-test in CI
  - Preference: Summarize repo changes

- [ ] **Set up script to automatically curate test outputs as fossils**
  - Recommendation: Automate curation post-test; only write files that are curated fossils or referenced artifacts
  - Preference: Store curated outputs in fossils/ or a dedicated directory

- [x] **Integrate E2E tests into CI pipeline**
  - Recommendation: Fail fast on setup/auth errors
  - Preference: Run on PRs to main/test

- [x] **Save this roadmap as a fossil or issue for LLM/human reference**
  - Recommendation: Use e2e-roadmap tag/type
  - Preference: Store in /src/types or as .md/.json

- [x] **Document all E2E insights, code preferences, and automation patterns**
  - Recommendation: Add to project docs and reference in fossil
  - Preference: Keep docs up to date with codebase changes

- [ ] **Enforce schema-driven Params and runtime validation in all utilities**

- [x] **Audit and enforce schema-driven, object params pattern in all utilities**

- [x] **Canonical fossilization of roadmap.yml and project_status.yml**

- [ ] **Scaffold E2E tests for fossilization and LLM insights workflow**

- [ ] **Handle OpenAI API rate limit errors (429) in all LLM utilities**

- [ ] **Refactor test to only write curated fossil outputs**
  - Recommendation: Use as a template for refactoring other tests
  - Preference: All test outputs must be curated fossils or referenced artifacts

- [ ] **Enhance local LLM support for automation ecosystem**
  - Recommendation: Prioritize intelligent routing and fossilization integration first, then add CLI tools and optimization features. Focus on reliability and seamless fallback to cloud LLM when local LLM is insufficient.

  - Preference: Prefer local LLM for cost-sensitive automation tasks, with cloud LLM for complex analysis and generation tasks. Implement comprehensive monitoring and automatic provider switching based on performance and cost metrics.


- [ ] **Remove semantic tag test LLM patching/simulation once local Ollama model is connected**

- [ ] **Enforce Canonical Fossil Artifact Policy and Curation Workflow**

- [ ] **Automate public markdown and JSON generation from project_status.yml**

- [ ] **Automate fossil-to-markdown/json workflow with GitHub Actions/CI**

- [ ] **Fossilize prompts/system messages and publish as needed**

- [ ] **Integrate local LLM for context gathering and fossilization**

- [ ] **Close Documentation Gaps and Improve Coherence Across All Docs**
  - Recommendation: Prioritize updating API_REFERENCE.md and DEVELOPMENT_GUIDE.md first as they are the primary onboarding documents.
Then update specialized docs (CLI_COMMAND_INSIGHTS.md, COMPLETE_AUTOMATION_ECOSYSTEM.md) to ensure consistency.
Finally, create validation processes to maintain coherence going forward.

  - Preference: Prefer comprehensive examples and clear migration paths over theoretical documentation.
Focus on practical patterns that developers can immediately apply.
Ensure all docs reference the same patterns and examples for consistency.


- [ ] **Complete Remaining Documentation Improvements and Validation**
  - Recommendation: Prioritize intelligent tagging and local LLM documentation as they are key features.
Then complete fossil publication workflow documentation.
Finally, implement CI validation to prevent future inconsistencies.

  - Preference: Prefer comprehensive, practical documentation over theoretical guides.
Focus on examples and patterns that developers can immediately apply.
Ensure all validation processes are automated and integrated into CI.
