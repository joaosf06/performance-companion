
CREATE TABLE public.free_trial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  age integer NOT NULL,
  position text NOT NULL,
  club text NOT NULL,
  level text NOT NULL,
  preferred_foot text NOT NULL,
  availability text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.free_trial_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form, no auth needed)
CREATE POLICY "Anyone can submit free trial request"
ON public.free_trial_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
