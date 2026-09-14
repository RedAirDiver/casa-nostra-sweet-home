import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const baseUrl = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!baseUrl || !key) return new Response("Not configured", { status: 500 });

        const upstream = await fetch(
          `${baseUrl}/storage/v1/object/menu-media/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          { headers: { apikey: key } },
        );

        if (!upstream.ok) {
          return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
        }

        return new Response(upstream.body, {
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
