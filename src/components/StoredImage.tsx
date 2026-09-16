import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  path: string | null | undefined;
  alt: string;
  className?: string;
};

/** Visar en bild från menu-media (privat bucket) via signerad URL. */
export function StoredImage({ path, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setSrc(null);
      return;
    }
    if (/^https?:\/\//i.test(path) || path.startsWith("/")) {
      setSrc(path);
      return;
    }
    supabase.storage
      .from("menu-media")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active) setSrc(data?.signedUrl ?? `/api/public/media/${path}`);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
