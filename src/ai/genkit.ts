import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

const googleApiKey = process.env.GOOGLE_AI_API_KEY;
const plugins = googleApiKey ? [googleAI({ apiKey: googleApiKey })] : [];

const qualityModel =
  process.env.GOOGLE_AI_MODEL ?? "googleai/gemini-2.5-pro";
const fastModel =
  process.env.GOOGLE_AI_FAST_MODEL ?? "googleai/gemini-2.5-flash";

// Quality model - for care plans, growth analysis, placement helper.
export const ai = genkit({
  plugins,
  model: qualityModel,
});

// Fast model - for identify, diagnose, chat, measure (latency-sensitive).
export const aiFast = genkit({
  plugins,
  model: fastModel,
});
