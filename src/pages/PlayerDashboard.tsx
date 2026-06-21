import { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardList, TrendingUp, ListChecks, BarChart3, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

const PlayerStatsView = lazy(() => import("@/components/stats/PlayerStatsView"));

interface CustomAssignment {
  id: string;
  questionnaire_id: string;
  completed_at: string | null;
  created_at: string;
  title?: string;
}

const PlayerDashboard = () => {
  const { user, profile } = useAuth();
  const [lastReport, setLastReport] = useState<any>(null);
  const [hasPendingQuestionnaire, setHasPendingQuestionnaire] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [customAssignments, setCustomAssignments] = useState<CustomAssignment[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [reportRes, countRes, weeklyRes, assignRes] = await Promise.all([
        supabase
          .from("training_reports")
          .select("*")
          .eq("athlete_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("training_reports")
          .select("*", { count: "exact", head: true })
          .eq("athlete_id", user.id),
        supabase
          .from("weekly_questionnaires")
          .select("id")
          .eq("player_id", user.id)
          .eq("week_start", format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"))
          .maybeSingle(),
        supabase
          .from("custom_questionnaire_assignments")
          .select("id, questionnaire_id, completed_at, created_at")
          .eq("athlete_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setLastReport(reportRes.data);
      setReportCount(countRes.count || 0);
      setHasPendingQuestionnaire(!weeklyRes.data);

      if (assignRes.data && assignRes.data.length > 0) {
        // Get questionnaire titles
        const qIds = [...new Set(assignRes.data.map((a) => a.questionnaire_id))];
        const { data: questionnaires } = await supabase
          .from("custom_questionnaires")
          .select("id, title")
          .in("id", qIds);
        
        const titleMap = new Map((questionnaires || []).map((q: any) => [q.id, q.title]));
        setCustomAssignments(
          assignRes.data.map((a) => ({
            ...a,
            title: titleMap.get(a.questionnaire_id) || "Questionário",
          }))
        );
      }
    };

    fetchData();
  }, [user]);

  const shortId = profile?.short_id ?? "";

  const pendingCustom = customAssignments.filter((a) => !a.completed_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.full_name || "Jogador"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao teu painel de treino. O teu código: <span className="font-mono font-bold text-foreground">#{shortId}</span>
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
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
            <Link to="/bookings">
              <Card className="cursor-pointer transition-all hover:border-primary/50 border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Marcar Treino</CardTitle>
                  <CalendarDays className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Badge variant="default">Calendário</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">Reserva o teu horário</p>
                </CardContent>
              </Card>
            </Link>
          </div>


          {customAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Questionários do Treinador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customAssignments.map((a) => (
                  <Link key={a.id} to={`/answer-questionnaire/${a.id}`}>
                    <div className="flex items-center justify-between rounded-md bg-secondary p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "d MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                      <Badge variant={a.completed_at ? "secondary" : "default"}>
                        {a.completed_at ? "Respondido" : "Pendente"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

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
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar estatísticas...</p>}>
            <PlayerStatsView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerDashboard;
