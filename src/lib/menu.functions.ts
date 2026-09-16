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
  const empty = {
    categories: [] as MenuCategory[],
    gallery: [] as GalleryImage[],
    news: [] as NewsPost[],
  };
  if (!supabase) return empty;

  try {
  const [categoriesRes, itemsRes, galleryRes, newsRes] = await Promise.all([
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
    supabase
      .from("news_posts")
      .select("id, title, body, image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),
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

  const news: NewsPost[] = (newsRes.data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    image_url: n.image_url,
    published_at: n.published_at,
  }));

  // Bucket is private: turn storage paths into signed URLs so images load everywhere.
  const isStoragePath = (v: string | null) =>
    Boolean(v) && !/^https?:\/\//i.test(v!) && !v!.startsWith("/");
  const paths = new Set<string>();
  for (const c of categories) {
    if (isStoragePath(c.image_url)) paths.add(c.image_url!);
    for (const i of c.items) if (isStoragePath(i.image_url)) paths.add(i.image_url!);
  }
  for (const g of gallery) if (isStoragePath(g.image_url)) paths.add(g.image_url);
  for (const n of news) if (isStoragePath(n.image_url)) paths.add(n.image_url!);

  if (paths.size > 0) {
    const signedMap = new Map<string, string>();
    const { data: signed } = await supabase.storage
      .from("menu-media")
      .createSignedUrls([...paths], 60 * 60 * 24 * 7);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    }
    const sign = (v: string | null) => (v && signedMap.get(v)) || v;
    for (const c of categories) {
      c.image_url = sign(c.image_url);
      for (const i of c.items) i.image_url = sign(i.image_url);
    }
    for (const g of gallery) g.image_url = sign(g.image_url) ?? g.image_url;
    for (const n of news) n.image_url = sign(n.image_url);
  }

  return { categories, gallery, news };
  } catch {
    return empty;
  }
});
