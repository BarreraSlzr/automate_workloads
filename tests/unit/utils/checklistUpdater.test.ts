import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import {
  updateChecklistFile,
  updateMultipleChecklistFiles,
  detectFileType,
  createBackup,
  parseChecklistUpdates,
  generateUpdateReport,
  ChecklistItemUpdate,
  UpdateResult
} from "../../../src/utils/checklistUpdater";

// Test files
const testDir = path.join(process.cwd(), 'test-checklist-files');
const markdownFile = path.join(testDir, 'test.md');
const jsonFile = path.join(testDir, 'test.json');
const yamlFile = path.join(testDir, 'test.yaml');

// Sample content
const sampleMarkdown = `# Test Checklist

## Section 1
- [ ] Task A
- [x] Task B
- [ ] Task C

## Section 2
- [ ] Task D
- [x] Task E
`;

const sampleJson = {
  "type": "test_checklist",
  "checklist": [
    { "task": "Task A", "checked": false },
    { "task": "Task B", "checked": true },
    { "task": "Task C", "checked": false }
  ]
};

const sampleYaml = `type: test_roadmap
tasks:
  - task: Task A
    status: pending
    context: Test task A
  - task: Task B
    status: done
    context: Test task B
  - task: Task C
    status: partial
    context: Test task C
`;

describe("Checklist Updater", () => {
  beforeAll(() => {
    // Create test directory and files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(markdownFile, sampleMarkdown);
    fs.writeFileSync(jsonFile, JSON.stringify(sampleJson, null, 2));
    fs.writeFileSync(yamlFile, sampleYaml);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Clean up backup files
    const backupFiles = fs.readdirSync('.').filter(f => f.includes('.backup.'));
    backupFiles.forEach(file => {
      fs.unlinkSync(file);
    });
  });

  describe("detectFileType", () => {
    test("detects markdown files", () => {
      expect(detectFileType("test.md")).toBe("markdown");
      expect(detectFileType("test.markdown")).toBe("markdown");
    });

    test("detects JSON files", () => {
      expect(detectFileType("test.json")).toBe("json");
    });

    test("detects YAML files", () => {
      expect(detectFileType("test.yaml")).toBe("yaml");
      expect(detectFileType("test.yml")).toBe("yaml");
    });

    test("detects by content when extension is unknown", () => {
      const tempFile = path.join(testDir, "unknown.txt");
      fs.writeFileSync(tempFile, '{"key": "value"}');
      
      expect(detectFileType(tempFile)).toBe("json");
      
      fs.unlinkSync(tempFile);
    });
  });

  describe("createBackup", () => {
    test("creates backup file with timestamp", () => {
      const backupPath = createBackup(markdownFile);
      
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(backupPath).toMatch(/\.backup\./);
      
      // Clean up
      fs.unlinkSync(backupPath);
    });
  });

  describe("parseChecklistUpdates", () => {
    test("parses array format", () => {
      const updates = parseChecklistUpdates(JSON.stringify([
        { id: "Task A", status: true, comment: "Done" },
        { id: "Task B", status: "done" }
      ]));
      
      expect(updates).toHaveLength(2);
      expect(updates[0]).toEqual({
        id: "Task A",
        status: true,
        comment: "Done",
        metadata: undefined
      });
      expect(updates[1]?.status).toBe("done");
    });

    test("parses object format", () => {
      const updates = parseChecklistUpdates(JSON.stringify({
        "Task A": true,
        "Task B": "done"
      }));
      
      expect(updates).toHaveLength(2);
      expect(updates[0]?.id).toBe("Task A");
      expect(updates[0]?.status).toBe(true);
      expect(updates[1]?.id).toBe("Task B");
      expect(updates[1]?.status).toBe("done");
    });

    test("throws error for invalid JSON", () => {
      expect(() => parseChecklistUpdates("invalid json")).toThrow();
    });
  });

  describe("updateChecklistFile - Markdown", () => {
    test("updates markdown checklist items", () => {
      const updates: ChecklistItemUpdate[] = [
        { id: "Task A", status: true },
        { id: "Task C", status: true }
      ];
      
      const result = updateChecklistFile(markdownFile, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(result.notFoundCount).toBe(0);
      expect(result.content).toContain("- [x] Task A");
      expect(result.content).toContain("- [x] Task C");
      expect(result.content).toContain("- [x] Task B"); // Should remain checked
    });

    test("handles non-existent tasks", () => {
      const updates: ChecklistItemUpdate[] = [
        { id: "Non-existent Task", status: true }
      ];
      
      const result = updateChecklistFile(markdownFile, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
      expect(result.notFoundCount).toBe(1);
    });

    test("handles non-existent file", () => {
      const result = updateChecklistFile("non-existent.md", []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });
  });

  describe("updateChecklistFile - JSON", () => {
    test("updates JSON checklist items", () => {
      const updates: ChecklistItemUpdate[] = [
        { id: "Task A", status: true },
        { id: "Task C", status: true }
      ];
      
      const result = updateChecklistFile(jsonFile, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      
      const updatedData = JSON.parse(result.content || "{}");
      expect(updatedData.checklist[0].checked).toBe(true);
      expect(updatedData.checklist[2].checked).toBe(true);
    });

    test("handles roadmap format", () => {
      const roadmapJson = {
        "type": "roadmap",
        "tasks": [
          { "task": "Task A", "status": "pending" },
          { "task": "Task B", "status": "done" }
        ]
      };
      
      const tempFile = path.join(testDir, "roadmap.json");
      fs.writeFileSync(tempFile, JSON.stringify(roadmapJson, null, 2));
      
      const updates: ChecklistItemUpdate[] = [
        { id: "Task A", status: "done" as any }
      ];
      
      const result = updateChecklistFile(tempFile, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
      
      fs.unlinkSync(tempFile);
    });
  });

  describe("updateChecklistFile - YAML", () => {
    test("updates YAML roadmap tasks", () => {
      const updates: ChecklistItemUpdate[] = [
        { id: "Task A", status: "done" as any, comment: "Updated context" },
        { id: "Task C", status: "ready" as any }
      ];
      
      const result = updateChecklistFile(yamlFile, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(result.content).toContain("status: done");
      expect(result.content).toContain("status: ready");
    });
  });

  describe("updateMultipleChecklistFiles", () => {
    test("updates multiple files", () => {
      const files = [
        {
          path: markdownFile,
          updates: [{ id: "Task A", status: true }]
        },
        {
          path: jsonFile,
          updates: [{ id: "Task A", status: true }]
        }
      ];
      
      const results = updateMultipleChecklistFiles(files);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.result?.success).toBe(true);
      expect(results[1]?.result?.success).toBe(true);
    });
  });

  describe("generateUpdateReport", () => {
    test("generates report with success and failures", () => {
      const results = [
        {
          filePath: "test1.md",
          result: {
            success: true,
            updatedCount: 2,
            notFoundCount: 0,
            backupPath: "test1.md.backup.123"
          } as UpdateResult
        },
        {
          filePath: "test2.json",
          result: {
            success: false,
            updatedCount: 0,
            notFoundCount: 0,
            error: "File not found"
          } as UpdateResult
        }
      ];
      
      const report = generateUpdateReport(results);
      
      expect(report).toContain("Files processed: 2");
      expect(report).toContain("Files updated successfully: 1");
      expect(report).toContain("Total items updated: 2");
      expect(report).toContain("✅ Updated 2 items");
      expect(report).toContain("❌ Error: File not found");
    });
  });

  describe("error handling", () => {
    test("handles invalid JSON structure", () => {
      const invalidJson = { "invalid": "structure" };
      const tempFile = path.join(testDir, "invalid.json");
      fs.writeFileSync(tempFile, JSON.stringify(invalidJson, null, 2));
      
      const result = updateChecklistFile(tempFile, [
        { id: "Task A", status: true }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported JSON structure");
      
      fs.unlinkSync(tempFile);
    });

    test("handles invalid YAML", () => {
      const invalidYaml = "invalid: yaml: content:";
      const tempFile = path.join(testDir, "invalid.yaml");
      fs.writeFileSync(tempFile, invalidYaml);
      
      const result = updateChecklistFile(tempFile, [
        { id: "Task A", status: true }
      ]);
      
      expect(result.success).toBe(false);
      
      fs.unlinkSync(tempFile);
    });
  });
}); 