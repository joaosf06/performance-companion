
-- Revoke EXECUTE from anon/authenticated on the SECURITY DEFINER user signup handler.
-- It is called only by an auth.users trigger running as the table owner.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Narrow avatars SELECT policy: listing restricted to the owner. Public URLs still work
-- because getPublicUrl on a public bucket bypasses RLS for direct object fetches.
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Owners can list own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
