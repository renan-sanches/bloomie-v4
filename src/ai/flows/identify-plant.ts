import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const IdentifyInput = z.object({
  photoBase64: z.string().describe("Base64-encoded image of the plant"),
});

const IdentifyOutput = z.object({
  commonName: z.string(),
  scientificName: z.string(),
  confidence: z.number(),
  description: z.string().describe("Two-sentence description of the plant"),
  careDifficulty: z.enum(["easy", "moderate", "hard"]),
  suggestedCareProfile: z.object({
    wateringFrequencyDays: z.number().int(),
    sunlight: z.enum(["low", "indirect", "bright", "direct"]),
    humidity: z.enum(["low", "medium", "high"]),
    tempMin: z.number(),
    tempMax: z.number(),
  }),
});

const identifyPlantFlow = aiFast.defineFlow(
  {
    name: "identify-plant",
    inputSchema: IdentifyInput,
    outputSchema: IdentifyOutput,
  },
  async (input) => {
    const response = await aiFast.generate({
      prompt: [
        {
          media: {
            url: `data:image/jpeg;base64,${input.photoBase64}`,
            contentType: "image/jpeg",
          },
        },
        {
          text: [
            "You are a botanist expert. Identify the plant species in this image.",
            "Respond with a JSON object that includes:",
            "- commonName: the common English name of the plant",
            "- scientificName: the full binomial scientific name",
            "- confidence: your identification confidence between 0 and 1",
            "- description: exactly two sentences describing the plant",
            "- careDifficulty: one of 'easy', 'moderate', or 'hard'",
            "- suggestedCareProfile: an object with wateringFrequencyDays (integer), sunlight ('low'|'indirect'|'bright'|'direct'), humidity ('low'|'medium'|'high'), tempMin (°C), tempMax (°C)",
          ].join("\n"),
        },
      ],
      output: {
        schema: IdentifyOutput,
      },
    });

    return response.output as z.infer<typeof IdentifyOutput>;
  }
);

registerFlow("identify-plant", identifyPlantFlow);

export { identifyPlantFlow };
