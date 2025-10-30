-- Add last_seen_at to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Add last_read_at to chat_participants
ALTER TABLE "ChatParticipant"
ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS users_last_seen_at_idx ON users (last_seen_at);
CREATE INDEX IF NOT EXISTS chat_participants_last_read_at_idx ON "ChatParticipant" (last_read_at);


