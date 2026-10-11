export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl: string;
  textModel: string;
  visionModel: string;
}

export function getOpenRouterConfig(): OpenRouterConfig {
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    textModel: process.env.OPENROUTER_TEXT_MODEL || "google/gemini-2.5-flash",
    visionModel: process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash",
  };
}

export async function testOpenRouterConnection(): Promise<{ ok: boolean; model: string; error?: string }> {
  const config = getOpenRouterConfig();
  if (!config.apiKey) {
    return { ok: false, model: config.textModel, error: "OPENROUTER_API_KEY is not configured in server environment." };
  }

  try {
    const res = await fetch(`${config.baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://crewvault.local",
        "X-Title": "CrewVault Aviation Learning Platform",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, model: config.textModel, error: `OpenRouter returned status ${res.status}: ${err}` };
    }

    return { ok: true, model: config.textModel };
  } catch (err: any) {
    return { ok: false, model: config.textModel, error: err.message };
  }
}

/**
 * Executes chat completion on OpenRouter with automatic failover
 */
export async function callOpenRouter(
  prompt: string,
  modelOverride?: string,
  isJson: boolean = true,
  maxTokens: number = 3000
): Promise<string> {
  const config = getOpenRouterConfig();
  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const primaryModel = modelOverride || config.textModel;
  const fallbackModels = [
    primaryModel,
    "google/gemini-2.5-flash-lite",
    "x-ai/grok-4.5",
  ].filter((m, idx, self) => self.indexOf(m) === idx);

  let lastError = "";

  for (const model of fallbackModels) {
    try {
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://crewvault.local",
          "X-Title": "CrewVault Aviation Learning Platform",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          ...(isJson ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`OpenRouter (${model}) failed with ${res.status}: ${errorText}`);
        lastError = `OpenRouter (${model}): ${errorText}`;
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content) {
        return content;
      }
    } catch (err: any) {
      console.warn(`OpenRouter (${model}) exception:`, err);
      lastError = err.message;
    }
  }

  throw new Error(`OpenRouter all model attempts failed. Last error: ${lastError}`);
}

/**
 * Performs multimodal vision OCR using OpenRouter (Gemini / Grok Vision)
 */
export async function performVisionOcr(imageBuffer: Buffer, mimeType: string = "image/jpeg"): Promise<string> {
  const config = getOpenRouterConfig();
  if (!config.apiKey) {
    return "";
  }

  const base64Data = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const visionModels = [
    config.visionModel,
    "google/gemini-2.5-flash-lite",
    "google/gemini-2.5-pro",
  ].filter((m, idx, self) => self.indexOf(m) === idx);

  for (const model of visionModels) {
    try {
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://crewvault.local",
          "X-Title": "CrewVault Aviation Learning Platform",
        },
        body: JSON.stringify({
          model,
          max_tokens: 3500,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You are an expert aviation document reader. Perform high-accuracy optical character recognition (OCR) on this aviation training or exam image. Transcribe ALL readable text, headings, questions, answer options (A, B, C, D), and procedures into clean, structured Markdown. Format multiple-choice questions clearly with question numbers, options, and answer keys if present. Do not summarize or skip content.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Vision OCR with ${model} failed (${res.status}): ${errorText}`);
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content.trim()) {
        return content;
      }
    } catch (err) {
      console.warn(`Vision OCR exception on ${model}:`, err);
    }
  }

  return "";
}
