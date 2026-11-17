CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "table_id" uuid NOT NULL REFERENCES "tables"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "events" jsonb DEFAULT '["rows.created", "rows.updated", "rows.deleted"]'::jsonb NOT NULL,
  "request_type" text DEFAULT 'POST' NOT NULL,
  "headers" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "webhooks_table_id_idx" ON "webhooks" ("table_id");

CREATE TABLE IF NOT EXISTS "snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "table_id" uuid REFERENCES "tables"("id") ON DELETE CASCADE,
  "base_id" uuid REFERENCES "bases"("id") ON DELETE CASCADE,
  "data" jsonb NOT NULL,
  "created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "snapshots_table_id_idx" ON "snapshots" ("table_id");
CREATE INDEX IF NOT EXISTS "snapshots_base_id_idx" ON "snapshots" ("base_id");
