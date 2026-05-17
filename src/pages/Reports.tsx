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

  // Personal PDF documents
  const isCoach = role === "coach";
  const [docs, setDocs] = useState<AthleteDoc[]>([]);
  const [docAthleteId, setDocAthleteId] = useState<string>("");
  const [docDescription, setDocDescription] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchReports();
    fetchDocs();
    if (role === "coach") fetchAthletes();
  }, [user, role]);

  const fetchDocs = async () => {
    if (!user) return;
    const query = isCoach
      ? supabase.from("athlete_documents").select("*").eq("coach_id", user.id).order("created_at", { ascending: false })
      : supabase.from("athlete_documents").select("*").eq("athlete_id", user.id).order("created_at", { ascending: false });
    const { data } = await query;
    if (!data) {
      setDocs([]);
      return;
    }
    const withUrls = await Promise.all(
      (data as AthleteDoc[]).map(async (d) => {
        const { data: signed } = await supabase.storage.from("athlete-documents").createSignedUrl(d.file_path, 3600);
        return { ...d, file_url: signed?.signedUrl || d.file_url };
      })
    );
    if (isCoach) {
      const ids = Array.from(new Set(withUrls.map((d) => d.athlete_id)));
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
        const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || "Sem nome"]));
        withUrls.forEach((d) => (d.athlete_name = nameMap.get(d.athlete_id) || "Atleta"));
      }
    }
    setDocs(withUrls);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!docAthleteId) {
      toast.error("Seleciona um atleta primeiro.");
      if (docInputRef.current) docInputRef.current.value = "";
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Apenas ficheiros PDF são permitidos.");
      if (docInputRef.current) docInputRef.current.value = "";
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("PDF demasiado grande (máx. 25 MB).");
      if (docInputRef.current) docInputRef.current.value = "";
      return;
    }
    setUploadingDoc(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${docAthleteId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("athlete-documents").upload(path, file, {
        contentType: "application/pdf",
      });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("athlete-documents").createSignedUrl(path, 3600);
      const { error: insErr } = await supabase.from("athlete_documents").insert({
        coach_id: user.id,
        athlete_id: docAthleteId,
        file_name: file.name,
        file_url: signed?.signedUrl || "",
        file_path: path,
        description: docDescription.trim() || null,
      });
      if (insErr) throw insErr;
      toast.success("Documento enviado!");
      setDocDescription("");
      if (docInputRef.current) docInputRef.current.value = "";
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDoc = async (doc: AthleteDoc) => {
    if (!confirm("Eliminar este documento?")) return;
    await supabase.storage.from("athlete-documents").remove([doc.file_path]);
    const { error } = await supabase.from("athlete_documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Documento eliminado");
      fetchDocs();
    }
  };

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

        {/* Personal PDF documents */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Documentos Pessoais (PDF)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCoach
                ? "Envia um PDF diretamente para um atleta. Apenas esse atleta poderá vê-lo."
                : "PDFs enviados diretamente para ti pelo teu treinador."}
            </p>

            {isCoach && (
              <div className="space-y-3 rounded-md border border-border p-4 bg-secondary/30">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Atleta</Label>
                    <Select value={docAthleteId} onValueChange={setDocAthleteId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleciona um atleta" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">Sem atletas associados</div>
                        ) : (
                          athletes.map((a) => (
                            <SelectItem key={a.user_id} value={a.user_id}>
                              {a.full_name || a.user_id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Descrição (opcional)</Label>
                    <Input
                      value={docDescription}
                      onChange={(e) => setDocDescription(e.target.value)}
                      placeholder="Ex: Plano nutricional"
                      className="bg-background"
                    />
                  </div>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadingDoc || !docAthleteId}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingDoc ? "A carregar..." : "Carregar PDF"}
                </Button>
              </div>
            )}

            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isCoach ? "Ainda não enviaste nenhum documento pessoal." : "Sem documentos pessoais."}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((d) => (
                  <div key={d.id} className="group rounded-md border border-border bg-card p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{d.file_name}</p>
                        {isCoach && d.athlete_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" /> {d.athlete_name}
                          </p>
                        )}
                        {d.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{d.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(d.created_at), "d MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="mr-1 h-3 w-3" /> Abrir
                        </Button>
                      </a>
                      <a href={d.file_url} download={d.file_name}>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                      {isCoach && (
                        <Button variant="ghost" size="sm" onClick={() => deleteDoc(d)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
