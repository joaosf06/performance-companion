import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const AthleteProfile = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const { role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);

  if (role !== "coach") return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    if (!athleteId) return;
    const fetch = async () => {
      const [profileRes, reportsRes, questRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", athleteId).maybeSingle(),
        supabase.from("training_reports").select("*").eq("athlete_id", athleteId).order("created_at", { ascending: false }).limit(10),
        supabase.from("weekly_questionnaires").select("*").eq("player_id", athleteId).order("week_start", { ascending: false }).limit(10),
      ]);
      setProfile(profileRes.data);
      setReports(reportsRes.data || []);
      setQuestionnaires(questRes.data || []);
    };
    fetch();
  }, [athleteId]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || "Atleta"}</h1>
          <p className="text-muted-foreground mt-1">Perfil completo do atleta</p>
        </div>

        {/* Questionnaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questionários Semanais</CardTitle>
          </CardHeader>
          <CardContent>
            {questionnaires.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {questionnaires.map((q) => (
                  <div key={q.id} className="rounded-md bg-secondary p-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Semana de {format(new Date(q.week_start), "d MMM yyyy", { locale: pt })}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Fadiga:</span> <span className="text-foreground">{q.fatigue}/10</span></div>
                      <div><span className="text-muted-foreground">Dor:</span> <span className="text-foreground">{q.muscle_pain}/10</span></div>
                      <div><span className="text-muted-foreground">Sono:</span> <span className="text-foreground">{q.sleep_quality}/10</span></div>
                      <div><span className="text-muted-foreground">Confiança:</span> <span className="text-foreground">{q.confidence}/10</span></div>
                      <div><span className="text-muted-foreground">Motivação:</span> <span className="text-foreground">{q.motivation}/10</span></div>
                      <div><span className="text-muted-foreground">Minutos:</span> <span className="text-foreground">{q.minutes_played}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Relatórios de Treino</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem relatórios.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-md bg-secondary p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{r.objective}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">T: {r.technical_score}/10</Badge>
                        <Badge variant="outline">I: {r.intensity_score}/10</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "d MMM yyyy", { locale: pt })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AthleteProfile;
