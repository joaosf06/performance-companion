
-- Add file attachments to custom questionnaires
ALTER TABLE public.custom_questionnaires ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Library system: folders and files
CREATE TABLE public.library_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.library_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.library_folders(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Library folder assignments to athletes
CREATE TABLE public.library_folder_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.library_folders(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id, athlete_id)
);

-- RLS
ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_folder_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches manage own folders
CREATE POLICY "Coaches can manage own folders" ON public.library_folders
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'))
  WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'));

-- Athletes can view assigned folders
CREATE POLICY "Athletes can view assigned folders" ON public.library_folders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.library_folder_assignments a WHERE a.folder_id = id AND a.athlete_id = auth.uid()));

-- Coaches manage own files
CREATE POLICY "Coaches can manage own files" ON public.library_files
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'))
  WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'));

-- Athletes can view files in assigned folders
CREATE POLICY "Athletes can view assigned folder files" ON public.library_files
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.library_folder_assignments a WHERE a.folder_id = folder_id AND a.athlete_id = auth.uid()));

-- Coaches manage folder assignments
CREATE POLICY "Coaches can manage folder assignments" ON public.library_folder_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.library_folders f WHERE f.id = folder_id AND f.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.library_folders f WHERE f.id = folder_id AND f.coach_id = auth.uid()));

-- Athletes can view own assignments
CREATE POLICY "Athletes can view own folder assignments" ON public.library_folder_assignments
  FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

-- Storage bucket for library files
INSERT INTO storage.buckets (id, name, public) VALUES ('library-files', 'library-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for questionnaire attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('questionnaire-files', 'questionnaire-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for library-files
CREATE POLICY "Authenticated users can upload library files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'library-files');

CREATE POLICY "Anyone can view library files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'library-files');

CREATE POLICY "Owners can delete library files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for questionnaire-files
CREATE POLICY "Authenticated users can upload questionnaire files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'questionnaire-files');

CREATE POLICY "Anyone can view questionnaire files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'questionnaire-files');
