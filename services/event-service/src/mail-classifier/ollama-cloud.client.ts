import { Injectable } from "@nestjs/common";
import type { OllamaChatClient } from "./mail-classifier.service.js";

export class OllamaCloudError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OllamaCloudError";
  }
}

@Injectable()
export class OllamaCloudClient implements OllamaChatClient {
  async chat(prompt: string) {
    const apiUrl = process.env.OLLAMA_API_URL ?? "https://ollama.com/api/chat";
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new OllamaCloudError("OLLAMA_API_KEY_MISSING");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_CLOUD_MODEL ?? "gemma4:31b",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { temperature: 0 },
      }),
    });
    if (!response.ok)
      throw new OllamaCloudError(`OLLAMA_CLOUD_${response.status}`, response.status);
    const body = (await response.json()) as { message?: { content?: unknown } };
    if (typeof body.message?.content !== "string")
      throw new OllamaCloudError("OLLAMA_RESPONSE_CONTENT_MISSING");
    return body.message.content;
  }
}
