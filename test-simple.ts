import { test, expect } from "bun:test";

test("simple test", () => {
  expect(1 + 1).toBe(2);
});

test("LLMPlanningService instantiation", async () => {
  console.log("Starting LLMPlanningService test...");
  
  // Import the service
  const { LLMPlanningService } = await import("./src/cli/llm-plan");
  
  console.log("Creating service instance...");
  const service = new LLMPlanningService("fake-model", "fake-key", { testMode: true });
  
  console.log("Service created successfully!");
  expect(service).toBeDefined();
});

test("LLMPlanningService decomposeGoal", async () => {
  console.log("Starting decomposeGoal test...");
  
  const { LLMPlanningService } = await import("./src/cli/llm-plan");
  const service = new LLMPlanningService("fake-model", "fake-key", { testMode: true });
  
  console.log("Calling decomposeGoal...");
  const result = await service.decomposeGoal("Test goal", undefined, false, "test");
  
  console.log("decomposeGoal completed!");
  expect(result).toHaveProperty("tasks");
}); 