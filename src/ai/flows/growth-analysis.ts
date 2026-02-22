import { z } from "genkit";
import { ai } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  beforeBase64: z.string(),
  afterBase64: z.string(),
  plantName: z.string().optional(),
});

const OutputSchema = z.object({
  summary: z.string(),
  heightChangeEstimate: z.string(),
  newLeafCount: z.number(),
  healthTrend: z.enum(["improving", "stable", "declining"]),
  observations: z.array(z.string()),
});

export const growthAnalysisFlow = ai.defineFlow(
  {
    name: "growth-analysis",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const plantLabel = input.plantName
      ? `The plant is a ${input.plantName}.`
      : "The plant species is unknown.";

    const response = await ai.generate({
      prompt: [
        {
          text: `You are a plant growth expert. ${plantLabel} Compare the BEFORE photo (first image) and the AFTER photo (second image) to assess plant growth and changes.`,
        },
        {
          media: {
            url: `data:image/jpeg;base64,${input.beforeBase64}`,
            contentType: "image/jpeg",
          },
        },
        {
          media: {
            url: `data:image/jpeg;base64,${input.afterBase64}`,
            contentType: "image/jpeg",
          },
        },
        {
          text: [
            "Based on the two photos (before then after), provide:",
            "1. A short summary of overall growth.",
            "2. Estimated height change as a descriptive string (e.g. '+5–8 cm').",
            "3. Number of new leaves visible in the after photo that were not in the before photo.",
            "4. Health trend: improving, stable, or declining.",
            "5. A list of specific observations (leaf color, stem thickness, pest signs, etc.).",
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

registerFlow("growth-analysis", growthAnalysisFlow);
