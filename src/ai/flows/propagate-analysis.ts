import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  photoBase64: z.string(),
});

const OutputSchema = z.object({
  rootReadiness: z.enum(["not-ready", "almost-ready", "ready"]),
  rootLengthEstimate: z.string(),
  waterClarity: z.enum(["clear", "slightly-cloudy", "cloudy"]),
  advice: z.string(),
  daysUntilReady: z.number(),
});

export const propagateAnalysisFlow = aiFast.defineFlow(
  {
    name: "propagate-analysis",
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
            "Analyze this water propagation photo and assess root development and water clarity.",
            "Determine:",
            "1. Root readiness: not-ready (no visible roots), almost-ready (small roots forming), or ready (roots 2+ cm, ready to pot).",
            "2. Root length estimate as a descriptive string (e.g. '0.5–1 cm').",
            "3. Water clarity: clear, slightly-cloudy, or cloudy.",
            "4. Specific advice for the propagator on next steps.",
            "5. Estimated days until the cutting will be ready to pot (use 0 if already ready).",
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

registerFlow("propagate-analysis", propagateAnalysisFlow);
