import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { StoredImage } from "@/components/StoredImage";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration – Casa Nostra Kjula" },
      { name: "description", content: "Redigera menyer, priser och bilder för Casa Nostra Kjula." },
      { property: "og:title", content: "Administration – Casa Nostra Kjula" },
      { property: "og:description", content: "Redigera menyer och bilder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};
type Item = {
  id: string;
  category_id: string;
  item_number: string | null;
  name: string;
  description: string | null;
  price: number | null;
  price_large: number | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};
type Gallery = { id: string; image_url: string; caption: string | null; sort_order: number };
type News = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  is_published: boolean;
};

type Tab = "meny" | "galleri" | "nyheter";

const input =
  "w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const btn = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground";
const ghost = "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground";

async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("menu-media").upload(path, file, {
    cacheControl: "300",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

function AdminPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "no-admin">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [tab, setTab] = useState<Tab>("meny");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, i, g, n] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
      supabase.from("gallery_images").select("*").order("sort_order"),
      supabase.from("news_posts").select("*").order("published_at", { ascending: false }),
    ]);
    setNews((n.data ?? []) as News[]);
    setCategories((c.data ?? []) as Category[]);
    setItems((i.data ?? []) as Item[]);
    setGallery((g.data ?? []) as Gallery[]);
    setActiveCategory((prev) => prev ?? (c.data?.[0]?.id ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
      let { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (!roles?.length) {
        const { data: claimed } = await supabase.rpc("claim_first_admin");
        if (claimed) {
          const again = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);
          roles = again.data;
        }
      }
      if (!roles?.length) {
        setStatus("no-admin");
        return;
      }
      await load();
      setStatus("ready");
    })();
  }, [navigate, load]);

  async function run(fn: () => PromiseLike<{ error: unknown } | void> | Promise<void>) {
    setError(null);
    try {
      const res = await fn();
      if (res && "error" in res && res.error) throw res.error;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte spara ändringen.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (status === "loading") {
    return <main className="p-10 text-muted-foreground">Laddar…</main>;
  }

  if (status === "no-admin") {
    return (
      <main className="mx-auto max-w-lg p-10">
        <h1 className="font-[var(--serif)] text-4xl">Inget ägarkonto</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Kontot {email} saknar behörighet att redigera innehållet. Be en befintlig ägare att ge dig
          åtkomst.
        </p>
        <button onClick={signOut} className={`${ghost} mt-6`}>
          Logga ut
        </button>
      </main>
    );
  }

  const catItems = items.filter((i) => i.category_id === activeCategory);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Casa Nostra</p>
          <h1 className="font-[var(--serif)] text-4xl">Administration</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/">Visa sidan</Link>
          <button onClick={signOut} className={ghost}>
            Logga ut
          </button>
        </div>
      </header>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      <nav className="mt-8 flex gap-2">
        {([
          ["meny", "Meny"],
          ["galleri", "Galleri"],
          ["nyheter", "Nyheter"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? btn : ghost} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "meny" && (<>
      {/* Menygrupper */}
      <section className="mt-10">
        <h2 className="font-[var(--serif)] text-2xl">Menygrupper</h2>
        <div className="mt-4 flex flex-col gap-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_2fr_80px_auto]">
                <input
                  className={input}
                  defaultValue={c.name}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("menu_categories")
                        .update({ name: e.target.value })
                        .eq("id", c.id),
                    )
                  }
                />
                <input
                  className={input}
                  placeholder="Beskrivning"
                  defaultValue={c.description ?? ""}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("menu_categories")
                        .update({ description: e.target.value })
                        .eq("id", c.id),
                    )
                  }
                />
                <input
                  className={input}
                  type="number"
                  defaultValue={c.sort_order}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("menu_categories")
                        .update({ sort_order: Number(e.target.value) })
                        .eq("id", c.id),
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <button
                    className={activeCategory === c.id ? btn : ghost}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    Rätter ({items.filter((i) => i.category_id === c.id).length})
                  </button>
                  <button
                    className={ghost}
                    onClick={() => {
                      if (confirm(`Ta bort ${c.name} och alla dess rätter?`))
                        run(() => supabase.from("menu_categories").delete().eq("id", c.id));
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <StoredImage
                  path={c.image_url}
                  alt={c.name}
                  className="h-14 w-20 rounded object-cover"
                />
                <label className={`${ghost} cursor-pointer`}>
                  Byt bild
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      run(async () => {
                        const path = await uploadFile(file);
                        return supabase
                          .from("menu_categories")
                          .update({ image_url: path })
                          .eq("id", c.id);
                      });
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          className={`${btn} mt-4`}
          onClick={() =>
            run(() =>
              supabase.from("menu_categories").insert({
                name: "Ny grupp",
                sort_order: categories.length + 1,
              }),
            )
          }
        >
          + Ny menygrupp
        </button>
      </section>

      {/* Rätter */}
      {activeCategory && (
        <section className="mt-14">
          <h2 className="font-[var(--serif)] text-2xl">
            Rätter i {categories.find((c) => c.id === activeCategory)?.name}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {catItems.map((it) => (
              <div key={it.id} className="rounded-lg border border-border p-4">
                <div className="grid gap-3 md:grid-cols-[70px_1fr_90px_90px_70px]">
                  <input
                    className={input}
                    placeholder="Nr"
                    defaultValue={it.item_number ?? ""}
                    onBlur={(e) =>
                      run(() =>
                        supabase
                          .from("menu_items")
                          .update({ item_number: e.target.value })
                          .eq("id", it.id),
                      )
                    }
                  />
                  <input
                    className={input}
                    defaultValue={it.name}
                    onBlur={(e) =>
                      run(() =>
                        supabase.from("menu_items").update({ name: e.target.value }).eq("id", it.id),
                      )
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    placeholder="Pris"
                    defaultValue={it.price ?? ""}
                    onBlur={(e) =>
                      run(() =>
                        supabase
                          .from("menu_items")
                          .update({ price: e.target.value === "" ? null : Number(e.target.value) })
                          .eq("id", it.id),
                      )
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    placeholder="Familj"
                    defaultValue={it.price_large ?? ""}
                    onBlur={(e) =>
                      run(() =>
                        supabase
                          .from("menu_items")
                          .update({
                            price_large: e.target.value === "" ? null : Number(e.target.value),
                          })
                          .eq("id", it.id),
                      )
                    }
                  />
                  <input
                    className={input}
                    type="number"
                    defaultValue={it.sort_order}
                    onBlur={(e) =>
                      run(() =>
                        supabase
                          .from("menu_items")
                          .update({ sort_order: Number(e.target.value) })
                          .eq("id", it.id),
                      )
                    }
                  />
                </div>
                <textarea
                  className={`${input} mt-3`}
                  rows={2}
                  placeholder="Innehåll"
                  defaultValue={it.description ?? ""}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("menu_items")
                        .update({ description: e.target.value })
                        .eq("id", it.id),
                    )
                  }
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StoredImage
                    path={it.image_url}
                    alt={it.name}
                    className="h-14 w-20 rounded object-cover"
                  />
                  <label className={`${ghost} cursor-pointer`}>
                    Byt bild
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        run(async () => {
                          const path = await uploadFile(file);
                          return supabase
                            .from("menu_items")
                            .update({ image_url: path })
                            .eq("id", it.id);
                        });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      defaultChecked={it.is_available}
                      onChange={(e) =>
                        run(() =>
                          supabase
                            .from("menu_items")
                            .update({ is_available: e.target.checked })
                            .eq("id", it.id),
                        )
                      }
                    />
                    Visas på sidan
                  </label>
                  <button
                    className={ghost}
                    onClick={() => {
                      if (confirm(`Ta bort ${it.name}?`))
                        run(() => supabase.from("menu_items").delete().eq("id", it.id));
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className={`${btn} mt-4`}
            onClick={() =>
              run(() =>
                supabase.from("menu_items").insert({
                  category_id: activeCategory,
                  name: "Ny rätt",
                  sort_order: catItems.length + 1,
                }),
              )
            }
          >
            + Ny rätt
          </button>
        </section>
      )}

      </>)}

      {tab === "galleri" && (
      <section className="mt-10 pb-20">
        <h2 className="font-[var(--serif)] text-2xl">Galleri</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {gallery.map((g) => (
            <div key={g.id} className="rounded-lg border border-border p-3">
              <StoredImage
                path={g.image_url}
                alt={g.caption ?? "Galleribild"}
                className="h-36 w-full rounded object-cover"
              />
              <input
                className={`${input} mt-3`}
                placeholder="Bildtext"
                defaultValue={g.caption ?? ""}
                onBlur={(e) =>
                  run(() =>
                    supabase
                      .from("gallery_images")
                      .update({ caption: e.target.value })
                      .eq("id", g.id),
                  )
                }
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  className={input}
                  type="number"
                  defaultValue={g.sort_order}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("gallery_images")
                        .update({ sort_order: Number(e.target.value) })
                        .eq("id", g.id),
                    )
                  }
                />
                <button
                  className={ghost}
                  onClick={() => {
                    if (confirm("Ta bort bilden?"))
                      run(() => supabase.from("gallery_images").delete().eq("id", g.id));
                  }}
                >
                  Ta bort
                </button>
              </div>
            </div>
          ))}
        </div>
        <label className={`${btn} mt-4 inline-block cursor-pointer`}>
          + Ladda upp bild
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              run(async () => {
                const path = await uploadFile(file);
                return supabase
                  .from("gallery_images")
                  .insert({ image_url: path, sort_order: gallery.length + 1 });
              });
            }}
          />
        </label>
      </section>
      )}

      {tab === "nyheter" && (
      <section className="mt-10 pb-20">
        <h2 className="font-[var(--serif)] text-2xl">Nyhetsinlägg</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          De tre senaste publicerade inläggen visas på startsidan.
        </p>
        <button
          className={`${btn} mt-4`}
          onClick={() =>
            run(() =>
              supabase.from("news_posts").insert({ title: "Nytt inlägg", body: "", is_published: false }),
            )
          }
        >
          + Nytt inlägg
        </button>
        <div className="mt-6 flex flex-col gap-5">
          {news.map((n) => (
            <article key={n.id} className="rounded-lg border border-border p-4">
              <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                <input
                  className={input}
                  placeholder="Rubrik"
                  defaultValue={n.title}
                  onBlur={(e) =>
                    run(() => supabase.from("news_posts").update({ title: e.target.value }).eq("id", n.id))
                  }
                />
                <input
                  className={input}
                  type="date"
                  defaultValue={n.published_at.slice(0, 10)}
                  onBlur={(e) =>
                    run(() =>
                      supabase
                        .from("news_posts")
                        .update({ published_at: new Date(e.target.value).toISOString() })
                        .eq("id", n.id),
                    )
                  }
                />
              </div>

              <div className="mt-3">
                <RichTextEditor
                  value={draft[n.id] ?? n.body ?? ""}
                  onChange={(html) => setDraft((d) => ({ ...d, [n.id]: html }))}
                />
                <button
                  className={`${btn} mt-3`}
                  onClick={() =>
                    run(async () => {
                      const html = draft[n.id] ?? n.body ?? "";
                      return supabase.from("news_posts").update({ body: html }).eq("id", n.id);
                    })
                  }
                >
                  Spara text
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StoredImage
                  path={n.image_url}
                  alt={n.title}
                  className="h-16 w-24 rounded object-cover"
                />
                <label className={`${ghost} cursor-pointer`}>
                  {n.image_url ? "Byt bild" : "Ladda upp bild"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      run(async () => {
                        const path = await uploadFile(file);
                        return supabase.from("news_posts").update({ image_url: path }).eq("id", n.id);
                      });
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    defaultChecked={n.is_published}
                    onChange={(e) =>
                      run(() =>
                        supabase
                          .from("news_posts")
                          .update({ is_published: e.target.checked })
                          .eq("id", n.id),
                      )
                    }
                  />
                  Publicerat
                </label>
                <button
                  className={ghost}
                  onClick={() => {
                    if (confirm(`Ta bort inlägget "${n.title}"?`))
                      run(() => supabase.from("news_posts").delete().eq("id", n.id));
                  }}
                >
                  Ta bort
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}
    </main>
  );
}
