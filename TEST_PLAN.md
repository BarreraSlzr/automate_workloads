# 🧪 Test Plan: Unit Tests & Coverage for @/examples, Shell Scripts & Main User Stories

## 1. Goals
- Ensure all example scripts and main user flows are covered by automated unit tests
- Achieve and maintain high code coverage (target: 90%+)
- Automate, document, and enforce testing at every stage
- Treat CI as the gatekeeper for quality
- Make tests a first-class citizen in the workflow
- **NEW**: Standardize shell script testing with reusable utilities

## 2. Scope
- All files in `@/examples` (integration, orchestration, fossil storage, etc.)
- **NEW**: All shell scripts in `@/scripts` (using ScriptTester utility)
- Main user story cases (end-to-end flows, CLI entrypoints)
- Utility and service modules used by examples

## 3. Test Strategy

### 3.1 TypeScript/JavaScript Testing
- Use Bun's built-in test runner (or Jest if needed)
- Write unit tests for all functions, classes, and CLI commands
- Add integration tests for main user flows
- Mock external dependencies (GitHub, LLM, etc.)
- Use snapshot tests for CLI outputs where appropriate

### 3.2 Shell Script Testing (NEW)
- Use `ScriptTester` utility from `scripts/base.test.ts`
- Test mode validation (CHECK_ISSUES_TEST=1)
- Real mode output validation
- Edge case testing with various argument combinations
- Integration testing (executability, permissions)

#### ScriptTester Usage Example:
```typescript
import { ScriptTester } from "./base.test.js";

const tester = new ScriptTester("./scripts/my-script.sh", "Custom test message");

// Test mode validation
await tester.testMode();
await tester.testMode(["arg1", "arg2"]);

// Real mode with output validation
await tester.realMode([], ["Expected output"]);
await tester.realMode(["arg1"], ["Expected"], ["Unexpected"]);

// Edge cases
await tester.testEdgeCases([
  { args: ["spaces in arg"], desc: "arguments with spaces" },
  { args: ["special!@#"], desc: "special characters" }
], "Expected output");

// Integration
await tester.isExecutable();
```

### 3.3 Test Organization
- **Generic utilities**: `scripts/base.test.ts` (reusable across scripts)
- **Script-specific tests**: `scripts/[script-name].test.ts` (custom test cases)
- **Separation of concerns**: Keep generic logic in base, specific logic with scripts

## 4. Coverage Targets
- **Statements:** 90%+
- **Branches:** 85%+
- **Functions:** 90%+
- **Lines:** 90%+
- **Shell Scripts:** 100% (all scripts must have corresponding tests)

## 5. CI Integration
- Run all tests and coverage checks on every PR and push (GitHub Actions)
- Fail CI if coverage drops below target
- Require passing tests and coverage for PR merge
- **NEW**: Run shell script tests in parallel with TypeScript tests

## 6. Reporting
- Generate coverage reports (text + HTML)
- Upload coverage artifacts to GitHub Actions
- Comment coverage summary on PRs (optional)
- **NEW**: Separate reporting for shell script test coverage

## 7. Testing Patterns

### 7.1 Shell Script Test Pattern
```typescript
// scripts/my-script.test.ts
import { ScriptTester } from "./base.test.js";

const tester = new ScriptTester("./scripts/my-script.sh", "Custom test message");

// Script-specific test cases
const testCases = [
  { args: [], expectedOutput: ["Expected"], notExpectedOutput: ["Unexpected"] }
];

// Edge cases
const edgeCases = [
  { args: ["edge case"], desc: "description" }
];

test("my-script.sh basic functionality", async () => {
  await tester.testMode();
  await tester.isExecutable();
});

test("my-script.sh real mode validation", async () => {
  await tester.realMode([], ["Expected output"]);
});
```

### 7.2 Test Mode Pattern
All shell scripts should support test mode:
```bash
#!/bin/bash
if [[ "$CHECK_ISSUES_TEST" == "1" ]]; then
  echo "[TEST MODE] script-name.sh ran successfully."
  exit 0
fi
# ... rest of script
```

## 8. Ownership
- All contributors are responsible for maintaining and improving test coverage
- PRs must include or update tests for new/changed code
- **NEW**: All shell scripts must have corresponding test files
- **NEW**: Use ScriptTester utility for consistent shell script testing

## 9. Test File Naming Convention
- TypeScript tests: `*.test.ts`
- Shell script tests: `scripts/[script-name].test.ts`
- Base utilities: `scripts/base.test.ts`

## 10. Performance Considerations
- Run focused tests to avoid timeouts from external dependencies
- Separate comprehensive tests from basic functionality tests
- Use test mode for fast validation in CI
- Mock external services when possible

---
*Last updated: 2025-06-25* 