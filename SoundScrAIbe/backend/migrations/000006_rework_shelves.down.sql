ALTER TABLE shelves DROP CONSTRAINT IF EXISTS shelves_status_check;
ALTER TABLE shelves ADD CONSTRAINT shelves_status_check CHECK (status IN ('listened', 'currently_listening', 'want_to_listen'));
UPDATE shelves SET status = 'currently_listening' WHERE status = 'on_rotation';
