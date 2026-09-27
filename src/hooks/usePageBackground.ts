import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type PageBackground = {
  url: string;
  x: number;
  y: number;
  zoom: number;
  overlay: number; // 0-95 (%)
  blur: number; // 0-16 (px)
  grayscale: boolean;
  vignette: boolean;
};

export const DEFAULT_PAGE_BACKGROUND: PageBackground = {
  url: "",
  x: 50,
  y: 50,
  zoom: 100,
  overlay: 65,
  blur: 0,
  grayscale: false,
  vignette: true,
};

const SETTING_KEY = "page_backgrounds";

type BackgroundMap = Record<string, PageBackground>;

const mergeOne = (raw: unknown): PageBackground => ({
  ...DEFAULT_PAGE_BACKGROUND,
  ...((raw ?? {}) as Partial<PageBackground>),
});

export const usePageBackground = (pageKey: string) => {
  const [background, setBackground] = useState<PageBackground | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (!mounted) return;
      const map = (data?.value ?? {}) as BackgroundMap;
      const entry = map?.[pageKey];
      setBackground(entry ? mergeOne(entry) : null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [pageKey]);

  const save = useCallback(
    async (next: PageBackground | null) => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      const map = { ...((data?.value ?? {}) as BackgroundMap) };
      if (next) map[pageKey] = next;
      else delete map[pageKey];

      const { error } = await supabase.from("site_settings").upsert({
        key: SETTING_KEY,
        value: map as unknown as Json,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    [pageKey],
  );

  return { background, setBackground, loading, save };
};
