-- Drop the existing CHECK constraint on status (find by querying pg_constraint since it was created inline)
DO $$
DECLARE
    cname TEXT;
BEGIN
    SELECT con.conname INTO cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'shelves'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%status%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE shelves DROP CONSTRAINT %I', cname);
    END IF;
END $$;

-- Remove 'listened' entries (ratings now serve this purpose)
DELETE FROM shelves WHERE status = 'listened';

-- Rename currently_listening to on_rotation
UPDATE shelves SET status = 'on_rotation' WHERE status = 'currently_listening';

-- Add new CHECK constraint
ALTER TABLE shelves ADD CONSTRAINT shelves_status_check CHECK (status IN ('on_rotation', 'want_to_listen'));
