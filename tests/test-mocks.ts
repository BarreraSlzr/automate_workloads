export async function mockCallOpenAIChat() {
  return {
    choices: [{ message: { content: "Mocked LLM response" } }]
  };
} 