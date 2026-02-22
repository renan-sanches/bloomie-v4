import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  photoBase64: z.string(),
});

const OutputSchema = z.object({
  lightQuality: z.enum([
    "very-low",
    "low",
    "medium",
    "bright-indirect",
    "bright-direct",
  ]),
  estimatedLux: z.number(),
  potSizeEstimate: z.enum(["small", "medium", "large", "unknown"]),
  plantHeightEstimate: z.string(),
  placementTips: z.array(z.string()),
});

export const measureEnvironmentFlow = aiFast.defineFlow(
  {
    name: "measure-environment",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
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
            "Analyze this room or plant photo and estimate the following:",
            "1. Light quality: categorize as one of: very-low, low, medium, bright-indirect, bright-direct.",
            "2. Estimated lux level as a number.",
            "3. Pot size: small, medium, large, or unknown if no pot is visible.",
            "4. Plant height estimate as a descriptive string (e.g. '30–40 cm').",
            "5. Two or three actionable placement tips to improve plant health.",
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

registerFlow("measure-environment", measureEnvironmentFlow);
