import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "./db";

// The "why is this trending?" feature can run against two providers, selected by
// EXPLAIN_PROVIDER ("anthropic" | "openrouter", default "anthropic"). The feature is
// fully optional: with the selected provider's API key absent, the app runs normally
// and simply shows no explanations.
type ProviderId = "anthropic" | "openrouter";

function providerId(): ProviderId {
  return process.env.EXPLAIN_PROVIDER === "openrouter" ? "openrouter" : "anthropic";
}

// The user-facing prompt, shared across providers. When `webGrounded` we instruct the
// model to search; otherwise it answers from its own knowledge.
function buildSystemPrompt(webGrounded: boolean): string {
  return (
    "You explain why a topic is trending on X (Twitter) in the United States. " +
    (webGrounded
      ? "Search the web for the most recent reason this topic is trending right now, then "
      : "Using your knowledge, give the most plausible reason this topic is trending, then ") +
    "reply with ONE concise sentence (max 25 words) stating that reason. " +
    "If nothing specific is found, give the most plausible general reason. " +
    "Do not add preamble, caveats, citations, or quotation marks — respond only with the sentence."
  );
}

const USER_PROMPT = (name: string) => `Why is "${name}" trending on X right now?`;

export function explanationsEnabled(): boolean {
  return providerId() === "openrouter"
    ? Boolean(process.env.OPENROUTER_API_KEY)
    : Boolean(process.env.ANTHROPIC_API_KEY);
}

type GenResult = { text: string; model: string };

// Anthropic path: Claude + Anthropic's server-side web_search tool (always grounded).
async function generateAnthropic(name: string): Promise<GenResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const model = process.env.EXPLAIN_MODEL ?? "claude-haiku-4-5";
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    system: buildSystemPrompt(true),
    messages: [{ role: "user", content: USER_PROMPT(name) }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
  });

  // The response interleaves search tool blocks with text; the answer is the last text block.
  const textBlocks = message.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  return { text: (textBlocks.at(-1)?.text ?? "").trim(), model };
}

// OpenRouter path: OpenAI-compatible chat completions. Web grounding is opt-in via the
// ":online" model suffix (OPENROUTER_WEB_SEARCH=true).
async function generateOpenRouter(name: string): Promise<GenResult | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  const webGrounded = process.env.OPENROUTER_WEB_SEARCH === "true";
  const baseModel = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash";
  const model = webGrounded ? `${baseModel}:online` : baseModel;

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: { "X-Title": "TrendSite" },
  });

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 200,
    messages: [
      { role: "system", content: buildSystemPrompt(webGrounded) },
      { role: "user", content: USER_PROMPT(name) },
    ],
  });

  return { text: (completion.choices[0]?.message?.content ?? "").trim(), model };
}

// Generate one explanation via the configured provider. Returns null if disabled.
async function generate(name: string): Promise<GenResult | null> {
  return providerId() === "openrouter"
    ? generateOpenRouter(name)
    : generateAnthropic(name);
}

// Return a cached explanation, generating and storing one on a cache miss.
// Returns null if explanations are disabled or generation fails.
export async function getOrCreateExplanation(
  locationId: number,
  name: string
): Promise<string | null> {
  const cached = await prisma.explanation.findUnique({
    where: { locationId_name: { locationId, name } },
  });
  if (cached) return cached.text;

  try {
    const res = await generate(name);
    if (!res || !res.text) return null;
    const { text, model } = res;

    await prisma.explanation.upsert({
      where: { locationId_name: { locationId, name } },
      update: { text, model, generatedAt: new Date() },
      create: { locationId, name, text, model },
    });
    return text;
  } catch (e) {
    // Best-effort feature — never let a failed explanation break a page render or ingest.
    console.error(`Explanation generation failed for "${name}":`, e);
    return null;
  }
}

// Generate explanations for the top-N trends of a location's most recent snapshot.
// Cached topics are skipped, so repeat runs cost nothing. Called after ingest.
export async function explainLatest(locationSlug: string, limit = 10): Promise<number> {
  if (!explanationsEnabled()) return 0;

  const location = await prisma.location.findUnique({ where: { slug: locationSlug } });
  if (!location) return 0;

  const latest = await prisma.snapshot.findFirst({
    where: { locationId: location.id },
    orderBy: { capturedAt: "desc" },
    include: { trends: { orderBy: { rank: "asc" }, take: limit } },
  });
  if (!latest) return 0;

  let generated = 0;
  for (const trend of latest.trends) {
    const before = await prisma.explanation.findUnique({
      where: { locationId_name: { locationId: location.id, name: trend.name } },
    });
    if (before) continue;
    const text = await getOrCreateExplanation(location.id, trend.name);
    if (text) generated++;
  }
  return generated;
}

// Fetch cached explanations for a set of trend names (no generation). Used by the page
// to decorate the table without adding latency to the render path.
export async function getExplanations(
  locationSlug: string,
  names: string[]
): Promise<Record<string, string>> {
  const location = await prisma.location.findUnique({ where: { slug: locationSlug } });
  if (!location) return {};

  const rows = await prisma.explanation.findMany({
    where: { locationId: location.id, name: { in: names } },
  });
  return Object.fromEntries(rows.map((r) => [r.name, r.text]));
}
