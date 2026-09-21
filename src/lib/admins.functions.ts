import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Endast administratörer får hantera behörigheter.");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw error;
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byId = new Map((users?.users ?? []).map((u) => [u.id, u]));
    return (roles ?? []).map((r) => ({
      user_id: r.user_id,
      created_at: r.created_at,
      email: byId.get(r.user_id)?.email ?? "(okänd e-post)",
      confirmed: Boolean(byId.get(r.user_id)?.email_confirmed_at),
      isSelf: r.user_id === context.userId,
    }));
  });

export const addAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8).max(72).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const email = data.email.trim().toLowerCase();
    const password = data.password?.trim() || undefined;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = (users?.users ?? []).find((u) => u.email?.toLowerCase() === email);

    let invited = false;
    let created = false;
    if (!user) {
      if (password) {
        const { data: made, error: mkErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (mkErr) throw new Error(`Kunde inte skapa ${email}: ${mkErr.message}`);
        user = made.user;
        created = true;
      } else {
        const { getRequest } = await import("@tanstack/react-start/server");
        const req = getRequest();
        const originHeader =
          req?.headers.get("origin") ??
          (req?.headers.get("referer") ? new URL(req.headers.get("referer")!).origin : null) ??
          (req?.url ? new URL(req.url).origin : null);
        const redirectTo = originHeader ? `${originHeader}/admin` : undefined;
        const { data: inv, error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          redirectTo ? { redirectTo } : undefined,
        );
        if (invErr) throw new Error(`Kunde inte bjuda in ${email}: ${invErr.message}`);
        user = inv.user;
        invited = true;
      }
    } else if (password) {
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      });
      if (updErr) throw new Error(`Kunde inte uppdatera lösenordet: ${updErr.message}`);
      created = true;
    }
    if (!user) throw new Error("Kunde inte skapa användaren.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw error;
    return { ok: true, invited, email };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Du kan inte ta bort dig själv.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) throw new Error("Det måste finnas minst en administratör.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw error;
    return { ok: true };
  });
