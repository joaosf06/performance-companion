
-- Fix library_folders RLS
DROP POLICY IF EXISTS "Athletes can view assigned folders" ON public.library_folders;
CREATE POLICY "Athletes can view assigned folders" ON public.library_folders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.library_folder_assignments a
    WHERE a.folder_id = library_folders.id AND a.athlete_id = auth.uid()
  ));

-- Fix library_files RLS
DROP POLICY IF EXISTS "Athletes can view assigned folder files" ON public.library_files;
CREATE POLICY "Athletes can view assigned folder files" ON public.library_files
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.library_folder_assignments a
    WHERE a.folder_id = library_files.folder_id AND a.athlete_id = auth.uid()
  ));

-- Fix custom_questionnaires RLS
DROP POLICY IF EXISTS "Athletes can view assigned questionnaires" ON public.custom_questionnaires;
CREATE POLICY "Athletes can view assigned questionnaires" ON public.custom_questionnaires
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_questionnaire_assignments a
    WHERE a.questionnaire_id = custom_questionnaires.id AND a.athlete_id = auth.uid()
  ));

-- Fix custom_questionnaire_fields RLS
DROP POLICY IF EXISTS "Athletes can view assigned questionnaire fields" ON public.custom_questionnaire_fields;
CREATE POLICY "Athletes can view assigned questionnaire fields" ON public.custom_questionnaire_fields
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_questionnaire_assignments a
    WHERE a.questionnaire_id = custom_questionnaire_fields.questionnaire_id AND a.athlete_id = auth.uid()
  ));

-- Create upgrade_requests table
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(user_id)
);

ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own request" ON public.upgrade_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own request" ON public.upgrade_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
