import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoPrime11 from "@/assets/logo-prime11.png.asset.json";

export type LogoPlacement = { size: number; x: number; y: number };
export type LogoDevice = "mobile" | "tablet" | "desktop";
export type SiteLogo = {
  url: string;
  mobile: LogoPlacement;
  tablet: LogoPlacement;
  desktop: LogoPlacement;
};

const DEFAULT_PLACEMENT: LogoPlacement = { size: 100, x: 0, y: 0 };
export const DEFAULT_SITE_LOGO: SiteLogo = {
  url: "",
  mobile: { ...DEFAULT_PLACEMENT },
  tablet: { ...DEFAULT_PLACEMENT },
  desktop: { ...DEFAULT_PLACEMENT },
};
export const FALLBACK_LOGO_URL = logoPrime11.url;
const KEY = "site_logo";

let current: SiteLogo = DEFAULT_SITE_LOGO;
let loaded = false;
const listeners = new Set<(l: SiteLogo) => void>();

const emit = (l: SiteLogo) => {
  current = l;
  listeners.forEach((fn) => fn(l));
};

const normalizeLogo = (value: unknown): SiteLogo => {
  if (!value || typeof value !== "object") return DEFAULT_SITE_LOGO;
  const stored = value as Partial<SiteLogo> & Partial<LogoPlacement>;
  const legacyPlacement: LogoPlacement = {
    size: typeof stored.size === "number" ? stored.size : 100,
    x: typeof stored.x === "number" ? stored.x : 0,
    y: typeof stored.y === "number" ? stored.y : 0,
  };
  const placement = (candidate?: Partial<LogoPlacement>): LogoPlacement => ({
    size: typeof candidate?.size === "number" ? candidate.size : legacyPlacement.size,
    x: typeof candidate?.x === "number" ? candidate.x : legacyPlacement.x,
    y: typeof candidate?.y === "number" ? candidate.y : legacyPlacement.y,
  });
  return {
    url: typeof stored.url === "string" ? stored.url : "",
    mobile: placement(stored.mobile),
    tablet: placement(stored.tablet),
    desktop: placement(stored.desktop),
  };
};

const load = async () => {
  if (loaded) return;
  loaded = true;
  const { data } = await supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle();
  if (data?.value) emit(normalizeLogo(data.value));
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
