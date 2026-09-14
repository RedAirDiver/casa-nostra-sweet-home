CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu categories are public" ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage menu categories" ON public.menu_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  item_number text,
  name text NOT NULL,
  description text,
  price numeric(10,2),
  price_large numeric(10,2),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_items_category_idx ON public.menu_items(category_id, sort_order);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu items are public" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage menu items" ON public.menu_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery is public" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage gallery" ON public.gallery_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.menu_categories (id, name, description, sort_order) VALUES
  ('11111111-1111-4111-8111-000000000001', 'Pizzor', 'Tomatsås & mozzarella ingår i samtliga pizzor. Glutenfri botten 45:- · Vegan mozzarella 25:- · Familjepizza x3', 1),
  ('11111111-1111-4111-8111-000000000002', 'Pasta', 'Färsk pasta lagad på plats', 2),
  ('11111111-1111-4111-8111-000000000003', 'Sallader', 'Serveras med bröd och dressing', 3),
  ('11111111-1111-4111-8111-000000000004', 'Kebab & grill', 'Serveras med pommes, sallad och sås', 4),
  ('11111111-1111-4111-8111-000000000005', 'À la carte', 'Husets specialiteter', 5),
  ('11111111-1111-4111-8111-000000000006', 'Dryck', 'Öl, vin & alkoholfritt', 6);

INSERT INTO public.menu_items (category_id, item_number, name, description, price, price_large, sort_order) VALUES
  ('11111111-1111-4111-8111-000000000001', '1', 'Pizza ala Vegetariana', 'Utan tomatsås med grönpesto & buffelmozzarella, färska champinjoner, oliver, marinerad kronärtskocka, soltorkade tomater, basilika', 165, 170, 1),
  ('11111111-1111-4111-8111-000000000001', '2', 'Pizza con Parma', 'Prosciutto, chèvreost, valnötter, ruccola, honungsmelon', 165, 170, 2),
  ('11111111-1111-4111-8111-000000000001', '3', 'Pizza con Salami', 'Salami Milano, salami spinaccchi Calabra, spenat, parmesan', 165, 170, 3),
  ('11111111-1111-4111-8111-000000000001', '04', 'Vesuvio', 'Skinka', 140, 145, 4),
  ('11111111-1111-4111-8111-000000000001', '05', 'Calzone (inbakad)', 'Skinka', 140, 145, 5),
  ('11111111-1111-4111-8111-000000000001', '06', 'Capricciosa', 'Skinka, färska champinjoner', 140, 145, 6),
  ('11111111-1111-4111-8111-000000000001', '07', 'Hawaii', 'Skinka, ananas', 140, 145, 7),
  ('11111111-1111-4111-8111-000000000001', '08', 'La Bussola', 'Skinka, räkor', 140, 145, 8),
  ('11111111-1111-4111-8111-000000000001', '09', 'Altono', 'Lök, tonfisk, oliver', 140, 145, 9),
  ('11111111-1111-4111-8111-000000000001', '10', 'Mamma Mia', 'Aubergine, köttfärssås, tomater, fetaost, ruccola', 150, 155, 10),
  ('11111111-1111-4111-8111-000000000001', '11', 'Sunshine', 'Kycklingfilé, ananas, cashewnötter, banan, curry', 150, 155, 11);