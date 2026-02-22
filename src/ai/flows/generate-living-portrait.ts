import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  plantName: z.string(),
  species: z.string().optional(),
});

const OutputSchema = z.object({
  scene: z.string(),
  animationStyle: z.enum(["sway", "breathe", "shimmer"]),
  mood: z.string(),
});

const generateLivingPortraitFlow = aiFast.defineFlow(
  {
    name: "generate-living-portrait",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const response = await aiFast.generate({
      system:
        "You are a cinematic plant portrait artist. Describe a beautiful, brief living portrait scene for a plant. Keep descriptions poetic, vivid, and under 3 sentences. Choose an animation style that best matches the plant's character.",
      prompt: `Create a living portrait description for ${input.plantName} (${input.species || "unknown species"}). Choose the best animation style: 'sway' for plants that move in breeze, 'breathe' for slow-growing steady plants, 'shimmer' for glossy-leaved or tropical plants. Also describe the mood in one word.`,
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("generate-living-portrait", generateLivingPortraitFlow);

export { generateLivingPortraitFlow };
