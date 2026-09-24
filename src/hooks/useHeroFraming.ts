import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Framing } from "@/components/AdjustableImage";

export type HeroFraming = {
  bgX: number;
  bgY: number;
  bgZoom: number;
  cardX: number;
  cardY: number;
  cardZoom: number;
};

export const DEFAULT_HERO_FRAMING: HeroFraming = {
  bgX: 50,
  bgY: 50,
  bgZoom: 105,
  cardX: 50,
  cardY: 50,
  cardZoom: 100,
};

const SETTING_KEY = "hero_image_framing";

const toNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const parse = (raw: unknown): HeroFraming => {
  const v = (raw ?? {}) as Record<string, unknown>;
  return {
    bgX: toNumber(v.bgX, DEFAULT_HERO_FRAMING.bgX),
    bgY: toNumber(v.bgY, DEFAULT_HERO_FRAMING.bgY),
    bgZoom: toNumber(v.bgZoom, DEFAULT_HERO_FRAMING.bgZoom),
    cardX: toNumber(v.cardX, DEFAULT_HERO_FRAMING.cardX),
    cardY: toNumber(v.cardY, DEFAULT_HERO_FRAMING.cardY),
    cardZoom: toNumber(v.cardZoom, DEFAULT_HERO_FRAMING.cardZoom),
  };
};

export const useHeroFraming = () => {
  const [framing, setFraming] = useState<HeroFraming>(DEFAULT_HERO_FRAMING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (!mounted) return;
      if (error) console.error("Error loading hero framing", error);
      if (data?.value) setFraming(parse(data.value));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const save = useCallback(async (next: HeroFraming) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: SETTING_KEY, value: next, updated_at: new Date().toISOString() });
    if (error) throw error;
  }, []);

  return { framing, setFraming, loading, save };
};

export const bgFraming = (f: HeroFraming): Framing => ({ x: f.bgX, y: f.bgY, zoom: f.bgZoom });
export const cardFraming = (f: HeroFraming): Framing => ({ x: f.cardX, y: f.cardY, zoom: f.cardZoom });
