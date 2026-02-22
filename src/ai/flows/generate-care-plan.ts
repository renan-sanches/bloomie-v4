import { z } from "genkit";
import { ai } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  plantName: z.string(),
  issue: z.string(),
  severity: z.enum(["mild", "moderate", "severe"]),
});

const StepSchema = z.object({
  day: z.number(),
  action: z.string(),
  materials: z.string().optional(),
});

const CheckpointSchema = z.object({
  day: z.number(),
  prompt: z.string(),
  photoRequired: z.boolean(),
});

const OutputSchema = z.object({
  title: z.string(),
  estimatedDays: z.number(),
  steps: z.array(StepSchema),
  checkpoints: z.array(CheckpointSchema),
  expectedSigns: z.array(z.string()),
  warningSigns: z.array(z.string()),
  materials: z.array(z.string()),
});

export const generateCarePlanFlow = ai.defineFlow(
  {
    name: "generate-care-plan",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      system: [
        "You are Bloomie, a caring and knowledgeable plant health advisor.",
        "Create clear, actionable, day-by-day recovery plans for sick or struggling plants.",
        "Be specific about materials, timings, and what to look for.",
      ].join(" "),
      prompt: [
        `Create a structured recovery care plan for a ${input.plantName} with the following issue: "${input.issue}".`,
        `Severity level: ${input.severity}.`,
        "Include:",
        "- A short descriptive title for the plan.",
        "- Estimated total days for recovery.",
        "- Day-by-day action steps (each with day number, action description, and optional materials needed).",
        "- Checkpoints to assess progress (with day, a question/prompt for the user, and whether a photo is required).",
        "- Signs of expected improvement.",
        "- Warning signs that indicate the problem is worsening.",
        "- Full list of all materials needed for the entire plan.",
        "Return ONLY valid JSON matching the required schema.",
      ].join(" "),
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("generate-care-plan", generateCarePlanFlow);
