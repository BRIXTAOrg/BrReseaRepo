ALTER TABLE "BrResearch"."document_chunks" ALTER COLUMN "job_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "BrResearch"."document_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "BrResearch"."document_chunks" ALTER COLUMN "embedding" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "BrResearch"."document_chunks" ADD COLUMN "chunk_index" text NOT NULL;