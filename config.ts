import { z } from "zod";

export const envSchema = z.object({
  githubToken: z.string().min(1),
  gmailToken: z.string().min(1),
  bufferToken: z.string().min(1),
  twitterToken: z.string().min(1),
});

export function getEnv() {
  let raw: any = {};
  try {
    // Try Raycast environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getPreferenceValues } = require("@raycast/api");
    raw = getPreferenceValues();
  } catch (e) {
    // Fallback to process.env for CLI
    raw = {
      githubToken: process.env.GITHUB_TOKEN,
      gmailToken: process.env.GMAIL_TOKEN,
      bufferToken: process.env.BUFFER_TOKEN,
      twitterToken: process.env.TWITTER_BEARER_TOKEN,
    };
  }
  return envSchema.parse(raw);
}
