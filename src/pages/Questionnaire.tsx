import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { Navigate } from "react-router-dom";

const Questionnaire = () => {
  const { user, role } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fatigue, setFatigue] = useState([5]);
  const [musclePain, setMusclePain] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [confidence, setConfidence] = useState([5]);
  const [motivation, setMotivation] = useState([5]);
  const [minutesPlayed, setMinutesPlayed] = useState(0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: current } = await supabase
      .from("weekly_questionnaires")
      .select("*")
      .eq("player_id", user.id)
      .eq("week_start", weekStartStr)
      .maybeSingle();
    setExisting(current);

    const { data: hist } = await supabase
      .from("weekly_questionnaires")
      .select("*")
      .eq("player_id", user.id)
      .order("week_start", { ascending: false })
      .limit(10);
    setHistory(hist || []);
  };

  if (role !== "player") return <Navigate to="/dashboard" replace />;

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("weekly_questionnaires").insert({
        player_id: user.id,
        fatigue: fatigue[0],
        muscle_pain: musclePain[0],
        sleep_quality: sleepQuality[0],
        confidence: confidence[0],
        motivation: motivation[0],
        minutes_played: minutesPlayed,
        week_start: weekStartStr,
      });
      if (error) throw error;
      toast.success("Questionário enviado!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sliderField = (label: string, value: number[], onChange: (v: number[]) => void) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Badge variant="outline">{value[0]}/10</Badge>
      </div>
      <Slider value={value} onValueChange={onChange} min={1} max={10} step={1} />
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questionário Semanal</h1>
          <p className="text-muted-foreground mt-1">
            Semana de {format(weekStart, "d 'de' MMMM", { locale: pt })}
          </p>
        </div>

        {existing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                Questionário Respondido
                <Badge variant="secondary">✓</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Fadiga</p>
                  <p className="text-lg font-bold text-foreground">{existing.fatigue}/10</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Dor Muscular</p>
                  <p className="text-lg font-bold text-foreground">{existing.muscle_pain}/10</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Qualidade do Sono</p>
                  <p className="text-lg font-bold text-foreground">{existing.sleep_quality}/10</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Confiança</p>
                  <p className="text-lg font-bold text-foreground">{existing.confidence}/10</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Motivação</p>
                  <p className="text-lg font-bold text-foreground">{existing.motivation}/10</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Minutos Jogados</p>
                  <p className="text-lg font-bold text-foreground">{existing.minutes_played}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preencher Questionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sliderField("Fadiga", fatigue, setFatigue)}
              {sliderField("Dor Muscular", musclePain, setMusclePain)}
              {sliderField("Qualidade do Sono", sleepQuality, setSleepQuality)}
              {sliderField("Confiança", confidence, setConfidence)}
              {sliderField("Motivação", motivation, setMotivation)}

              <div className="space-y-2">
                <Label>Minutos jogados no fim de semana</Label>
                <Input
                  type="number"
                  value={minutesPlayed}
                  onChange={(e) => setMinutesPlayed(parseInt(e.target.value) || 0)}
                  min={0}
                  className="bg-background"
                />
              </div>

              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting ? "A enviar..." : "Enviar Questionário"}
              </Button>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                    <span className="text-sm text-foreground">
                      Semana de {format(new Date(q.week_start), "d MMM yyyy", { locale: pt })}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">Fadiga: {q.fatigue}</Badge>
                      <Badge variant="outline">Motivação: {q.motivation}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Questionnaire;
