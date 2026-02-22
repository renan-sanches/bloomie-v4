// Local flow registry used by the API gateway route.
//
// Genkit v1 stores flows as Action[] on each Genkit instance (ai.flows /
// aiFast.flows). Because there are two separate instances and the route needs
// a single name-keyed lookup, each flow module calls registerFlow() after
// defining its flow so the gateway can find it by the URL segment name.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAction = (input: any) => Promise<unknown>;

const registry = new Map<string, AnyAction>();

export function registerFlow(name: string, flow: AnyAction): void {
  registry.set(name, flow);
}

export function getFlow(name: string): AnyAction | undefined {
  return registry.get(name);
}
