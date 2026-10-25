import { ingestDocument } from "./ingest-document";
import { createManual } from "./manual-document";
import { postEntry } from "./post-entry";
import { reverseEntry } from "./reverse-entry";

export { ingestDocument, type IngestResult } from "./ingest-document";
export { createManual, previewManual, type ManualCreated, type ManualInput, type ManualLine, type ManualPreview } from "./manual-document";
export { postEntry, type PostEntryInput, type JournalEntry } from "./post-entry";
export { reverseEntry, todayInAsuncion } from "./reverse-entry";
export { syncMarangatuDocuments, type SyncMarangatuResult } from "./sync-marangatu";

/** Every use case that mutates ledger state. Each must emit an audit event (enforced by usecases.test.ts). */
export const MUTATING_USECASES = { postEntry, reverseEntry, ingestDocument, createManual, syncMarangatuDocuments } as const;
