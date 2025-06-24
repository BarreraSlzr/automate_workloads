import { z } from "zod";
import { getPreferenceValues } from "@raycast/api";

export const envSchema = z.object({
  githubToken: z.string().min(1),
  gmailToken: z.string().min(1),
  bufferToken: z.string().min(1),
  twitterToken: z.string().min(1),
});

export function getEnv() {
  const prefs = getPreferenceValues();
  return envSchema.parse(prefs);
}
