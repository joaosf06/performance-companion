
-- Table
CREATE TABLE public.athlete_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.athlete_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own athlete documents"
ON public.athlete_documents
FOR ALL
TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Athletes can view their documents"
ON public.athlete_documents
FOR SELECT
TO authenticated
USING (auth.uid() = athlete_id);

CREATE INDEX idx_athlete_documents_athlete ON public.athlete_documents(athlete_id);
CREATE INDEX idx_athlete_documents_coach ON public.athlete_documents(coach_id);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-documents', 'athlete-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: path layout = {coach_id}/{athlete_id}/{filename}
CREATE POLICY "Coaches upload athlete documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'athlete-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches read own athlete documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'athlete-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches delete own athlete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'athlete-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Athletes read documents addressed to them"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'athlete-documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
