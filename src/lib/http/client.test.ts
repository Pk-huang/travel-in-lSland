import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson, UpstreamError } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchJson response handling", () => {
  it("returns parsed JSON for a successful 200 response", async () => {
    const payload = { status: "ok", value: 42 };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("https://example.test/data", { retries: 0 }))
      .resolves.toEqual(payload);
  });

  it("converts a timeout into UpstreamError", async () => {
    const timeoutError = new Error("The operation was aborted");
    timeoutError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    await expect(fetchJson("https://example.test/data", { retries: 0 }))
      .rejects.toMatchObject({
        name: "UpstreamError",
        message: "Upstream timed out after 3000ms",
      });
  });

  it.each([403, 500])(
    "preserves HTTP status %s in UpstreamError",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status,
          json: vi.fn(),
        }),
      );

      await expect(
        fetchJson("https://example.test/data", { retries: 0 }),
      ).rejects.toMatchObject({
        name: "UpstreamError",
        status,
        message: `Upstream responded ${status}`,
      });
    },
  );

  it("converts an empty response body parse failure into UpstreamError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected end")),
      }),
    );

    await expect(fetchJson("https://example.test/data", { retries: 0 }))
      .rejects.toBeInstanceOf(UpstreamError);
  });
});