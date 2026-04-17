-- Add recurrence configuration to questionnaires
ALTER TABLE public.custom_questionnaires
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_day integer,
  ADD COLUMN IF NOT EXISTS recurrence_hour integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_active boolean NOT NULL DEFAULT false;

-- recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
-- recurrence_day: for weekly = 0-6 (Sunday-Saturday), for monthly = 1-28
-- recurrence_hour: hour of day (0-23) when to send

-- Auto-assign athletes for recurring questionnaires
CREATE TABLE IF NOT EXISTS public.questionnaire_recurrence_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.custom_questionnaires(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(questionnaire_id, athlete_id)
);

ALTER TABLE public.questionnaire_recurrence_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage recurrence athletes"
ON public.questionnaire_recurrence_athletes
FOR ALL
TO authenticated
USING (public.owns_questionnaire(auth.uid(), questionnaire_id))
WITH CHECK (public.owns_questionnaire(auth.uid(), questionnaire_id));

CREATE POLICY "Athletes can view their own recurrence membership"
ON public.questionnaire_recurrence_athletes
FOR SELECT
TO authenticated
USING (athlete_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_questionnaires_next_run ON public.custom_questionnaires(next_run_at) WHERE recurrence_active = true;

-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;