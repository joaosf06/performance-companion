ALTER TABLE public.free_trial_requests
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS guardian_email text,
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text;

CREATE OR REPLACE FUNCTION app_private.validate_free_trial_consent()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.consent_accepted_at IS NULL OR NEW.consent_version IS NULL THEN
    RAISE EXCEPTION 'Consentimento obrigatório' USING ERRCODE = '22023';
  END IF;
  NEW.consent_accepted_at := now();
  IF NEW.age < 18 AND (
    char_length(COALESCE(NEW.guardian_name,'')) < 2
    OR COALESCE(NEW.guardian_phone,'') !~ '^\+?[0-9][0-9 ()-]{7,18}[0-9]$'
    OR COALESCE(NEW.guardian_email,'') !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') THEN
    RAISE EXCEPTION 'Dados do encarregado de educação obrigatórios' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.validate_free_trial_consent() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER validate_free_trial_consent BEFORE INSERT ON public.free_trial_requests
  FOR EACH ROW EXECUTE FUNCTION app_private.validate_free_trial_consent();