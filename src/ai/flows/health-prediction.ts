import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  plantName: z.string(),
  species: z.string().optional(),
  healthScore: z.number(),
  daysSinceWatered: z.number().optional(),
  status: z.enum(["healthy", "attention", "sick", "propagating", "archived"]),
  wateringFrequencyDays: z.number(),
  sunlight: z.enum(["low", "indirect", "bright", "direct"]),
  humidity: z.enum(["low", "medium", "high"]),
  recentCareTypes: z.array(z.string()).optional(),
});

const RiskSchema = z.object({
  risk: z.string(),
  probability: z.enum(["low", "medium", "high"]),
  timeframe: z.string(),
  prevention: z.string(),
});

const OutputSchema = z.object({
  overallOutlook: z.enum(["thriving", "stable", "monitor", "at_risk"]),
  risks: z.array(RiskSchema),
  repottingRisk: z.object({
    needed: z.boolean(),
    timeline: z.string(),
  }),
  pestRisk: z.object({
    level: z.enum(["low", "medium", "high"]),
    mostLikelyPest: z.string().optional(),
    preventionTip: z.string(),
  }),
  nextMilestone: z.string(),
  summary: z.string(),
});

export const healthPredictionFlow = aiFast.defineFlow(
  {
    name: "health-prediction",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const response = await aiFast.generate({
      system: [
        "You are a plant health specialist and predictive care advisor.",
        "Analyze plant profiles to identify upcoming care needs and potential issues before they become problems.",
        "Use your species knowledge and the provided health data to give accurate, actionable predictions.",
      ].join(" "),
      prompt: [
        `Analyze the following plant profile and predict upcoming health risks and care needs:`,
        `Plant name: ${input.plantName}`,
        input.species ? `Species: ${input.species}` : "",
        `Current health score: ${input.healthScore}/100`,
        `Current status: ${input.status}`,
        `Watering frequency: every ${input.wateringFrequencyDays} days`,
        input.daysSinceWatered !== undefined
          ? `Days since last watered: ${input.daysSinceWatered}`
          : "",
        `Sunlight level: ${input.sunlight}`,
        `Humidity level: ${input.humidity}`,
        input.recentCareTypes && input.recentCareTypes.length > 0
          ? `Recent care actions: ${input.recentCareTypes.join(", ")}`
          : "No recent care actions recorded.",
        "",
        "Based on this data, provide:",
        "1. An overall outlook (thriving, stable, monitor, or at_risk).",
        "2. 2-4 predicted risks including overwatering/underwatering risk, light stress, nutrient deficiency, and any species-specific issues. For each risk include: the risk name, probability (low/medium/high), timeframe (e.g. 'Next 2 weeks'), and a one-sentence prevention tip.",
        "3. Repotting risk: whether repotting is needed soon and a timeline (e.g. 'Within 3 months' or 'Not needed soon').",
        "4. Pest risk: overall pest risk level (low/medium/high), the most likely pest for this species/conditions if applicable, and a one-sentence prevention tip.",
        "5. Next milestone: a short description of the next positive care milestone (e.g. 'Ready for fertilizing in 2 weeks').",
        "6. A 2-3 sentence summary assessment of the plant's current trajectory.",
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

registerFlow("health-prediction", healthPredictionFlow);
