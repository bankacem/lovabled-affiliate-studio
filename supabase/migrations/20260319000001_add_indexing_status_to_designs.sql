-- Add indexing_status field to designs for Tracking Indexing progress
ALTER TABLE public.designs
ADD COLUMN IF NOT EXISTS indexing_status TEXT NOT NULL DEFAULT 'pending'
CHECK (indexing_status IN ('indexed', 'pending'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_designs_indexing_status ON public.designs(indexing_status);

-- Set existing designs as 'indexed' by default (assume older designs are indexed)
UPDATE public.designs
SET indexing_status = 'indexed'
WHERE created_at < NOW() - INTERVAL '7 days';

-- Comment for documentation
COMMENT ON COLUMN public.designs.indexing_status IS 'Tracks if design is indexed by search engines: indexed = established/high-authority, pending = new/needs promotion';
