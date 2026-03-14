
-- Add short_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- Function to generate unique 6-digit short_id
CREATE OR REPLACE FUNCTION public.generate_short_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_id TEXT;
  done BOOL;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    new_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    done := NOT EXISTS (SELECT 1 FROM public.profiles WHERE short_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$;

-- Trigger to auto-assign short_id on insert
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := public.generate_short_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_short_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_short_id();

-- Backfill existing profiles
UPDATE public.profiles SET short_id = public.generate_short_id() WHERE short_id IS NULL;

-- Custom questionnaires tables
CREATE TABLE public.custom_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_questionnaire_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.custom_questionnaires(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL DEFAULT 'text',
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options JSONB
);

CREATE TABLE public.custom_questionnaire_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.custom_questionnaires(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(questionnaire_id, athlete_id)
);

CREATE TABLE public.custom_questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.custom_questionnaire_assignments(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_questionnaire_fields(id) ON DELETE CASCADE,
  text_value TEXT,
  number_value NUMERIC,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.custom_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_questionnaire_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_questionnaire_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Coaches can CRUD own questionnaires
CREATE POLICY "Coaches can manage own questionnaires" ON public.custom_questionnaires
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'))
  WITH CHECK (coach_id = auth.uid() AND has_role(auth.uid(), 'coach'));

-- Fields: coaches can manage via questionnaire ownership
CREATE POLICY "Coaches can manage questionnaire fields" ON public.custom_questionnaire_fields
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_questionnaires q WHERE q.id = questionnaire_id AND q.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_questionnaires q WHERE q.id = questionnaire_id AND q.coach_id = auth.uid()));

-- Athletes can view fields of assigned questionnaires
CREATE POLICY "Athletes can view assigned questionnaire fields" ON public.custom_questionnaire_fields
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_questionnaire_assignments a WHERE a.questionnaire_id = questionnaire_id AND a.athlete_id = auth.uid()));

-- Assignments: coaches can manage, athletes can view own
CREATE POLICY "Coaches can manage assignments" ON public.custom_questionnaire_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_questionnaires q WHERE q.id = questionnaire_id AND q.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_questionnaires q WHERE q.id = questionnaire_id AND q.coach_id = auth.uid()));

CREATE POLICY "Athletes can view own assignments" ON public.custom_questionnaire_assignments
  FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can update own assignments" ON public.custom_questionnaire_assignments
  FOR UPDATE TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- Responses: athletes can insert own, coaches can view
CREATE POLICY "Athletes can insert own responses" ON public.custom_questionnaire_responses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_questionnaire_assignments a WHERE a.id = assignment_id AND a.athlete_id = auth.uid()));

CREATE POLICY "Athletes can view own responses" ON public.custom_questionnaire_responses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_questionnaire_assignments a WHERE a.id = assignment_id AND a.athlete_id = auth.uid()));

CREATE POLICY "Coaches can view responses" ON public.custom_questionnaire_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_questionnaire_assignments a
    JOIN public.custom_questionnaires q ON q.id = a.questionnaire_id
    WHERE a.id = assignment_id AND q.coach_id = auth.uid()
  ));

-- Athletes can view assigned questionnaires
CREATE POLICY "Athletes can view assigned questionnaires" ON public.custom_questionnaires
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_questionnaire_assignments a WHERE a.questionnaire_id = id AND a.athlete_id = auth.uid()));
