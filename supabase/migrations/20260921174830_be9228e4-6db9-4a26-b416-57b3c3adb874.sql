CREATE UNIQUE INDEX account_directory_email_unique_idx
  ON public.account_directory (lower(email));

DROP POLICY "Admins remove other roles" ON public.user_roles;
CREATE POLICY "Admins remove other roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND user_id <> auth.uid()
  );