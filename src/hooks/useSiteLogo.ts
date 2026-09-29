import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoPrime11 from "@/assets/logo-prime11.png.asset.json";

export type SiteLogo = { url: string; size: number; x: number; y: number };

export const DEFAULT_SITE_LOGO: SiteLogo = { url: "", size: 100, x: 0, y: 0 };
export const FALLBACK_LOGO_URL = logoPrime11.url;
const KEY = "site_logo";

let current: SiteLogo = DEFAULT_SITE_LOGO;
let loaded = false;
const listeners = new Set<(l: SiteLogo) => void>();

const emit = (l: SiteLogo) => {
  current = l;
  listeners.forEach((fn) => fn(l));
};

const load = async () => {
  if (loaded) return;
  loaded = true;
  const { data } = await supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle();
  if (data?.value) emit({ ...DEFAULT_SITE_LOGO, ...(data.value as Partial<SiteLogo>) });
};

export const setSiteLogoPreview = (l: SiteLogo) => emit(l);

export const saveSiteLogo = async (l: SiteLogo) => {
  const { error } = await supabase.from("site_settings").upsert({
    key: KEY,
    value: l as unknown as import("@/integrations/supabase/types").Json,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  emit(l);
};

export const useSiteLogo = () => {
  const [logo, setLogo] = useState<SiteLogo>(current);
  useEffect(() => {
    listeners.add(setLogo);
    load();
    return () => {
      listeners.delete(setLogo);
    };
  }, []);
  return logo;
};
