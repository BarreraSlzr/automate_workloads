import { test, expect } from "bun:test";
import { LLMPlanningService } from "../../../src/cli/llm-plan";
import { mockCallOpenAIChat } from "../../test-mocks";

test("decomposeGoal returns structured breakdown", async () => {
  const service = new LLMPlanningService("fake-model", "fake-key");
  const result = await service.decomposeGoal("Test goal");
  expect(result).toHaveProperty("tasks");
  expect(Array.isArray(result.tasks)).toBe(true);
}); 