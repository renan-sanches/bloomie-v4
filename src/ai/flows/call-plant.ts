import { z } from "genkit";
import { aiFast } from "../genkit";
import { registerFlow } from "../registry";

const InputSchema = z.object({
  plantName: z.string(),
  species: z.string().optional(),
  healthScore: z.number(),
  lastCaredDate: z.string().optional(),
});

const OutputSchema = z.object({
  greeting: z.string(),
  personality: z.string(),
  responses: z.object({
    howAreYou: z.string(),
    doYouNeedAnything: z.string(),
    iLoveYou: z.string(),
  }),
  mood: z.enum(["happy", "thirsty", "sad", "dramatic", "content"]),
});

const callPlantFlow = aiFast.defineFlow(
  {
    name: "call-plant",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const healthContext =
      input.healthScore < 60
        ? "The plant is struggling and feeling weak or sad."
        : input.healthScore > 80
        ? "The plant is thriving and feeling happy."
        : "The plant is doing okay but could use some attention.";

    const lastCaredContext = input.lastCaredDate
      ? `The plant was last cared for on ${input.lastCaredDate}.`
      : "It's been a while since the plant was last cared for.";

    const response = await aiFast.generate({
      system:
        "You are a creative writer giving plants fun, distinct personalities. Each plant has a unique voice based on its species and health. Monstera = dramatic diva, Snake Plant = stoic philosopher, Pothos = bubbly optimist, Fiddle Leaf Fig = anxious perfectionist, Cactus = grumpy loner, Orchid = elegant socialite. Keep each response 1-2 sentences, fully in character.",
      prompt: [
        `Generate a fun phone call conversation for ${input.plantName} (${input.species || "unknown species"}).`,
        healthContext,
        lastCaredContext,
        "Provide: a greeting (the plant's opening line), its personality type, responses to 'How are you?', 'Do you need anything?', and 'I love you!', and its current mood.",
        "Make it charming, funny, and true to the plant's species personality.",
      ].join(" "),
      output: {
        schema: OutputSchema,
      },
    });

    return response.output as z.infer<typeof OutputSchema>;
  }
);

registerFlow("call-plant", callPlantFlow);

export { callPlantFlow };
