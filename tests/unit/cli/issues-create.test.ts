import { test, expect, mock } from "bun:test";
import { runIssuesCreate } from "../../../src/cli/issues-create";

// Patch fs.existsSync
const fs = require("fs");
const originalExistsSync = fs.existsSync;
fs.existsSync = () => true;

test("runIssuesCreate creates an issue and fossil entry", async () => {
  mock.module("../../../src/utils/fossilIssue", () => ({
    createFossilIssue: async () => ({
      issueNumber: "123",
      fossilId: "fossil-1",
      fossilHash: "hash-1",
      deduplicated: false,
    })
  }));
  mock.module("../../../src/cli/context-fossil.ts", () => ({
    ContextFossilService: class {
      async initialize() { return; }
      async queryEntries() { return []; }
      async addEntry() { return; }
    }
  }));
  const result = await runIssuesCreate({ purpose: "Test", checklist: "- [ ] Test", metadata: "Meta" });
  expect(result).toBe(0);
  mock.restore();
});

test("runIssuesCreate skips duplicate", async () => {
  mock.module("../../../src/utils/fossilIssue", () => ({
    createFossilIssue: async () => ({
      issueNumber: "123",
      fossilId: "fossil-1",
      fossilHash: "hash-1",
      deduplicated: true,
    })
  }));
  mock.module("../../../src/cli/context-fossil.ts", () => ({
    ContextFossilService: class {
      async initialize() { return; }
      async queryEntries() { return []; }
      async addEntry() { return; }
    }
  }));
  const result = await runIssuesCreate({ purpose: "Test", checklist: "- [ ] Test", metadata: "Meta" });
  expect(result).toBe(0);
  mock.restore();
});

test("runIssuesCreate handles GitHub CLI not ready", async () => {
  mock.module("../../../src/utils/fossilIssue", () => ({
    createFossilIssue: async () => ({
      issueNumber: "123",
      fossilId: "fossil-1",
      fossilHash: "hash-1",
      deduplicated: false,
    })
  }));
  mock.module("../../../src/cli/context-fossil.ts", () => ({
    ContextFossilService: class {
      async initialize() { return; }
      async queryEntries() { return []; }
      async addEntry() { return; }
    }
  }));
  mock.module("../../../src/services/github.ts", () => ({
    GitHubService: class {
      async isReady() { return false; }
    }
  }));
  const result = await runIssuesCreate({ purpose: "Test", checklist: "- [ ] Test", metadata: "Meta" });
  expect(result).toBe(1);
  mock.restore();
});

// Restore fs.existsSync after all tests
fs.existsSync = originalExistsSync; 