
-- Allow coaches to delete and insert user_roles for upgrade functionality
CREATE POLICY "Coaches can delete user roles for upgrade" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can insert roles for upgrade" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR user_id = auth.uid());

-- Drop the old insert policy first
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Allow coaches to view all user roles (needed for upgrade)
CREATE POLICY "Coaches can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));
