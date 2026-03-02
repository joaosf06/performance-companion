import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardList, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

const PlayerDashboard = () => {
  const { user, profile } = useAuth();
  const [lastReport, setLastReport] = useState<any>(null);
  const [hasPendingQuestionnaire, setHasPendingQuestionnaire] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Last report
      const { data: report } = await supabase
        .from("training_reports")
        .select("*")
        .eq("athlete_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastReport(report);

      // Report count
      const { count } = await supabase
        .from("training_reports")
        .select("*", { count: "exact", head: true })
        .eq("athlete_id", user.id);
      setReportCount(count || 0);

      // Check pending questionnaire
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { data: questionnaire } = await supabase
        .from("weekly_questionnaires")
        .select("id")
        .eq("player_id", user.id)
        .eq("week_start", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();
      setHasPendingQuestionnaire(!questionnaire);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.full_name || "Jogador"}
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao teu painel de treino.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Pending Questionnaire */}
        <Link to="/questionnaire">
          <Card className={`cursor-pointer transition-all hover:border-primary/50 ${hasPendingQuestionnaire ? 'border-primary/30' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Questionário</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {hasPendingQuestionnaire ? (
                <Badge variant="default" className="bg-primary text-primary-foreground">Pendente</Badge>
              ) : (
                <Badge variant="secondary">Respondido</Badge>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Questionário semanal</p>
            </CardContent>
          </Card>
        </Link>

        {/* Reports */}
        <Link to="/reports">
          <Card className="cursor-pointer transition-all hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Relatórios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{reportCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total de relatórios</p>
            </CardContent>
          </Card>
        </Link>

        {/* Last Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última Avaliação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lastReport ? (
              <>
                <p className="text-2xl font-bold text-foreground">{lastReport.technical_score}/10</p>
                <p className="mt-1 text-xs text-muted-foreground">Nota técnica</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Report */}
      {lastReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Último Relatório</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(lastReport.created_at), "d 'de' MMMM, yyyy", { locale: pt })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Objetivo</p>
              <p className="text-sm text-foreground">{lastReport.objective}</p>
            </div>
            {lastReport.strengths && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontos Fortes</p>
                <p className="text-sm text-foreground">{lastReport.strengths}</p>
              </div>
            )}
            {lastReport.improvements && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Melhorar</p>
                <p className="text-sm text-foreground">{lastReport.improvements}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerDashboard;
