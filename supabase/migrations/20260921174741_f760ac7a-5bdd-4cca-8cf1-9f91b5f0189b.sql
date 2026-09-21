CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  confirmed boolean,
  is_self boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Endast administratörer får hantera behörigheter.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    COALESCE(u.email::text, '(okänd e-post)'),
    ur.created_at,
    (u.email_confirmed_at IS NOT NULL),
    (ur.user_id = auth.uid())
  FROM public.user_roles AS ur
  LEFT JOIN auth.users AS u ON u.id = ur.user_id
  WHERE ur.role = 'admin'::public.app_role
  ORDER BY ur.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_role(target_email text)
RETURNS TABLE (user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user auth.users%ROWTYPE;
  normalized_email text := lower(trim(target_email));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Endast administratörer får hantera behörigheter.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target_user
  FROM auth.users
  WHERE lower(auth.users.email) = normalized_email
  LIMIT 1;

  IF target_user.id IS NULL THEN
    RAISE EXCEPTION 'Inget registrerat konto hittades för denna e-postadress.' USING ERRCODE = 'P0002';
  END IF;

  IF target_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Kontot måste bekräfta sin e-postadress först.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user.id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN QUERY SELECT target_user.id, target_user.email::text;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Endast administratörer får hantera behörigheter.' USING ERRCODE = '42501';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Du kan inte ta bort dig själv.' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin'::public.app_role;

  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Det måste finnas minst en administratör.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
    AND role = 'admin'::public.app_role;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revoke_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid) TO authenticated;