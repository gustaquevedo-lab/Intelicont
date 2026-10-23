export type { AccountRef, AIProvider, Direction, DocFacts, Suggestion, SuggestionLine } from "./provider";
export { RuleBasedProvider, type RuleOptions } from "./rules";
export { OllamaProvider, OllamaRejected, buildOllamaMessages, suggestWithFallback } from "./ollama";
