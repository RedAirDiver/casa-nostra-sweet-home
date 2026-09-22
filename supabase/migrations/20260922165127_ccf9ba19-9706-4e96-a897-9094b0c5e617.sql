CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_set_password(_email text, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can set passwords';
  END IF;
  IF _password IS NULL OR length(_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  SELECT id INTO target FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF target IS NULL THEN RETURN false; END IF;
  UPDATE auth.users
     SET encrypted_password = extensions.crypt(_password, extensions.gen_salt('bf')),
         email_confirmed_at = COALESCE(email_confirmed_at, now()),
         updated_at = now()
   WHERE id = target;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_password(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_password(text, text) TO authenticated;