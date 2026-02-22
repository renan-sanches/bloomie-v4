import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const DiagnoseInput = z.object({
  photoBase64: z.string().describe("Base64-encoded image of the plant"),
  plantName: z.string().optional().describe("Optional common or scientific name of the plant"),
});

const DiagnoseOutput = z.object({
  healthScore: z.number().describe("Overall health score from 0 (dying) to 100 (thriving)"),
  issues: z.array(
    z.object({
      name: z.string(),
      severity: z.enum(["mild", "moderate", "severe"]),
      description: z.string(),
    })
  ),
  treatmentPlan: z.array(z.string()).describe("Ordered list of treatment steps"),
  followUpDays: z.number().int().describe("Days until follow-up check is recommended"),
  warningSigns: z.array(z.string()).describe("Signs to watch for that indicate worsening condition"),
});

const diagnosePlantFlow = aiFast.defineFlow(
  {
    name: "diagnose-plant",
    inputSchema: DiagnoseInput,
    outputSchema: DiagnoseOutput,
  },
  async (input) => {
    const plantContext = input.plantName
      ? `The plant is identified as: ${input.plantName}.`
      : "The plant species is unknown.";

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
            "You are a plant health diagnostician. Analyze the health of the plant in this image.",
            plantContext,
            "Respond with a JSON object that includes:",
            "- healthScore: integer from 0 (dying) to 100 (thriving)",
            "- issues: array of detected problems, each with name, severity ('mild'|'moderate'|'severe'), and description",
            "- treatmentPlan: ordered array of concrete treatment steps to address the issues",
            "- followUpDays: integer number of days until the next health check is recommended",
            "- warningSigns: array of symptoms to watch for that would indicate the plant is getting worse",
            "If the plant appears healthy, return an empty issues array, a high healthScore, and general maintenance advice in the treatmentPlan.",
          ].join("\n"),
        },
      ],
      output: {
        schema: DiagnoseOutput,
      },
    });

    return response.output as z.infer<typeof DiagnoseOutput>;
  }
);

registerFlow("diagnose-plant", diagnosePlantFlow);

export { diagnosePlantFlow };
