"use client";

import { useState } from "react";

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  color: string;
}

interface ModelResponse {
  model: ModelInfo;
  response: string;
  responseTime: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  rawModel: string;
  error?: string;
}

const MODELS: ModelInfo[] = [
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

export default function Home() {
  const [prompt, setPrompt] = useState("What is love?");
  const [responses, setResponses] = useState<Map<string, ModelResponse | null>>(
    new Map()
  );
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const queryModel = async (modelId: string) => {
    setLoading((prev) => new Set(prev).add(modelId));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(modelId);
      return next;
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => new Map(prev).set(modelId, data.error || "Request failed"));
        setResponses((prev) => {
          const next = new Map(prev);
          next.delete(modelId);
          return next;
        });
      } else {
        setResponses((prev) => new Map(prev).set(modelId, data));
      }
    } catch (error) {
      setErrors((prev) =>
        new Map(prev).set(modelId, error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
    }
  };

  const queryAllModels = async () => {
    await Promise.all(MODELS.map((model) => queryModel(model.id)));
  };

  const clearAll = () => {
    setResponses(new Map());
    setErrors(new Map());
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            OpenRouter LLM Tester
          </h1>
          <p className="text-slate-400 text-lg">
            Compare responses from multiple AI models side by side
          </p>
        </div>

        {/* Prompt Input */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700/50">
          <label className="block text-slate-300 text-sm font-medium mb-3">
            Your Question
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900/80 text-slate-100 rounded-xl p-4 border border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none font-mono"
            rows={3}
            placeholder="Enter your question here..."
          />
          <div className="flex gap-4 mt-4">
            <button
              onClick={queryAllModels}
              disabled={loading.size > 0 || !prompt.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 disabled:shadow-none"
            >
              {loading.size > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Querying {loading.size} model(s)...
                </span>
              ) : (
                "Query All Models"
              )}
            </button>
            <button
              onClick={clearAll}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MODELS.map((model) => {
            const response = responses.get(model.id);
            const error = errors.get(model.id);
            const isLoading = loading.has(model.id);

            return (
              <div
                key={model.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col"
              >
                {/* Card Header */}
                <div
                  className="p-4 border-b border-slate-700/50"
                  style={{
                    background: `linear-gradient(135deg, ${model.color}15, transparent)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {model.name}
                        </h3>
                        <p className="text-sm text-slate-400">{model.provider}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => queryModel(model.id)}
                      disabled={isLoading || !prompt.trim()}
                      className="text-sm bg-slate-700/80 hover:bg-slate-600 disabled:bg-slate-700/50 text-slate-300 disabled:text-slate-500 px-4 py-2 rounded-lg transition-all"
                    >
                      {isLoading ? "Loading..." : "Query"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-mono">
                    {model.id}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 min-h-[200px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div
                          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                          style={{ borderColor: `${model.color}40`, borderTopColor: model.color }}
                        />
                        <p className="text-slate-400 text-sm">
                          Waiting for response...
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium mb-1">
                        Error
                      </p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  ) : response ? (
                    <div className="space-y-4">
                      {/* Response Stats */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                          ⏱️ {response.responseTime}ms
                        </span>
                        {response.usage && (
                          <>
                            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                              📥 {response.usage.prompt_tokens} tokens in
                            </span>
                            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                              📤 {response.usage.completion_tokens} tokens out
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actual Model Used */}
                      {response.rawModel !== model.id && (
                        <p className="text-xs text-slate-500">
                          Actual model: <code className="text-slate-400">{response.rawModel}</code>
                        </p>
                      )}

                      {/* Response Content */}
                      <div className="bg-slate-900/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {response.response}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500 text-sm">
                        Click &quot;Query&quot; to get a response
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>
            Powered by{" "}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              OpenRouter
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

