import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type MenuItem = {
  id: string;
  item_number: string | null;
  name: string;
  description: string | null;
  price: number | null;
  price_large: number | null;
  image_url: string | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  items: MenuItem[];
};

export type GalleryImage = { id: string; image_url: string; caption: string | null };

export type NewsPost = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
};

function publicClient() {
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env["SUPABASE_URL"] || import.meta.env['VITE_SUPABASE_URL'];
  if (!key || !url) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const empty = { categories: [] as MenuCategory[], gallery: [] as GalleryImage[] };
  if (!supabase) return empty;

  try {
  const [categoriesRes, itemsRes, galleryRes] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, description, image_url, sort_order")
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, item_number, name, description, price, price_large, image_url, sort_order",
      )
      .eq("is_available", true)
      .order("sort_order"),
    supabase.from("gallery_images").select("id, image_url, caption, sort_order").order("sort_order"),
  ]);

  const items = itemsRes.data ?? [];
  const categories: MenuCategory[] = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    image_url: c.image_url,
    items: items
      .filter((i) => i.category_id === c.id)
      .map((i) => ({
        id: i.id,
        item_number: i.item_number,
        name: i.name,
        description: i.description,
        price: i.price === null ? null : Number(i.price),
        price_large: i.price_large === null ? null : Number(i.price_large),
        image_url: i.image_url,
      })),
  }));

  const gallery: GalleryImage[] = (galleryRes.data ?? []).map((g) => ({
    id: g.id,
    image_url: g.image_url,
    caption: g.caption,
  }));

  return { categories, gallery };
  } catch {
    return empty;
  }
});
