
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('player', 'coach');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Coach-athlete relationships
CREATE TABLE public.coach_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

-- Training reports
CREATE TABLE public.training_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  objective TEXT NOT NULL,
  strengths TEXT,
  improvements TEXT,
  technical_score INT CHECK (technical_score BETWEEN 1 AND 10),
  intensity_score INT CHECK (intensity_score BETWEEN 1 AND 10),
  mental_observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly questionnaires
CREATE TABLE public.weekly_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fatigue INT CHECK (fatigue BETWEEN 1 AND 10) NOT NULL,
  muscle_pain INT CHECK (muscle_pain BETWEEN 1 AND 10) NOT NULL,
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 10) NOT NULL,
  confidence INT CHECK (confidence BETWEEN 1 AND 10) NOT NULL,
  motivation INT CHECK (motivation BETWEEN 1 AND 10) NOT NULL,
  minutes_played INT NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, week_start)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_questionnaires ENABLE ROW LEVEL SECURITY;

-- Helper function: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function: is coach of athlete
CREATE OR REPLACE FUNCTION public.is_coach_of_athlete(_coach_id UUID, _athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_id = _coach_id AND athlete_id = _athlete_id
  )
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Coaches can view athlete profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'coach') AND
  public.is_coach_of_athlete(auth.uid(), user_id)
);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own role" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- COACH_ATHLETES POLICIES
CREATE POLICY "Coaches can view own athletes" ON public.coach_athletes
FOR SELECT TO authenticated USING (coach_id = auth.uid());

CREATE POLICY "Athletes can view own coach" ON public.coach_athletes
FOR SELECT TO authenticated USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can add athletes" ON public.coach_athletes
FOR INSERT TO authenticated WITH CHECK (
  coach_id = auth.uid() AND
  public.has_role(auth.uid(), 'coach')
);

CREATE POLICY "Coaches can remove athletes" ON public.coach_athletes
FOR DELETE TO authenticated USING (
  coach_id = auth.uid() AND
  public.has_role(auth.uid(), 'coach')
);

-- TRAINING_REPORTS POLICIES
CREATE POLICY "Coaches can view own reports" ON public.training_reports
FOR SELECT TO authenticated USING (
  coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach')
);

CREATE POLICY "Athletes can view own reports" ON public.training_reports
FOR SELECT TO authenticated USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can create reports for athletes" ON public.training_reports
FOR INSERT TO authenticated WITH CHECK (
  coach_id = auth.uid() AND
  public.has_role(auth.uid(), 'coach') AND
  public.is_coach_of_athlete(auth.uid(), athlete_id)
);

-- WEEKLY_QUESTIONNAIRES POLICIES
CREATE POLICY "Players can view own questionnaires" ON public.weekly_questionnaires
FOR SELECT TO authenticated USING (player_id = auth.uid());

CREATE POLICY "Coaches can view athlete questionnaires" ON public.weekly_questionnaires
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'coach') AND
  public.is_coach_of_athlete(auth.uid(), player_id)
);

CREATE POLICY "Players can create own questionnaires" ON public.weekly_questionnaires
FOR INSERT TO authenticated WITH CHECK (
  player_id = auth.uid() AND
  public.has_role(auth.uid(), 'player')
);
