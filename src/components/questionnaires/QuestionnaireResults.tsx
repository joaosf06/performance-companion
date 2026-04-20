import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import InlineFilePreview from "@/components/InlineFilePreview";

interface Questionnaire {
  id: string;
  title: string;
}

interface Field {
  id: string;
  label: string;
  field_type: string;
  sort_order: number;
}

interface AssignmentFull {
  id: string;
  athlete_id: string;
  athlete_name: string;
  completed_at: string | null;
  created_at: string;
}

interface Response {
  id: string;
  assignment_id: string;
  field_id: string;
  text_value: string | null;
  number_value: number | null;
  file_url: string | null;
}

const PALETTE = ["hsl(0 84% 60%)", "hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(280 87% 65%)", "hsl(190 80% 50%)"];

export default function QuestionnaireResults() {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQId, setSelectedQId] = useState<string>("");
  const [fields, setFields] = useState<Field[]>([]);
  const [assignments, setAssignments] = useState<AssignmentFull[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("custom_questionnaires")
      .select("id, title")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as Questionnaire[]) || [];
        setQuestionnaires(list);
        if (list.length > 0) setSelectedQId(list[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedQId) return;
    setLoading(true);
    (async () => {
      const [fRes, aRes] = await Promise.all([
        supabase.from("custom_questionnaire_fields").select("*").eq("questionnaire_id", selectedQId).order("sort_order"),
        supabase.from("custom_questionnaire_assignments").select("*").eq("questionnaire_id", selectedQId),
      ]);
      const fieldList = (fRes.data as Field[]) || [];
      setFields(fieldList);

      const assignList = (aRes.data as any[]) || [];
      const athleteIds = assignList.map((a) => a.athlete_id);

      let profiles: any[] = [];
      if (athleteIds.length > 0) {
        const { data: pData } = await supabase.from("profiles").select("user_id, full_name").in("user_id", athleteIds);
        profiles = pData || [];
      }

      const assignmentsFull: AssignmentFull[] = assignList.map((a) => ({
        id: a.id,
        athlete_id: a.athlete_id,
        athlete_name: profiles.find((p) => p.user_id === a.athlete_id)?.full_name || "Sem nome",
        completed_at: a.completed_at,
        created_at: a.created_at,
      }));
      setAssignments(assignmentsFull);

      const completed = assignmentsFull.filter((a) => a.completed_at).map((a) => a.id);
      if (completed.length > 0) {
        const { data: rData } = await supabase.from("custom_questionnaire_responses").select("*").in("assignment_id", completed);
        setResponses((rData as Response[]) || []);
      } else {
        setResponses([]);
      }

      // Pre-select up to 4 most recent completed athletes
      const recent = [...assignmentsFull]
        .filter((a) => a.completed_at)
        .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""))
        .slice(0, 4)
        .map((a) => a.athlete_id);
      setSelectedAthletes(recent);
      setLoading(false);
    })();
  }, [selectedQId]);

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Group assignments by athlete (each athlete may have multiple completions across different days)
  const completedAssignments = useMemo(
    () => assignments.filter((a) => a.completed_at && selectedAthletes.includes(a.athlete_id)),
    [assignments, selectedAthletes]
  );

  const numericFields = useMemo(() => fields.filter((f) => f.field_type === "slider" || f.field_type === "number"), [fields]);
  const textFields = useMemo(() => fields.filter((f) => f.field_type === "text" || f.field_type === "textarea"), [fields]);
  const fileFields = useMemo(() => fields.filter((f) => f.field_type === "file"), [fields]);

  // Build comparison chart data: for each numeric field, value per (athlete + completion date)
  const buildBarData = () => {
    return numericFields.map((field) => {
      const item: any = { field: field.label };
      completedAssignments.forEach((a) => {
        const r = responses.find((res) => res.assignment_id === a.id && res.field_id === field.id);
        const dateLabel = format(new Date(a.completed_at!), "d/MM", { locale: pt });
        const key = `${a.athlete_name} (${dateLabel})`;
        item[key] = r?.number_value ?? 0;
      });
      return item;
    });
  };

  // Build line chart for athlete evolution over time (per selected field)
  const [evolutionFieldId, setEvolutionFieldId] = useState<string>("");
  useEffect(() => {
    if (numericFields.length > 0 && !numericFields.find((f) => f.id === evolutionFieldId)) {
      setEvolutionFieldId(numericFields[0].id);
    }
  }, [numericFields, evolutionFieldId]);

  const evolutionData = useMemo(() => {
    if (!evolutionFieldId) return [];
    // Group by date, columns per athlete
    const byDate: Record<string, any> = {};
    completedAssignments.forEach((a) => {
      const r = responses.find((res) => res.assignment_id === a.id && res.field_id === evolutionFieldId);
      const dateKey = format(new Date(a.completed_at!), "d MMM", { locale: pt });
      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
      byDate[dateKey][a.athlete_name] = r?.number_value ?? null;
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [completedAssignments, responses, evolutionFieldId]);

  const uniqueAthleteNames = useMemo(
    () => [...new Set(completedAssignments.map((a) => a.athlete_name))],
    [completedAssignments]
  );

  const barKeys = useMemo(() => {
    const data = buildBarData();
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((k) => k !== "field");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedAssignments, responses, numericFields]);

  const allCompleted = assignments.filter((a) => a.completed_at);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados dos Questionários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Questionário</Label>
            <Select value={selectedQId} onValueChange={setSelectedQId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Escolhe um questionário" />
              </SelectTrigger>
              <SelectContent>
                {questionnaires.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {questionnaires.length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda não tens questionários criados.</p>
          )}

          {selectedQId && (
            <div className="space-y-2">
              <Label>Atletas a comparar ({selectedAthletes.length} selecionados)</Label>
              {allCompleted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda nenhum atleta respondeu a este questionário.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto">
                  {[...new Map(allCompleted.map((a) => [a.athlete_id, a])).values()].map((a) => {
                    const count = allCompleted.filter((x) => x.athlete_id === a.athlete_id).length;
                    return (
                      <div
                        key={a.athlete_id}
                        onClick={() => toggleAthlete(a.athlete_id)}
                        className="flex items-center gap-2 rounded-md bg-secondary p-2 cursor-pointer hover:bg-accent"
                      >
                        <Checkbox checked={selectedAthletes.includes(a.athlete_id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.athlete_name}</p>
                          <p className="text-xs text-muted-foreground">{count} resposta(s)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : completedAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Seleciona pelo menos um atleta com respostas.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="comparison">
          <TabsList>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
            <TabsTrigger value="details">Respostas detalhadas</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-4 space-y-4">
            {numericFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem campos numéricos para comparar.</p>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comparação por pergunta</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, numericFields.length * 60)}>
                    <BarChart data={buildBarData()} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="field" type="category" stroke="hsl(var(--muted-foreground))" width={150} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                      {barKeys.map((k, i) => (
                        <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="mt-4 space-y-4">
            {numericFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem campos numéricos para evolução.</p>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução ao longo do tempo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={evolutionFieldId} onValueChange={setEvolutionFieldId}>
                    <SelectTrigger className="bg-background w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericFields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                      {uniqueAthleteNames.map((name, i) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={PALETTE[i % PALETTE.length]}
                          strokeWidth={2}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            {completedAssignments
              .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""))
              .map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{a.athlete_name}</CardTitle>
                      <Badge variant="outline">
                        {format(new Date(a.completed_at!), "d MMM yyyy HH:mm", { locale: pt })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {fields.map((f) => {
                      const r = responses.find((res) => res.assignment_id === a.id && res.field_id === f.id);
                      return (
                        <div key={f.id} className="rounded-md bg-secondary p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{f.label}</p>
                          {f.field_type === "file" ? (
                            r?.file_url ? (
                              <InlineFilePreview url={r.file_url} name={r.text_value || undefined} maxHeight="max-h-[40vh]" />
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Sem resposta</p>
                            )
                          ) : f.field_type === "slider" || f.field_type === "number" ? (
                            <p className="text-sm text-foreground font-semibold">
                              {r?.number_value ?? <span className="text-muted-foreground italic font-normal">Sem resposta</span>}
                              {f.field_type === "slider" && r?.number_value != null && <span className="text-muted-foreground"> / 10</span>}
                            </p>
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {r?.text_value || <span className="text-muted-foreground italic">Sem resposta</span>}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
