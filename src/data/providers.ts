// The AI providers the Rewrite page can call, and the models it suggests for each.
// Keep this file current: providers retire model names, and a retired default breaks the page.
// Check each provider's deprecation page and update lastVerified whenever you change it.
//   OpenAI:    https://developers.openai.com/api/docs/deprecations
//   Anthropic: https://docs.anthropic.com/en/docs/about-claude/model-deprecations
//   Google:    https://ai.google.dev/gemini-api/docs/deprecations
export const lastVerified = "2026-11-12";

export type ProviderId = "gemini" | "anthropic" | "openai";

export const providers: Record<ProviderId, {
  name: string;
  host: string;
  models: string[];
  keyHint: string;
  keyPage: string;
  policyName: string;
  policyUrl: string;
  dataNote: string;
}> = {
  gemini: {
    name: "Google Gemini",
    host: "generativelanguage.googleapis.com",
    models: ["gemini-3.8-flash", "gemini-3.5-flash-lite"],
    keyHint: "Free tier available. Keys start with AIza.",
    keyPage: "https://aistudio.google.com/apikey",
    policyName: "Gemini API terms",
    policyUrl: "https://ai.google.dev/gemini-api/terms",
    dataNote: "On Google's free tier, Google may use your text to improve its products, and people at Google may read it. On a paid key, it doesn't. Use a paid key for anything private.",
  },
  anthropic: {
    name: "Anthropic Claude",
    host: "api.anthropic.com",
    models: ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"],
    keyHint: "Keys start with sk-ant-.",
    keyPage: "https://console.anthropic.com/settings/keys",
    policyName: "Anthropic's privacy policy",
    policyUrl: "https://www.anthropic.com/legal/privacy",
    dataNote: "Anthropic doesn't train its models on API requests by default. Each request is billed to your account.",
  },
  openai: {
    name: "OpenAI",
    host: "api.openai.com",
    models: ["gpt-5.6-sol", "gpt-5.6-terra"],
    keyHint: "Keys start with sk-. You can type any model your account has.",
    keyPage: "https://platform.openai.com/api-keys",
    policyName: "OpenAI's privacy policy",
    policyUrl: "https://openai.com/policies/privacy-policy/",
    dataNote: "OpenAI doesn't train its models on API requests by default. Each request is billed to your account.",
  },
};
