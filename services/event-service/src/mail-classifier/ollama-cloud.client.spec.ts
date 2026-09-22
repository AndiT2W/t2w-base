import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaCloudClient } from "./ollama-cloud.client.js";

describe("OllamaCloudClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OLLAMA_API_KEY;
    delete process.env.OLLAMA_API_URL;
    delete process.env.OLLAMA_CLOUD_MODEL;
  });

  it("calls the Ollama cloud chat endpoint without exposing the key in the body", async () => {
    process.env.OLLAMA_API_KEY = "secret-test-key";
    process.env.OLLAMA_CLOUD_MODEL = "test-model";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: { content: '{"category":"OTHER"}' } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(new OllamaCloudClient().chat("classify this mail")).resolves.toBe(
      '{"category":"OTHER"}',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ollama.com/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer secret-test-key" }),
        body: JSON.stringify({
          model: "test-model",
          messages: [{ role: "user", content: "classify this mail" }],
          stream: false,
          options: { temperature: 0 },
        }),
      }),
    );
  });

  it("fails closed when no API key is configured", async () => {
    await expect(new OllamaCloudClient().chat("classify this mail")).rejects.toThrow(
      "OLLAMA_API_KEY_MISSING",
    );
  });
});
