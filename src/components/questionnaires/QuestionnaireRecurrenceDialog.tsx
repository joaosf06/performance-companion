import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Recurrence = "none" | "daily" | "weekly" | "monthly";

interface Athlete {
  athlete_id: string;
  full_name: string;
  short_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaireId: string | null;
  athletes: Athlete[];
}

const WEEKDAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

function computeNextRun(rec: Recurrence, day: number | null, hour: number): Date | null {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(hour);

  if (rec === "daily") {
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  if (rec === "weekly") {
    const target = day ?? 1;
    const cur = next.getUTCDay();
    let diff = (target - cur + 7) % 7;
    if (diff === 0 && next <= now) diff = 7;
    next.setUTCDate(next.getUTCDate() + diff);
    return next;
  }
  if (rec === "monthly") {
    const target = Math.min(Math.max(day ?? 1, 1), 28);
    next.setUTCDate(target);
    if (next <= now) {
      next.setUTCMonth(next.getUTCMonth() + 1);
      next.setUTCDate(target);
    }
    return next;
  }
  return null;
}

export default function QuestionnaireRecurrenceDialog({ open, onOpenChange, questionnaireId, athletes }: Props) {
  const { user } = useAuth();
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [day, setDay] = useState<number>(1);
  const [hour, setHour] = useState<number>(9);
  const [active, setActive] = useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !questionnaireId) return;
    setLoading(true);
    (async () => {
      const [qRes, aRes] = await Promise.all([
        supabase.from("custom_questionnaires").select("*").eq("id", questionnaireId).maybeSingle(),
        supabase.from("questionnaire_recurrence_athletes").select("athlete_id").eq("questionnaire_id", questionnaireId),
      ]);
      const q: any = qRes.data;
      if (q) {
        setRecurrence((q.recurrence as Recurrence) || "none");
        setDay(q.recurrence_day ?? 1);
        setHour(q.recurrence_hour ?? 9);
        setActive(q.recurrence_active ?? false);
      }
      setSelected((aRes.data || []).map((r: any) => r.athlete_id));
      setLoading(false);
    })();
  }, [open, questionnaireId]);

  const toggleAthlete = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (!questionnaireId || !user) return;
    if (active && recurrence === "none") {
      toast.error("Escolhe uma frequência ou desativa o envio automático");
      return;
    }
    if (active && selected.length === 0) {
      toast.error("Seleciona pelo menos um atleta para o envio automático");
      return;
    }
    setSaving(true);
    try {
      const nextRun = active ? computeNextRun(recurrence, day, hour) : null;

      const { error: qErr } = await supabase
        .from("custom_questionnaires")
        .update({
          recurrence,
          recurrence_day: recurrence === "daily" ? null : day,
          recurrence_hour: hour,
          recurrence_active: active,
          next_run_at: nextRun?.toISOString() ?? null,
        })
        .eq("id", questionnaireId);
      if (qErr) throw qErr;

      // Replace recurrence athletes
      await supabase.from("questionnaire_recurrence_athletes").delete().eq("questionnaire_id", questionnaireId);
      if (selected.length > 0) {
        const { error: insErr } = await supabase
          .from("questionnaire_recurrence_athletes")
          .insert(selected.map((athlete_id) => ({ questionnaire_id: questionnaireId, athlete_id })));
        if (insErr) throw insErr;
      }

      toast.success(active ? "Envio automático configurado!" : "Envio automático desativado");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envio Automático</DialogTitle>
          <DialogDescription>
            Configura para enviar este questionário automaticamente aos atletas escolhidos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-md bg-secondary p-3">
              <div>
                <Label className="text-sm font-medium">Envio automático ativo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Liga para começar o envio recorrente
                </p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem recorrência</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrence === "weekly" && (
              <div className="space-y-2">
                <Label>Dia da semana</Label>
                <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recurrence === "monthly" && (
              <div className="space-y-2">
                <Label>Dia do mês (1-28)</Label>
                <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recurrence !== "none" && (
              <div className="space-y-2">
                <Label>Hora (UTC)</Label>
                <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Atletas que recebem ({selected.length})</Label>
              {athletes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Não tens atletas associados.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {athletes.map((a) => (
                    <div
                      key={a.athlete_id}
                      onClick={() => toggleAthlete(a.athlete_id)}
                      className="flex items-center gap-3 rounded-md bg-secondary p-2 cursor-pointer hover:bg-accent"
                    >
                      <Checkbox checked={selected.includes(a.athlete_id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.full_name}</p>
                        <p className="text-xs text-muted-foreground">#{a.short_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
