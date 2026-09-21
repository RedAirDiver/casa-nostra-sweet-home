DROP FUNCTION IF EXISTS public.admin_list_admins();
DROP FUNCTION IF EXISTS public.admin_grant_role(text);
DROP FUNCTION IF EXISTS public.admin_revoke_role(uuid);

CREATE TABLE public.account_directory (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.account_directory TO authenticated;
GRANT ALL ON public.account_directory TO service_role;
ALTER TABLE public.account_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users register their own account" ON public.account_directory
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE POLICY "Users update their own account" ON public.account_directory
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE POLICY "Users and admins read account directory" ON public.account_directory
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER account_directory_updated_at
  BEFORE UPDATE ON public.account_directory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "Admins add roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove other roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND user_id <> auth.uid()
    AND (SELECT count(*) FROM public.user_roles WHERE role = 'admin') > 1
  );