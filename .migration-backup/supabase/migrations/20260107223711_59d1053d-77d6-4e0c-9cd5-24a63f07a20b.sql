-- Add RLS policies for admins to manage designs
CREATE POLICY "Admins can insert designs" 
ON public.designs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update designs" 
ON public.designs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete designs" 
ON public.designs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create stores table to save multiple store profiles
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  store_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('redbubble', 'teepublic')),
  username TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS policies for stores
CREATE POLICY "Admins can view all stores" 
ON public.stores 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stores" 
ON public.stores 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stores" 
ON public.stores 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make external_id unique for designs table to support upsert
CREATE UNIQUE INDEX IF NOT EXISTS designs_external_id_unique ON public.designs(external_id) WHERE external_id IS NOT NULL;