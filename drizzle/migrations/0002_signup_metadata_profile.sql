CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (user_id, full_name, birth_date, phone, guardian_phone, instagram, position, age_group, current_club)
  VALUES (NEW.id, COALESCE(m->>'full_name',''),
    NULLIF(m->>'birth_date','')::date, NULLIF(m->>'phone',''), NULLIF(m->>'guardian_phone',''),
    NULLIF(m->>'instagram',''), NULLIF(m->>'position',''), NULLIF(m->>'age_group',''), NULLIF(m->>'current_club',''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;