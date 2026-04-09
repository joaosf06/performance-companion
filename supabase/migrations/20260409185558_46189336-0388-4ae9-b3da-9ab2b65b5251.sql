
-- Helper: check if coach owns a questionnaire (bypasses RLS)
CREATE OR REPLACE FUNCTION public.owns_questionnaire(_user_id uuid, _questionnaire_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.custom_questionnaires
    WHERE id = _questionnaire_id AND coach_id = _user_id
  )
$$;

-- Helper: check if athlete is assigned to a questionnaire (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_assigned_questionnaire(_athlete_id uuid, _questionnaire_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.custom_questionnaire_assignments
    WHERE questionnaire_id = _questionnaire_id AND athlete_id = _athlete_id
  )
$$;

-- Helper: check if coach owns a library folder (bypasses RLS)
CREATE OR REPLACE FUNCTION public.owns_library_folder(_user_id uuid, _folder_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.library_folders
    WHERE id = _folder_id AND coach_id = _user_id
  )
$$;

-- Helper: check if athlete is assigned to a library folder (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_assigned_folder(_athlete_id uuid, _folder_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.library_folder_assignments
    WHERE folder_id = _folder_id AND athlete_id = _athlete_id
  )
$$;

-- ===== Fix custom_questionnaires policies =====
DROP POLICY IF EXISTS "Athletes can view assigned questionnaires" ON public.custom_questionnaires;
CREATE POLICY "Athletes can view assigned questionnaires" ON public.custom_questionnaires
  FOR SELECT TO authenticated
  USING (public.is_assigned_questionnaire(auth.uid(), id));

-- ===== Fix custom_questionnaire_assignments policies =====
DROP POLICY IF EXISTS "Coaches can manage assignments" ON public.custom_questionnaire_assignments;
CREATE POLICY "Coaches can manage assignments" ON public.custom_questionnaire_assignments
  FOR ALL TO authenticated
  USING (public.owns_questionnaire(auth.uid(), questionnaire_id))
  WITH CHECK (public.owns_questionnaire(auth.uid(), questionnaire_id));

-- ===== Fix custom_questionnaire_fields policies =====
DROP POLICY IF EXISTS "Coaches can manage questionnaire fields" ON public.custom_questionnaire_fields;
CREATE POLICY "Coaches can manage questionnaire fields" ON public.custom_questionnaire_fields
  FOR ALL TO authenticated
  USING (public.owns_questionnaire(auth.uid(), questionnaire_id))
  WITH CHECK (public.owns_questionnaire(auth.uid(), questionnaire_id));

DROP POLICY IF EXISTS "Athletes can view assigned questionnaire fields" ON public.custom_questionnaire_fields;
CREATE POLICY "Athletes can view assigned questionnaire fields" ON public.custom_questionnaire_fields
  FOR SELECT TO authenticated
  USING (public.is_assigned_questionnaire(auth.uid(), questionnaire_id));

-- ===== Fix custom_questionnaire_responses policies =====
DROP POLICY IF EXISTS "Coaches can view responses" ON public.custom_questionnaire_responses;
CREATE POLICY "Coaches can view responses" ON public.custom_questionnaire_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_questionnaire_assignments a
    WHERE a.id = custom_questionnaire_responses.assignment_id
      AND public.owns_questionnaire(auth.uid(), a.questionnaire_id)
  ));

-- ===== Fix library_folders policies =====
DROP POLICY IF EXISTS "Athletes can view assigned folders" ON public.library_folders;
CREATE POLICY "Athletes can view assigned folders" ON public.library_folders
  FOR SELECT TO authenticated
  USING (public.is_assigned_folder(auth.uid(), id));

-- ===== Fix library_folder_assignments policies =====
DROP POLICY IF EXISTS "Coaches can manage folder assignments" ON public.library_folder_assignments;
CREATE POLICY "Coaches can manage folder assignments" ON public.library_folder_assignments
  FOR ALL TO authenticated
  USING (public.owns_library_folder(auth.uid(), folder_id))
  WITH CHECK (public.owns_library_folder(auth.uid(), folder_id));

-- ===== Fix library_files policies =====
DROP POLICY IF EXISTS "Athletes can view assigned folder files" ON public.library_files;
CREATE POLICY "Athletes can view assigned folder files" ON public.library_files
  FOR SELECT TO authenticated
  USING (public.is_assigned_folder(auth.uid(), folder_id));
