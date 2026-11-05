DROP POLICY "Coaches can insert roles for upgrade" ON public.user_roles;
CREATE POLICY "Coaches can insert roles for upgrade"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'coach'::public.app_role));