import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  temperature: z.number(),          // °F
  humidity: z.number(),             // %
  precipitation: z.number(),        // mm
  weatherDescription: z.string(),   // e.g. "Clear sky", "Rain showers"
  season: z.string(),               // "winter" | "spring" | "summer" | "fall"
  plantCount: z.number(),
});

const AdjustmentSchema = z.object({
  category: z.enum(["watering", "humidity", "light", "temperature", "general"]),
  adjustment: z.string(),   // What to change, e.g. "Reduce watering frequency by 20%"
  reason: z.string(),       // Why, e.g. "High outdoor humidity means slower soil drying"
  urgency: z.enum(["low", "medium", "high"]),
});

const OutputSchema = z.object({
  summary: z.string(),                    // 1-2 sentence overall weather impact summary
  adjustments: z.array(AdjustmentSchema), // 2-4 specific adjustments
  tip: z.string(),                        // One seasonal tip
  indoor_humidity_advice: z.string(),     // Specific advice for indoor humidity management
});

export const weatherAdjustmentFlow = aiFast.defineFlow(
  {
    name: "weather-adjustment",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const response = await aiFast.generate({
      system:
        "You are a plant care specialist who adjusts indoor plant care recommendations based on current outdoor weather and seasons. Be specific and actionable.",
      prompt: [
        `Given the current outdoor weather conditions, provide specific indoor plant care adjustments for a collection of ${input.plantCount} plant${input.plantCount !== 1 ? "s" : ""}.`,
        ``,
        `Current weather:`,
        `- Temperature: ${input.temperature}°F`,
        `- Humidity: ${input.humidity}%`,
        `- Precipitation: ${input.precipitation}mm`,
        `- Conditions: ${input.weatherDescription}`,
        `- Season: ${input.season}`,
        ``,
        `Consider the following when generating adjustments:`,
        `- High outdoor humidity (>70%) means indoor air is likely humid — soil dries slower, reduce watering frequency.`,
        `- Hot, dry weather (low humidity, high temperature) means plants need more frequent watering and misting.`,
        `- Rain or overcast conditions affect available natural light — adjust light placement recommendations.`,
        `- Winter season means many plants enter dormancy — reduce fertilizing and watering.`,
        `- Summer heat can stress tropical plants — consider shade, increased misting, and cooling.`,
        `- Spring is ideal for repotting, propagating, and resuming regular fertilizing schedules.`,
        `- Fall signals preparation for slower growth — begin tapering watering and feeding.`,
        ``,
        `Provide:`,
        `1. A 1-2 sentence summary of how the current weather affects indoor plant care overall.`,
        `2. 2-4 specific, actionable adjustments (watering, humidity, light, temperature, or general care), each with a clear reason and urgency level.`,
        `3. One practical seasonal tip relevant to ${input.season}.`,
        `4. Specific indoor humidity management advice based on ${input.humidity}% outdoor humidity and ${input.weatherDescription} conditions.`,
        ``,
        `Return ONLY valid JSON matching the required schema.`,
      ].join("\n"),
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("weather-adjustment", weatherAdjustmentFlow);
