import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type CoverSettings = { height: number; x: number; y: number; zoom: number; overlay: number };
export const DEFAULT_COVER: CoverSettings = { height: 60, x: 50, y: 50, zoom: 100, overlay: 55 };
const KEY = "event_covers";
type CoverMap = Record<string, Partial<CoverSettings>>;

export const useEventCovers = () => {
  const [map, setMap] = useState<CoverMap>({});
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle()
      .then(({ data }) => setMap((data?.value ?? {}) as CoverMap));
  }, []);
  const get = (id: string): CoverSettings => ({ ...DEFAULT_COVER, ...(map[id] ?? {}) });
  const save = async (id: string, c: CoverSettings) => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle();
    const next = { ...((data?.value ?? {}) as CoverMap), [id]: c };
    const { error } = await supabase.from("site_settings").upsert({ key: KEY, value: next as unknown as Json, updated_at: new Date().toISOString() });
    if (error) throw error;
    setMap(next);
  };
  return { get, save };
};
