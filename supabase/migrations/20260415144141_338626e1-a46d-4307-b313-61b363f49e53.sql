
-- Seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coach_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own seasons"
ON public.seasons FOR ALL TO authenticated
USING (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Athletes can view seasons from their coach"
ON public.seasons FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coach_athletes ca
  WHERE ca.athlete_id = auth.uid() AND ca.coach_id = seasons.coach_id
));

-- Athlete stats table
CREATE TABLE public.athlete_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'custom',
  body_zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.athlete_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage stats for their athletes"
ON public.athlete_stats FOR ALL TO authenticated
USING (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Athletes can view own stats"
ON public.athlete_stats FOR SELECT TO authenticated
USING (athlete_id = auth.uid());

CREATE TRIGGER update_athlete_stats_updated_at
BEFORE UPDATE ON public.athlete_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_athlete_stats_athlete_season ON public.athlete_stats(athlete_id, season_id);
CREATE INDEX idx_athlete_stats_coach ON public.athlete_stats(coach_id);
