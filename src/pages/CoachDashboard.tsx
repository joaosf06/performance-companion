import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfWeek } from "date-fns";

const CoachDashboard = () => {
  const { user, profile } = useAuth();
  const [athleteCount, setAthleteCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [recentAthletes, setRecentAthletes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Athletes
      const { data: athletes, count } = await supabase
        .from("coach_athletes")
        .select("athlete_id", { count: "exact" })
        .eq("coach_id", user.id);
      setAthleteCount(count || 0);

      // Reports count
      const { count: rCount } = await supabase
        .from("training_reports")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", user.id);
      setReportCount(rCount || 0);

      // Check pending questionnaires for athletes
      if (athletes && athletes.length > 0) {
        const athleteIds = athletes.map((a) => a.athlete_id);
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekStartStr = format(weekStart, "yyyy-MM-dd");

        const { data: answered } = await supabase
          .from("weekly_questionnaires")
          .select("player_id")
          .in("player_id", athleteIds)
          .eq("week_start", weekStartStr);

        const answeredIds = new Set((answered || []).map((q) => q.player_id));
        setPendingAlerts(athleteIds.filter((id) => !answeredIds.has(id)).length);

        // Recent athletes with profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", athleteIds.slice(0, 5));
        setRecentAthletes(profiles || []);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.full_name || "Treinador"}
        </h1>
        <p className="text-muted-foreground mt-1">Painel do treinador.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/athletes">
          <Card className="cursor-pointer transition-all hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atletas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{athleteCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Atletas associados</p>
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
              <p className="mt-1 text-xs text-muted-foreground">Relatórios criados</p>
            </CardContent>
          </Card>
        </Link>

        <Card className={pendingAlerts > 0 ? "border-primary/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pendingAlerts > 0 ? (
              <>
                <Badge variant="default" className="bg-primary text-primary-foreground">{pendingAlerts}</Badge>
                <p className="mt-2 text-xs text-muted-foreground">Questionários não respondidos</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tudo em dia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Athletes */}
      {recentAthletes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atletas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAthletes.map((athlete) => (
                <div key={athlete.user_id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                  <span className="text-sm font-medium text-foreground">{athlete.full_name || "Sem nome"}</span>
                  <Link to={`/athletes/${athlete.user_id}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">Ver perfil</Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachDashboard;
