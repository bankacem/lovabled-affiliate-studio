-- Add unique constraint on external_id column
ALTER TABLE public.designs ADD CONSTRAINT designs_external_id_unique UNIQUE (external_id);