DROP POLICY IF EXISTS "Published news are public" ON public.news_posts;

CREATE POLICY "Published news are public"
ON public.news_posts FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Admins can read all news"
ON public.news_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));