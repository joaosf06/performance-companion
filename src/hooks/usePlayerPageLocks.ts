import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "player_page_locks";
export type PageLocks = Record<string, boolean>;

export const usePlayerPageLocks = () => {
  const [locks, setLocks] = useState<PageLocks>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setLocks((data?.value as PageLocks) || {});
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = useCallback(
    async (path: string, locked: boolean) => {
      const next = { ...locks, [path]: locked };
      setLocks(next);
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: KEY, value: next, updated_at: new Date().toISOString() });
      if (error) {
        setLocks(locks);
        throw error;
      }
    },
    [locks]
  );

  return { locks, loading, toggle };
};
