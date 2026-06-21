
-- Settings per coach
CREATE TABLE public.coach_schedule_settings (
  coach_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  min_cancel_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_schedule_settings TO authenticated;
GRANT ALL ON public.coach_schedule_settings TO service_role;
ALTER TABLE public.coach_schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own settings" ON public.coach_schedule_settings
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Athletes can read coach settings"
  ON public.coach_schedule_settings FOR SELECT TO authenticated
  USING (public.is_coach_of_athlete(coach_id, auth.uid()));

-- Weekly recurring slots
CREATE TABLE public.coach_recurring_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_recurring_slots TO authenticated;
GRANT ALL ON public.coach_recurring_slots TO service_role;
ALTER TABLE public.coach_recurring_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own recurring slots" ON public.coach_recurring_slots
  FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Athletes read coach recurring slots" ON public.coach_recurring_slots
  FOR SELECT TO authenticated USING (public.is_coach_of_athlete(coach_id, auth.uid()));

-- Specific date slots / blocks
CREATE TABLE public.coach_date_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  capacity INTEGER DEFAULT 1,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_date_slots TO authenticated;
GRANT ALL ON public.coach_date_slots TO service_role;
ALTER TABLE public.coach_date_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own date slots" ON public.coach_date_slots
  FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Athletes read coach date slots" ON public.coach_date_slots
  FOR SELECT TO authenticated USING (public.is_coach_of_athlete(coach_id, auth.uid()));

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  source TEXT NOT NULL CHECK (source IN ('recurring','date')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, slot_date, start_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Coach sees bookings for himself
CREATE POLICY "Coach sees own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "Coach can cancel bookings" ON public.bookings
  FOR DELETE TO authenticated USING (coach_id = auth.uid());

-- Athlete sees bookings of his coach (to compute occupancy) only if associated
CREATE POLICY "Athletes see coach bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_coach_of_athlete(coach_id, auth.uid()));

-- Athlete creates own bookings, must be associated to coach
CREATE POLICY "Athletes create own bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    athlete_id = auth.uid()
    AND public.is_coach_of_athlete(coach_id, auth.uid())
  );

CREATE POLICY "Athletes cancel own bookings" ON public.bookings
  FOR DELETE TO authenticated USING (athlete_id = auth.uid());

CREATE INDEX idx_bookings_coach_date ON public.bookings(coach_id, slot_date);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- updated_at trigger for settings
CREATE TRIGGER trg_coach_schedule_settings_updated
BEFORE UPDATE ON public.coach_schedule_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
