import {
  pgSchema,
  text,
  uuid,
  bigserial,
  integer,
  customType,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

export const brixtaSchema = pgSchema("BrResearch");

// -----------------------------------------------------------------------------
// pgvector
// Nomic Embed v1.5 -> 768 dimensions
// -----------------------------------------------------------------------------

const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
});

// -----------------------------------------------------------------------------
// Ingestion Jobs
// -----------------------------------------------------------------------------

export const ingestionJobs = brixtaSchema.table("ingestion_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),

  sourceType: text("source_type").notNull(),

  sourceTarget: text("source_target").notNull(),

  tenantId: text("tenant_id").notNull(),

  status: text("status")
    .default("queued")
    .notNull(),

  errorLog: text("error_log"),
});

// -----------------------------------------------------------------------------
// Document Chunks
// One row = One semantic chunk
// -----------------------------------------------------------------------------

export const documentChunks = brixtaSchema.table("document_chunks", {
  id: bigserial("id", {
    mode: "bigint",
  }).primaryKey(),

  jobId: uuid("job_id")
    .notNull()
    .references(() => ingestionJobs.id, {
      onDelete: "cascade",
    }),

  tenantId: text("tenant_id").notNull(),

  chunkIndex: integer("chunk_index").notNull(),

  content: text("content").notNull(),

  embedding: vector("embedding").notNull(),
});