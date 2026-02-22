import { z } from "genkit";
import { ai } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  roomPhotoBase64: z.string(),
  plantNames: z.array(z.string()),
});

const SuggestionSchema = z.object({
  spot: z.string(),
  reasoning: z.string(),
  suitablePlants: z.array(z.string()),
});

const OutputSchema = z.object({
  lightAssessment: z.string(),
  suggestions: z.array(SuggestionSchema),
  generalAdvice: z.string(),
});

export const placementHelperFlow = ai.defineFlow(
  {
    name: "placement-helper",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const plantList =
      input.plantNames.length > 0
        ? `The plants to place are: ${input.plantNames.join(", ")}.`
        : "No specific plants were specified; suggest for common houseplants.";

    const response = await ai.generate({
      prompt: [
        {
          media: {
            url: `data:image/jpeg;base64,${input.roomPhotoBase64}`,
            contentType: "image/jpeg",
          },
        },
        {
          text: [
            `You are an expert in interior plant placement. ${plantList}`,
            "Analyze this room photo and provide:",
            "1. A brief overall light assessment for the room.",
            "2. Exactly 2–3 specific placement spots (e.g. 'windowsill', 'corner shelf', 'coffee table'), each with reasoning and which of the listed plants would thrive there.",
            "3. General advice for maintaining healthy plants in this space.",
            "Return ONLY valid JSON matching the required schema.",
          ].join(" "),
        },
      ],
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("placement-helper", placementHelperFlow);
