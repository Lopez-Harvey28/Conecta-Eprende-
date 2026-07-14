export type GeminiErrorKind = "rate_limit" | "unavailable" | "aborted" | "other";

export interface ClassifiedError {
  kind: GeminiErrorKind;
  status?: number;
  retryAfterMs?: number;
  message: string;
}

function readRetryAfter(headers?: Headers): number | undefined {
  if (!headers) return undefined;
  const ms = headers.get("retry-after-ms");
  if (ms) {
    const n = parseFloat(ms);
    if (!Number.isNaN(n)) return n;
  }
  const s = headers.get("retry-after");
  if (s) {
    const n = parseFloat(s);
    if (!Number.isNaN(n)) return n * 1000;
    const d = Date.parse(s) - Date.now();
    if (!Number.isNaN(d)) return Math.max(0, d);
  }
  return undefined;
}

export function classifyGeminiError(error: unknown): ClassifiedError {
  const e = error as Error & { status?: unknown; headers?: Headers | undefined };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const message = e?.message ?? "Error desconocido";

  if (e?.name === "AbortError" || message.toLowerCase().includes("abort")) {
    return { kind: "aborted", message };
  }

  const retryAfterMs = readRetryAfter(e?.headers);

  if (status === 429) {
    return { kind: "rate_limit", status, retryAfterMs, message };
  }
  if (status !== undefined && status >= 500 && status < 600) {
    return { kind: "unavailable", status, retryAfterMs, message };
  }
  return { kind: "other", status, message };
}