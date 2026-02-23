interface CallAiFlowOptions {
  timeoutMs?: number;
}

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

const DEFAULT_TIMEOUT_MS = 45000;

function toFriendlyErrorMessage(payload: ApiErrorPayload, status: number): string {
  if (status === 404) {
    return "This AI feature is unavailable right now.";
  }

  if (payload.code === "AI_CONFIG_MISSING") {
    return "AI is not configured yet. Please set GOOGLE_AI_API_KEY in your environment.";
  }

  if (payload.error && payload.error.trim()) {
    return payload.error;
  }

  return "AI request failed. Please try again.";
}

export async function callAiFlow<TOutput>(
  flowName: string,
  body: object,
  options?: CallAiFlowOptions
): Promise<TOutput> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`/api/ai/${flowName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await res
      .json()
      .catch(() => ({}))) as ApiErrorPayload | TOutput;

    if (!res.ok) {
      const apiError = payload as ApiErrorPayload;
      throw new Error(toFriendlyErrorMessage(apiError, res.status));
    }

    return payload as TOutput;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI request timed out. Try again with a clearer photo.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
