
-- Allow coaches to view any profile (needed for upgrade by short_id)
CREATE POLICY "Coaches can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));
