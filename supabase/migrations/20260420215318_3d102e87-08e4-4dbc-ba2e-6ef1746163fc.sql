-- Workouts table
CREATE TABLE public.complementary_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_complementary_workouts_athlete ON public.complementary_workouts(athlete_id);
CREATE INDEX idx_complementary_workouts_coach ON public.complementary_workouts(coach_id);

ALTER TABLE public.complementary_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own workouts"
ON public.complementary_workouts
FOR ALL
TO authenticated
USING (coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Athletes view own workouts"
ON public.complementary_workouts
FOR SELECT
TO authenticated
USING (athlete_id = auth.uid());

CREATE POLICY "Athletes update own workout status"
ON public.complementary_workouts
FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

CREATE TRIGGER update_complementary_workouts_updated_at
BEFORE UPDATE ON public.complementary_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Workout items (exercises from library)
CREATE TABLE public.complementary_workout_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.complementary_workouts(id) ON DELETE CASCADE,
  library_file_id UUID REFERENCES public.library_files(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  load TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_items_workout ON public.complementary_workout_items(workout_id);

ALTER TABLE public.complementary_workout_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check workout ownership/assignment
CREATE OR REPLACE FUNCTION public.owns_workout(_user_id uuid, _workout_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.complementary_workouts
    WHERE id = _workout_id AND coach_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_workout(_athlete_id uuid, _workout_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.complementary_workouts
    WHERE id = _workout_id AND athlete_id = _athlete_id
  )
$$;

CREATE POLICY "Coaches manage workout items"
ON public.complementary_workout_items
FOR ALL
TO authenticated
USING (public.owns_workout(auth.uid(), workout_id))
WITH CHECK (public.owns_workout(auth.uid(), workout_id));

CREATE POLICY "Athletes view assigned workout items"
ON public.complementary_workout_items
FOR SELECT
TO authenticated
USING (public.is_assigned_workout(auth.uid(), workout_id));