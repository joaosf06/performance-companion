import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Plus, X, FileUp, Upload, FileText, Download, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AthleteDoc {
  id: string;
  coach_id: string;
  athlete_id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  description: string | null;
  created_at: string;
  athlete_name?: string;
}

const Reports = () => {
  const { user, role } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);

  // Form state
  const [athleteId, setAthleteId] = useState("");
  const [objective, setObjective] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [technicalScore, setTechnicalScore] = useState([5]);
  const [intensityScore, setIntensityScore] = useState([5]);
  const [mentalObs, setMentalObs] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchReports();
    if (role === "coach") fetchAthletes();
  }, [user, role]);

  const fetchReports = async () => {
    if (!user) return;
    const query = role === "coach"
      ? supabase.from("training_reports").select("*").eq("coach_id", user.id).order("created_at", { ascending: false })
      : supabase.from("training_reports").select("*").eq("athlete_id", user.id).order("created_at", { ascending: false });

    const { data } = await query;
    setReports(data || []);
  };

  const fetchAthletes = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from("coach_athletes")
      .select("athlete_id")
      .eq("coach_id", user.id);

    if (links && links.length > 0) {
      const ids = links.map((l) => l.athlete_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      setAthletes(profiles || []);
    }
  };

  const submitReport = async () => {
    if (!user || !athleteId || !objective) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("training_reports").insert({
        coach_id: user.id,
        athlete_id: athleteId,
        objective,
        strengths: strengths || null,
        improvements: improvements || null,
        technical_score: technicalScore[0],
        intensity_score: intensityScore[0],
        mental_observations: mentalObs || null,
      });
      if (error) throw error;
      toast.success("Relatório criado!");
      setShowForm(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAthleteId("");
    setObjective("");
    setStrengths("");
    setImprovements("");
    setTechnicalScore([5]);
    setIntensityScore([5]);
    setMentalObs("");
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios de Treino</h1>
            <p className="text-muted-foreground mt-1">
              {role === "coach" ? "Cria e consulta relatórios." : "Consulta os teus relatórios."}
            </p>
          </div>
          {role === "coach" && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {showForm ? "Cancelar" : "Novo Relatório"}
            </Button>
          )}
        </div>

        {/* Create form */}
        {showForm && role === "coach" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Novo Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Atleta</Label>
                <Select value={athleteId} onValueChange={setAthleteId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleciona um atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {a.full_name || a.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Objetivo do treino</Label>
                <Input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Melhoria de passe longo"
                  className="bg-background"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pontos fortes</Label>
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="O que fez bem..."
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>A melhorar</Label>
                  <Textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="O que pode melhorar..."
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Nota Técnica: {technicalScore[0]}/10</Label>
                  <Slider value={technicalScore} onValueChange={setTechnicalScore} min={1} max={10} step={1} />
                </div>
                <div className="space-y-3">
                  <Label>Intensidade: {intensityScore[0]}/10</Label>
                  <Slider value={intensityScore} onValueChange={setIntensityScore} min={1} max={10} step={1} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações mentais/comportamentais</Label>
                <Textarea
                  value={mentalObs}
                  onChange={(e) => setMentalObs(e.target.value)}
                  placeholder="Observações sobre atitude, foco, etc."
                  className="bg-background"
                />
              </div>

              <Button onClick={submitReport} disabled={submitting || !athleteId || !objective}>
                {submitting ? "A criar..." : "Criar Relatório"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reports list */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Sem relatórios ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{r.objective}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(r.created_at), "d 'de' MMMM, yyyy", { locale: pt })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Técnica: {r.technical_score}/10</Badge>
                    <Badge variant="outline">Intensidade: {r.intensity_score}/10</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.strengths && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Pontos Fortes</p>
                      <p className="text-sm text-foreground">{r.strengths}</p>
                    </div>
                  )}
                  {r.improvements && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">A Melhorar</p>
                      <p className="text-sm text-foreground">{r.improvements}</p>
                    </div>
                  )}
                  {r.mental_observations && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Observações</p>
                      <p className="text-sm text-foreground">{r.mental_observations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
