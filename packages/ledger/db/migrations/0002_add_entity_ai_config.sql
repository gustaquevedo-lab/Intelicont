-- Add AI Configuration columns to entities table
ALTER TABLE "entities" ADD COLUMN "ai_provider" varchar(50) DEFAULT 'gemini' NOT NULL;
ALTER TABLE "entities" ADD COLUMN "ai_api_key" text;
