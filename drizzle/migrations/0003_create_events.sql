CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Novo evento',
  subtitle text,
  cover_url text,
  published boolean NOT NULL DEFAULT false,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published events are public" ON public.events FOR SELECT USING (published OR app_private.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (app_private.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches update events" ON public.events FOR UPDATE TO authenticated USING (app_private.has_role(auth.uid(), 'coach')) WITH CHECK (app_private.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches delete events" ON public.events FOR DELETE TO authenticated USING (app_private.has_role(auth.uid(), 'coach'));

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  block_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.event_registrations TO anon;
GRANT SELECT, INSERT, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone registers to published events" ON public.event_registrations FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.published) AND length(data::text) < 10000 AND length(block_id) < 100);
CREATE POLICY "Coaches read registrations" ON public.event_registrations FOR SELECT TO authenticated USING (app_private.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches delete registrations" ON public.event_registrations FOR DELETE TO authenticated USING (app_private.has_role(auth.uid(), 'coach'));