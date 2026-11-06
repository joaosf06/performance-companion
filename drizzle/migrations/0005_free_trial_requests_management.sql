ALTER TABLE public.free_trial_requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS coach_notes text,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

ALTER TABLE public.free_trial_requests
  ADD CONSTRAINT free_trial_requests_status_check
  CHECK (status IN ('novo','contactado','agendado','compareceu','nao_compareceu','inscrito'));

GRANT SELECT, UPDATE, DELETE ON public.free_trial_requests TO authenticated;
GRANT ALL ON public.free_trial_requests TO service_role;

CREATE POLICY "Coaches can view free trial requests" ON public.free_trial_requests
  FOR SELECT TO authenticated USING (app_private.has_role(auth.uid(), 'coach'::public.app_role));
CREATE POLICY "Coaches can update free trial requests" ON public.free_trial_requests
  FOR UPDATE TO authenticated USING (app_private.has_role(auth.uid(), 'coach'::public.app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'coach'::public.app_role));
CREATE POLICY "Coaches can delete free trial requests" ON public.free_trial_requests
  FOR DELETE TO authenticated USING (app_private.has_role(auth.uid(), 'coach'::public.app_role));

-- Phase 3: align age range to 5-50 in the public insert policy
DROP POLICY "Anyone can submit free trial request" ON public.free_trial_requests;
CREATE POLICY "Anyone can submit free trial request" ON public.free_trial_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(COALESCE(full_name,'')) BETWEEN 2 AND 100
    AND char_length(COALESCE(email,'')) BETWEEN 5 AND 254
    AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    AND age BETWEEN 5 AND 50
    AND char_length(COALESCE(club,'')) BETWEEN 1 AND 200
    AND char_length(COALESCE("position",'')) BETWEEN 1 AND 100
    AND status = 'novo' AND coach_notes IS NULL AND last_contacted_at IS NULL
  );

-- Phase 3: server-side validation + rate limit (insert only, existing rows untouched)
CREATE OR REPLACE FUNCTION app_private.validate_free_trial_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.level NOT IN ('Sub-13','Sub-14','Sub-15','Sub-16','Sub-17','Sub-18','Sub-19','Sub-23','Seniores') THEN
    RAISE EXCEPTION 'Escalão inválido' USING ERRCODE = '22023';
  END IF;
  IF NEW.preferred_foot NOT IN ('Direito','Esquerdo','Ambos') THEN
    RAISE EXCEPTION 'Pé favorito inválido' USING ERRCODE = '22023';
  END IF;
  IF NEW.availability NOT IN (
    'Segunda-feira (manhã)','Segunda-feira (tarde)','Terça-feira (manhã)','Terça-feira (tarde)',
    'Quarta-feira (manhã)','Quarta-feira (tarde)','Quinta-feira (manhã)','Quinta-feira (tarde)',
    'Sexta-feira (manhã)','Sexta-feira (tarde)','Sábado (manhã)','Sábado (tarde)',
    'Domingo (manhã)','Domingo (tarde)') THEN
    RAISE EXCEPTION 'Disponibilidade inválida' USING ERRCODE = '22023';
  END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9][0-9 ()-]{7,18}[0-9]$' THEN
    RAISE EXCEPTION 'Telemóvel inválido' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.free_trial_requests
      WHERE lower(email) = lower(NEW.email) AND created_at > now() - interval '24 hours') >= 3 THEN
    RAISE EXCEPTION 'RATE_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.validate_free_trial_request() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER validate_free_trial_request BEFORE INSERT ON public.free_trial_requests
  FOR EACH ROW EXECUTE FUNCTION app_private.validate_free_trial_request();