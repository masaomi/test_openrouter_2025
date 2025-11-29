import { NextRequest, NextResponse } from "next/server";

// Available models to test
export const MODELS = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    color: "#D97706",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    color: "#7C3AED",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "Google",
    color: "#2563EB",
  },
  {
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "OpenAI",
    color: "#10B981",
  },
];

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { modelId, prompt } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not set in environment variables" },
        { status: 500 }
      );
    }

    const model = MODELS.find((m) => m.id === modelId);
    if (!model) {
      return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
    }

    const startTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "OpenRouter LLM Tester",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.error?.message || "API request failed",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data: OpenRouterResponse = await response.json();

    return NextResponse.json({
      model: model,
      response: data.choices[0]?.message?.content || "No response",
      responseTime,
      usage: data.usage,
      rawModel: data.model,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ models: MODELS });
}

