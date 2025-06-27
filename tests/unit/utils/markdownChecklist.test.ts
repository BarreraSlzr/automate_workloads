import { test, expect } from "bun:test";
import { updateMarkdownChecklist, ChecklistUpdate } from "../../../src/utils/markdownChecklist";

test("updates a single checklist item to checked", () => {
  const md = `# Tasks\n- [ ] Task A\n- [ ] Task B`;
  const updates: ChecklistUpdate = { "Task A": true };
  const result = updateMarkdownChecklist(md, updates);
  expect(result).toContain("- [x] Task A");
  expect(result).toContain("- [ ] Task B");
});

test("updates multiple checklist items", () => {
  const md = `- [ ] Task A\n- [x] Task B\n- [ ] Task C`;
  const updates: ChecklistUpdate = { "Task A": true, "Task B": false };
  const result = updateMarkdownChecklist(md, updates);
  expect(result).toContain("- [x] Task A");
  expect(result).toContain("- [ ] Task B");
  expect(result).toContain("- [ ] Task C");
});

test("preserves unrelated content and formatting", () => {
  const md = `# Header\nSome text.\n- [ ] Task A\n\nAnother section\n- [x] Task B`;
  const updates: ChecklistUpdate = { "Task B": false };
  const result = updateMarkdownChecklist(md, updates);
  expect(result).toContain("# Header");
  expect(result).toContain("Some text.");
  expect(result).toContain("- [ ] Task A");
  expect(result).toContain("- [ ] Task B");
});

test("does not change items not in updates", () => {
  const md = `- [ ] Task A\n- [x] Task B`;
  const updates: ChecklistUpdate = { "Task C": true };
  const result = updateMarkdownChecklist(md, updates);
  expect(result).toBe(md);
});

test("handles leading spaces and asterisks", () => {
  const md = `  - [ ] Indented Task\n* [x] Star Task`;
  const updates: ChecklistUpdate = { "Indented Task": true, "Star Task": false };
  const result = updateMarkdownChecklist(md, updates);
  expect(result).toContain("  - [x] Indented Task");
  expect(result).toContain("* [ ] Star Task");
}); 