import { z } from "genkit";
import { Part } from "@genkit-ai/ai";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const HistoryItemSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string(),
});

const InputSchema = z.object({
  message: z.string(),
  history: z.array(HistoryItemSchema).optional(),
  plantContext: z.string().optional(),
  photoBase64: z.string().optional(),
});

const OutputSchema = z.object({
  reply: z.string(),
});

export const bloomieChatFlow = aiFast.defineFlow(
  {
    name: "bloomie-chat",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    // Build conversation history in Genkit message format
    const messages =
      input.history && input.history.length > 0
        ? input.history.map((item) => ({
            role: item.role as "user" | "model",
            content: [{ text: item.text }] as Part[],
          }))
        : [];

    // Build the current user prompt parts
    const promptParts: Part[] = [];

    if (input.photoBase64) {
      promptParts.push({
        media: {
          url: `data:image/jpeg;base64,${input.photoBase64}`,
          contentType: "image/jpeg",
        },
      });
    }

    promptParts.push({ text: input.message });

    // Build system prompt
    const systemParts = [
      "You are Bloomie Buddy, a warm, encouraging, and knowledgeable plant care companion.",
      "You help plant parents keep their plants healthy and thriving.",
      "You give practical, clear advice with a friendly tone — like a knowledgeable friend who loves plants.",
      "Keep responses concise (2–4 sentences for simple questions, more detail for complex issues).",
      "If you see a photo, describe what you observe before giving advice.",
    ];

    if (input.plantContext) {
      systemParts.push(`Plant context: ${input.plantContext}`);
    }

    const response = await aiFast.generate({
      system: systemParts.join(" "),
      messages,
      prompt: promptParts,
    });

    return { reply: response.text };
  }
);

registerFlow("bloomie-chat", bloomieChatFlow);
