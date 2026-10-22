import { postEntry } from "./post-entry";
import { reverseEntry } from "./reverse-entry";

export { postEntry, type PostEntryInput, type JournalEntry } from "./post-entry";
export { reverseEntry, todayInAsuncion } from "./reverse-entry";

/** Every use case that mutates ledger state. Each must emit an audit event (enforced by usecases.test.ts). */
export const MUTATING_USECASES = { postEntry, reverseEntry } as const;
