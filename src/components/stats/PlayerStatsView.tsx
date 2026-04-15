import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp } from "lucide-react";
import InteractiveBody, { type BodyStat } from "./InteractiveBody";

interface StatRow {
  id: string;
  metric_name: string;
  metric_value: number;
  category: string;
  body_zone: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  goals: "Golos",
  assists: "Assistências",
  passes: "Passes",
  speed: "Velocidade",
  strength: "Força",
  endurance: "Resistência",
  agility: "Agilidade",
  shooting: "Remate",
  defense: "Defesa",
  custom: "Personalizada",
};

const PlayerStatsView = () => {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [stats, setStats] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("seasons")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const s = data || [];
        setSeasons(s);
        if (s.length > 0) setSelectedSeason(s[0].id);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedSeason || !user) return;
    setLoading(true);
    supabase
      .from("athlete_stats")
      .select("id, metric_name, metric_value, category, body_zone")
      .eq("athlete_id", user.id)
      .eq("season_id", selectedSeason)
      .order("category")
      .then(({ data }) => {
        setStats(
          (data || []).map((d) => ({
            ...d,
            metric_value: Number(d.metric_value),
          }))
        );
        setLoading(false);
      });
  }, [selectedSeason, user]);

  const bodyStats: BodyStat[] = stats
    .filter((s) => s.body_zone)
    .map((s) => ({ zone: s.body_zone!, label: s.metric_name, value: s.metric_value }));

  const groupedByCategory = stats.reduce<Record<string, StatRow[]>>((acc, s) => {
    const cat = s.category || "custom";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  if (loading && seasons.length === 0) {
    return null;
  }

  if (seasons.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Ainda não tens estatísticas registadas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          As Minhas Estatísticas
        </h2>
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Época" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : stats.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Sem estatísticas para esta época.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Interactive body */}
          {bodyStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mapa Corporal</CardTitle>
                <p className="text-xs text-muted-foreground">Clica nas zonas para ver detalhes</p>
              </CardHeader>
              <CardContent>
                <InteractiveBody stats={bodyStats} />
              </CardContent>
            </Card>
          )}

          {/* Stats by category */}
          <div className="space-y-4">
            {Object.entries(groupedByCategory).map(([cat, catStats]) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    <Badge variant="outline" className="font-normal">
                      {CATEGORY_LABELS[cat] || cat}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catStats.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                      <span className="text-sm text-foreground">{s.metric_name}</span>
                      <span className="text-lg font-bold text-primary">{s.metric_value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsView;
