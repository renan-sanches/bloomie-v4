import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const PlantSummarySchema = z.object({
  name: z.string(),
  healthScore: z.number(),
  status: z.string(),
});

const InputSchema = z.object({
  userName: z.string().optional(),
  plants: z.array(PlantSummarySchema),
  totalQuestsCompleted: z.number().optional(),
  streak: z.number().optional(),
  level: z.number().optional(),
});

const OutputSchema = z.object({
  headline: z.string(),
  highlights: z.array(z.string()),
  concerns: z.array(z.string()),
  topTip: z.string(),
  encouragement: z.string(),
  plantOfTheWeek: z.string().optional(),
});

export const weeklyReportFlow = aiFast.defineFlow(
  {
    name: "weekly-report",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const name = input.userName ?? "Plant Parent";
    const thriving = input.plants.filter((p) => p.healthScore >= 80);
    const needsAttention = input.plants.filter((p) => p.healthScore < 60);
    const totalPlants = input.plants.length;

    const plantList = input.plants
      .map((p) => `- ${p.name}: health ${p.healthScore}/100, status: ${p.status}`)
      .join("\n");

    const response = await aiFast.generate({
      system: [
        "You are Bloomie, a warm and encouraging plant care companion generating personalized weekly summaries for plant parents.",
        "Be specific, positive, and actionable.",
        "Use the plant data to make the summary feel personal and relevant.",
        "Keep the tone friendly, supportive, and motivating — like a knowledgeable friend who loves plants.",
      ].join(" "),
      prompt: [
        `Generate a personalized weekly plant care report for ${name}.`,
        "",
        `They have ${totalPlants} plant${totalPlants !== 1 ? "s" : ""} in their collection:`,
        plantList,
        "",
        thriving.length > 0
          ? `Plants doing great (health >= 80): ${thriving.map((p) => p.name).join(", ")}`
          : "",
        needsAttention.length > 0
          ? `Plants needing attention (health < 60): ${needsAttention.map((p) => p.name).join(", ")}`
          : "",
        input.streak !== undefined ? `Current care streak: ${input.streak} days` : "",
        input.level !== undefined ? `User level: ${input.level}` : "",
        input.totalQuestsCompleted !== undefined
          ? `Quests completed this week: ${input.totalQuestsCompleted}`
          : "",
        "",
        "Provide:",
        "1. A catchy, warm headline for the week (1 sentence, can include an emoji).",
        "2. 2-3 positive highlights — specific things going well with their plants.",
        "3. 0-2 concerns — only if there are plants with health < 60, keep these constructive and actionable.",
        "4. One top actionable tip for the coming week, tailored to their specific plant collection.",
        "5. A warm, personalized closing encouragement message addressed to them by name.",
        "6. Optionally, a 'Plant of the Week' — either the plant that is doing best (highest health score) or the one that needs the most love (lowest health score) — just provide the plant's name.",
        "Return ONLY valid JSON matching the required schema.",
      ]
        .filter(Boolean)
        .join("\n"),
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("weekly-report", weeklyReportFlow);
