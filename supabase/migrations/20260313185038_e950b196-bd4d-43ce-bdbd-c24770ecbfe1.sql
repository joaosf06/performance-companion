
-- Allow players to view their coach's profile
CREATE POLICY "Players can view coach profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_athletes.athlete_id = auth.uid()
        AND coach_athletes.coach_id = profiles.user_id
    )
  );
