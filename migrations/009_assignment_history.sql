-- Add history column to assignments to track event history
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill any existing nulls to empty array (idempotent safety)
UPDATE assignments SET history = '[]'::jsonb WHERE history IS NULL;

-- Optional index if querying by event types frequently (kept simple for now)
-- CREATE INDEX IF NOT EXISTS assignments_history_gin_idx ON assignments USING gin (history);


