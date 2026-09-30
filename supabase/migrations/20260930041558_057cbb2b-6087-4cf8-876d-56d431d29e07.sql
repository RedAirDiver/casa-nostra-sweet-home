CREATE TABLE public.special_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  price text NOT NULL DEFAULT '',
  price_note text,
  body text,
  footnote text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_offers TO authenticated;
GRANT ALL ON public.special_offers TO service_role;
GRANT SELECT ON public.special_offers TO anon;

ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published offers are public"
  ON public.special_offers FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins manage special offers"
  ON public.special_offers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_special_offers_updated_at
  BEFORE UPDATE ON public.special_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.special_offers (label, price, price_note, body, footnote, sort_order, is_published) VALUES
  ('Dagens lunch', '149:-', 'Måndag–fredag kl. 11–14.30', E'Sallad nr 1, 2, 3, 6, 7, 8\nPasta nr 1, 2, 5, 6, 8, 9, 10, 11, 12\nPizzor nr 4–22 & 29', NULL, 1, true),
  ('Kvällsdeal', '209:-', 'Alla dagar 15–19 · äta här', 'Välj mellan utvalda pizzor, pasta eller fläskfilé Oscar – inkl. öl eller vin. Alkoholfritt alternativ finns.', 'Pasta nr 1, 2, 5, 6, 8–12 · Pizzor nr 4–22 & 29', 2, true);