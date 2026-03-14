import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navigate, Link } from "react-router-dom";

interface Athlete {
  athlete_id: string;
  full_name: string;
  short_id: string;
  id: string;
}

const Athletes = () => {
  const { user, role } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAthletes = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from("coach_athletes")
      .select("id, athlete_id")
      .eq("coach_id", user.id);

    if (links && links.length > 0) {
      const ids = links.map((l) => l.athlete_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, short_id")
        .in("user_id", ids);

      const merged = links.map((l) => ({
        ...l,
        full_name: profiles?.find((p) => p.user_id === l.athlete_id)?.full_name || "Sem nome",
        short_id: profiles?.find((p) => p.user_id === l.athlete_id)?.short_id || "",
      }));
      setAthletes(merged);
    } else {
      setAthletes([]);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, [user]);

  if (role !== "coach") return <Navigate to="/dashboard" replace />;

  const addAthlete = async () => {
    if (!email.trim() || !user) return;
    setLoading(true);
    try {
      // Look up athlete by short_id
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("short_id", email.trim())
        .maybeSingle();
      
      if (lookupError) throw lookupError;
      if (!profile) {
        toast.error("Atleta não encontrado com esse código");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("coach_athletes").insert({
        coach_id: user.id,
        athlete_id: profile.user_id,
      });
      if (error) throw error;
      toast.success("Atleta adicionado!");
      setEmail("");
      fetchAthletes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar atleta");
    } finally {
      setLoading(false);
    }
  };

  const removeAthlete = async (linkId: string) => {
    const { error } = await supabase.from("coach_athletes").delete().eq("id", linkId);
    if (error) {
      toast.error("Erro ao remover atleta");
    } else {
      toast.success("Atleta removido");
      fetchAthletes();
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Atletas</h1>
          <p className="text-muted-foreground mt-1">Adiciona e gere os teus atletas.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Atleta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Código do atleta (6 dígitos)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={6}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={addAthlete} disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              O atleta deve partilhar o seu ID de utilizador contigo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Os Teus Atletas ({athletes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {athletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não adicionaste nenhum atleta.</p>
            ) : (
              <div className="space-y-3">
                {athletes.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.athlete_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/athletes/${a.athlete_id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">Ver perfil</Badge>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => removeAthlete(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

export default Athletes;
