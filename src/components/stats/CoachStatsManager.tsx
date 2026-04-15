import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BarChart3, Save } from "lucide-react";
import { toast } from "sonner";
import { ZONE_LABELS } from "./InteractiveBody";

const PREDEFINED_CATEGORIES = [
  { value: "goals", label: "Golos" },
  { value: "assists", label: "Assistências" },
  { value: "passes", label: "Passes" },
  { value: "speed", label: "Velocidade" },
  { value: "strength", label: "Força" },
  { value: "endurance", label: "Resistência" },
  { value: "agility", label: "Agilidade" },
  { value: "shooting", label: "Remate" },
  { value: "defense", label: "Defesa" },
  { value: "custom", label: "Personalizada" },
];

const BODY_ZONE_OPTIONS = [
  { value: "none", label: "Nenhuma" },
  { value: "head", label: "Cabeça" },
  { value: "chest", label: "Peito" },
  { value: "left_arm", label: "Braço Esquerdo" },
  { value: "right_arm", label: "Braço Direito" },
  { value: "torso", label: "Tronco" },
  { value: "left_leg", label: "Perna Esquerda" },
  { value: "right_leg", label: "Perna Direita" },
  { value: "left_foot", label: "Pé Esquerdo" },
  { value: "right_foot", label: "Pé Direito" },
];

interface Stat {
  id?: string;
  metric_name: string;
  metric_value: number;
  category: string;
  body_zone: string;
}

interface CoachStatsManagerProps {
  athleteId: string;
  athleteName: string;
}

const CoachStatsManager = ({ athleteId, athleteName }: CoachStatsManagerProps) => {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New season dialog
  const [newSeasonOpen, setNewSeasonOpen] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("seasons")
      .select("id, name")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSeasons(data || []);
        if (data && data.length > 0 && !selectedSeason) {
          setSelectedSeason(data[0].id);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!selectedSeason || !user) return;
    setLoading(true);
    supabase
      .from("athlete_stats")
      .select("id, metric_name, metric_value, category, body_zone")
      .eq("athlete_id", athleteId)
      .eq("season_id", selectedSeason)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setStats(
          (data || []).map((d) => ({
            id: d.id,
            metric_name: d.metric_name,
            metric_value: Number(d.metric_value),
            category: d.category,
            body_zone: d.body_zone || "",
          }))
        );
        setLoading(false);
      });
  }, [selectedSeason, athleteId, user]);

  const createSeason = async () => {
    if (!newSeasonName.trim() || !user) return;
    const { data, error } = await supabase
      .from("seasons")
      .insert({ name: newSeasonName.trim(), coach_id: user.id })
      .select("id, name")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSeasons((prev) => [data, ...prev]);
    setSelectedSeason(data.id);
    setNewSeasonOpen(false);
    setNewSeasonName("");
    toast.success("Época criada!");
  };

  const addStat = () => {
    setStats((prev) => [
      ...prev,
      { metric_name: "", metric_value: 0, category: "custom", body_zone: "" },
    ]);
  };

  const updateStat = (index: number, field: keyof Stat, value: string | number) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeStat = (index: number) => {
    const stat = stats[index];
    if (stat.id) {
      supabase.from("athlete_stats").delete().eq("id", stat.id).then(({ error }) => {
        if (error) toast.error(error.message);
      });
    }
    setStats((prev) => prev.filter((_, i) => i !== index));
  };

  const saveStats = async () => {
    if (!user || !selectedSeason) return;
    setSaving(true);

    try {
      for (const stat of stats) {
        if (!stat.metric_name.trim()) continue;
        const payload = {
          athlete_id: athleteId,
          coach_id: user.id,
          season_id: selectedSeason,
          metric_name: stat.metric_name,
          metric_value: stat.metric_value,
          category: stat.category,
          body_zone: stat.body_zone && stat.body_zone !== "none" ? stat.body_zone : null,
        };

        if (stat.id) {
          await supabase.from("athlete_stats").update(payload).eq("id", stat.id);
        } else {
          const { data } = await supabase.from("athlete_stats").insert(payload).select("id").single();
          if (data) stat.id = data.id;
        }
      }
      toast.success("Estatísticas guardadas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas — {athleteName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Selecionar época" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setNewSeasonOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedSeason ? (
          <p className="text-sm text-muted-foreground">Cria uma época para começar a adicionar métricas.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : (
          <>
            {stats.map((stat, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={stat.category} onValueChange={(v) => updateStat(i, "category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Métrica</Label>
                  <Input
                    value={stat.metric_name}
                    onChange={(e) => updateStat(i, "metric_name", e.target.value)}
                    placeholder="Ex: Golos com pé direito"
                    className="bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    value={stat.metric_value}
                    onChange={(e) => updateStat(i, "metric_value", Number(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Zona do Corpo</Label>
                  <Select value={stat.body_zone} onValueChange={(v) => updateStat(i, "body_zone", v)}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      {BODY_ZONE_OPTIONS.map((z) => (
                        <SelectItem key={z.value || "none"} value={z.value || "none"}>{z.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => removeStat(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addStat}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar Métrica
              </Button>
              <Button size="sm" onClick={saveStats} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> {saving ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={newSeasonOpen} onOpenChange={setNewSeasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Época</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Época</Label>
              <Input
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Ex: 2024/25"
                className="bg-background"
              />
            </div>
            <Button onClick={createSeason} disabled={!newSeasonName.trim()} className="w-full">
              Criar Época
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CoachStatsManager;
