
-- 1) Create private schema for RLS helper functions
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;

-- 2) Move helper functions out of the exposed public schema.
-- Existing RLS policies reference these by OID, so ALTER ... SET SCHEMA preserves them.
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA app_private;
ALTER FUNCTION public.is_coach_of_athlete(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.owns_workout(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_assigned_workout(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.owns_questionnaire(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_assigned_questionnaire(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.owns_library_folder(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_assigned_folder(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_assigned_folder_or_ancestor(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.generate_short_id() SET SCHEMA app_private;

-- 3) Recreate set_short_id trigger fn to call the relocated generate_short_id
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'app_private'
AS $function$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := app_private.generate_short_id();
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Grant EXECUTE on moved functions to needed roles; revoke from PUBLIC
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private TO authenticated, service_role;
-- has_role/is_coach_of_athlete etc. only need to be called by signed-in users through RLS

-- 5) Tighten free_trial_requests INSERT policy (remove WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can submit free trial request" ON public.free_trial_requests;
CREATE POLICY "Anyone can submit free trial request"
ON public.free_trial_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(coalesce(full_name, '')) BETWEEN 2 AND 100
  AND char_length(coalesce(email, '')) BETWEEN 5 AND 254
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND age BETWEEN 3 AND 100
  AND char_length(coalesce(club, '')) BETWEEN 1 AND 200
  AND char_length(coalesce(position, '')) BETWEEN 1 AND 100
);

-- 6) Storage: library-files bucket
DROP POLICY IF EXISTS "Anyone can view library files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload library files" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete library files" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update library files" ON storage.objects;

CREATE POLICY "Owner coaches or assigned athletes can view library files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'library-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[2] IS NOT NULL
      AND app_private.is_assigned_folder_or_ancestor(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
  )
);

CREATE POLICY "Owner coaches can upload library files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'library-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] IS NOT NULL
  AND app_private.owns_library_folder(
    auth.uid(),
    NULLIF((storage.foldername(name))[2], '')::uuid
  )
);

CREATE POLICY "Owner coaches can update library files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'library-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'library-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owner coaches can delete library files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'library-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7) Storage: questionnaire-files bucket
DROP POLICY IF EXISTS "Anyone can view questionnaire files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload questionnaire files" ON storage.objects;

CREATE POLICY "Owner or linked user can view questionnaire files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'questionnaire-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE (
        ca.coach_id::text = (storage.foldername(name))[1]
        AND ca.athlete_id = auth.uid()
      )
      OR (
        ca.athlete_id::text = (storage.foldername(name))[1]
        AND ca.coach_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can upload questionnaire files to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'questionnaire-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 8) Storage: chat-files bucket
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;

CREATE POLICY "Chat participants can view chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.file_url LIKE '%' || storage.objects.name
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload chat files to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
