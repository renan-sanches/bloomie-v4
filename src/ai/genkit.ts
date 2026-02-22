import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Quality model — for care plans, growth analysis, placement helper
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY })],
  model: "googleai/gemini-3-pro-preview",
});

// Fast model — for identify, diagnose, chat, measure (latency-sensitive)
export const aiFast = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY })],
  model: "googleai/gemini-3-flash-preview",
});
