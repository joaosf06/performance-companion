CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Coaches can insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (app_private.has_role(auth.uid(), 'coach'))
WITH CHECK (app_private.has_role(auth.uid(), 'coach'));

INSERT INTO public.site_settings (key, value)
VALUES ('hero_image_framing', '{"bgX":50,"bgY":50,"bgZoom":105,"cardX":50,"cardY":50,"cardZoom":100}'::jsonb);