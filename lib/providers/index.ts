import { TrendProvider } from "./types";
import { mockProvider } from "./mock";
import { apifyProvider } from "./apify";

// Single place that decides which data source the app uses, driven by TRENDS_PROVIDER.
// Add new providers (e.g. an official X API adapter) here without touching the rest of the app.
export function getProvider(): TrendProvider {
  const id = (process.env.TRENDS_PROVIDER ?? "mock").toLowerCase();
  switch (id) {
    case "apify":
      return apifyProvider;
    case "mock":
      return mockProvider;
    default:
      throw new Error(`Unknown TRENDS_PROVIDER: "${id}" (expected "mock" or "apify")`);
  }
}

export * from "./types";
