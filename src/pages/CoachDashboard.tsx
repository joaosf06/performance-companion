import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, FileText, AlertTriangle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfWeek } from "date-fns";
import { toast } from "sonner";

const CoachDashboard = () => {
  const { user, profile } = useAuth();
  const [athleteCount, setAthleteCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [recentAthletes, setRecentAthletes] = useState<any[]>([]);

  // Upgrade dialog
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeUserId, setUpgradeUserId] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: athletes, count }, { count: rCount }] = await Promise.all([
        supabase
          .from("coach_athletes")
          .select("athlete_id", { count: "exact" })
          .eq("coach_id", user.id),
        supabase
          .from("training_reports")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", user.id),
      ]);

      setAthleteCount(count || 0);
      setReportCount(rCount || 0);

      if (!athletes || athletes.length === 0) {
        setPendingAlerts(0);
        setRecentAthletes([]);
        return;
      }

      const athleteIds = athletes.map((a) => a.athlete_id);
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const [{ data: answered }, { data: profiles }] = await Promise.all([
        supabase
          .from("weekly_questionnaires")
          .select("player_id")
          .in("player_id", athleteIds)
          .eq("week_start", weekStartStr),
        supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", athleteIds.slice(0, 5)),
      ]);

      const answeredIds = new Set((answered || []).map((q) => q.player_id));
      setPendingAlerts(athleteIds.filter((id) => !answeredIds.has(id)).length);
      setRecentAthletes(profiles || []);
    };

    void fetchData();
  }, [user]);

  const handleUpgrade = async () => {
    if (!upgradeUserId.trim()) return;
    setUpgrading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("short_id", upgradeUserId.trim().replace("#", ""))
        .maybeSingle();

      if (profileError || !profileData) {
        toast.error("Utilizador não encontrado com esse código.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", profileData.user_id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: profileData.user_id, role: "coach" as const });

      if (insertError) throw insertError;

      toast.success("Utilizador promovido a treinador com sucesso!");
      setUpgradeOpen(false);
      setUpgradeUserId("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.full_name || "Treinador"}
          </h1>
          <p className="text-muted-foreground mt-1">Painel do treinador.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Promover a Treinador
        </Button>
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

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promover Utilizador a Treinador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduz o código de 6 dígitos do utilizador que queres promover a treinador.
            </p>
            <div className="space-y-2">
              <Label>Código do Utilizador</Label>
              <Input
                value={upgradeUserId}
                onChange={(e) => setUpgradeUserId(e.target.value)}
                placeholder="Ex: 482931"
                className="bg-background"
              />
            </div>
            <Button onClick={handleUpgrade} disabled={upgrading || !upgradeUserId.trim()} className="w-full">
              {upgrading ? "A processar..." : "Promover a Treinador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachDashboard;