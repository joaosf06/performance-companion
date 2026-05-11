import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, Send, Eye, GripVertical, Paperclip, X, Repeat } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const QuestionnaireResults = lazy(() => import("@/components/questionnaires/QuestionnaireResults"));
const QuestionnaireRecurrenceDialog = lazy(() => import("@/components/questionnaires/QuestionnaireRecurrenceDialog"));

interface Field {
  id?: string;
  field_type: string;
  label: string;
  required: boolean;
  sort_order: number;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  recurrence?: string;
  recurrence_active?: boolean;
  next_run_at?: string | null;
  fields?: Field[];
}

interface Athlete {
  athlete_id: string;
  full_name: string;
  short_id: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "slider", label: "Escala (1-10)" },
  { value: "textarea", label: "Texto Longo" },
  { value: "file", label: "Ficheiro (vídeo/imagem/doc)" },
];

const CustomQuestionnaires = () => {
  const { user, role } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([
    { field_type: "text", label: "", required: false, sort_order: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingQuestionnaire, setViewingQuestionnaire] = useState<Questionnaire | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [recurrenceQuestionnaireId, setRecurrenceQuestionnaireId] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  if (role !== "coach") return <Navigate to="/dashboard" replace />;

  const fetchAll = async () => {
    if (!user) return;

    const [qRes, aRes] = await Promise.all([
      supabase
        .from("custom_questionnaires")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id),
    ]);

    setQuestionnaires((qRes.data as any[]) || []);

    if (aRes.data && aRes.data.length > 0) {
      const ids = aRes.data.map((a) => a.athlete_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, short_id")
        .in("user_id", ids);
      setAthletes(
        (profiles || []).map((p: any) => ({
          athlete_id: p.user_id,
          full_name: p.full_name || "Sem nome",
          short_id: p.short_id || "",
        }))
      );
    }
  };

  const addField = () => {
    setFields([...fields, { field_type: "text", label: "", required: false, sort_order: fields.length }]);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const createQuestionnaire = async () => {
    if (!user || !title.trim() || fields.some((f) => !f.label.trim())) {
      toast.error("Preenche o título e todas as perguntas");
      return;
    }
    setSubmitting(true);
    try {
      const { data: q, error: qError } = await supabase
        .from("custom_questionnaires")
        .insert({
          coach_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          attachments: attachments.length > 0 ? attachments : [],
        })
        .select()
        .single();
      if (qError) throw qError;

      const fieldInserts = fields.map((f, i) => ({
        questionnaire_id: q.id,
        field_type: f.field_type,
        label: f.label.trim(),
        required: f.required,
        sort_order: i,
      }));

      const { error: fError } = await supabase
        .from("custom_questionnaire_fields")
        .insert(fieldInserts);
      if (fError) throw fError;

      toast.success("Questionário criado!");
      setCreating(false);
      setTitle("");
      setDescription("");
      setFields([{ field_type: "text", label: "", required: false, sort_order: 0 }]);
      setAttachments([]);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignDialog = (questionnaireId: string) => {
    setSelectedQuestionnaire(questionnaireId);
    setSelectedAthletes([]);
    setAssignDialogOpen(true);
  };

  const assignToAthletes = async () => {
    if (!selectedQuestionnaire || selectedAthletes.length === 0) return;
    try {
      const inserts = selectedAthletes.map((athleteId) => ({
        questionnaire_id: selectedQuestionnaire,
        athlete_id: athleteId,
      }));
      const { error } = await supabase
        .from("custom_questionnaire_assignments")
        .insert(inserts);
      if (error) throw error;
      toast.success(`Atribuído a ${selectedAthletes.length} atleta(s)!`);
      setAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const viewQuestionnaire = async (q: Questionnaire) => {
    const [fieldsRes, assignRes] = await Promise.all([
      supabase
        .from("custom_questionnaire_fields")
        .select("*")
        .eq("questionnaire_id", q.id)
        .order("sort_order"),
      supabase
        .from("custom_questionnaire_assignments")
        .select("*")
        .eq("questionnaire_id", q.id),
    ]);
    setViewingQuestionnaire({ ...q, fields: (fieldsRes.data as any[]) || [] });
    
    // Get athlete names for assignments
    if (assignRes.data && assignRes.data.length > 0) {
      const ids = assignRes.data.map((a: any) => a.athlete_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const merged = assignRes.data.map((a: any) => ({
        ...a,
        full_name: profiles?.find((p: any) => p.user_id === a.athlete_id)?.full_name || "Sem nome",
      }));
      setAssignments(merged);
    } else {
      setAssignments([]);
    }
    setViewDialogOpen(true);
  };

  const deleteQuestionnaire = async (id: string) => {
    const { error } = await supabase.from("custom_questionnaires").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Questionário eliminado");
      fetchAll();
    }
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questionários Personalizados</h1>
          <p className="text-muted-foreground mt-1">Cria, atribui e analisa os resultados dos teus atletas.</p>
        </div>

        <Tabs defaultValue="manage">
          <TabsList>
            <TabsTrigger value="manage">Gerir</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setCreating(!creating)}>
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Cancelar" : "Novo Questionário"}
              </Button>
            </div>

            {creating && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Questionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Avaliação pré-jogo"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição do questionário..."
                  className="bg-background"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Campos / Perguntas</Label>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="mr-1 h-3 w-3" /> Adicionar Campo
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-md bg-secondary p-4">
                    <div className="mt-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="Pergunta ou rótulo do campo"
                            className="bg-background"
                          />
                        </div>
                        <Select
                          value={field.field_type}
                          onValueChange={(v) => updateField(index, { field_type: v })}
                        >
                          <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateField(index, { required: checked === true })
                          }
                        />
                        <span className="text-xs text-muted-foreground">Obrigatório</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Attachments section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Anexos (fotos, vídeos, ficheiros)</Label>
                  <div>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !user) return;
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error("Ficheiro demasiado grande (máx. 50 MB).");
                          if (attachmentInputRef.current) attachmentInputRef.current.value = "";
                          return;
                        }
                        setUploadingAttachment(true);
                        try {
                          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                          const path = `${user.id}/${Date.now()}_${safeName}`;
                          const { error: upErr } = await supabase.storage.from("questionnaire-files").upload(path, file);
                          if (upErr) throw upErr;
                          const { data: urlData } = supabase.storage.from("questionnaire-files").getPublicUrl(path);
                          setAttachments((prev) => [...prev, { name: file.name, url: urlData.publicUrl, type: file.type }]);
                        } catch (err: any) {
                          toast.error(err.message);
                        } finally {
                          setUploadingAttachment(false);
                          if (attachmentInputRef.current) attachmentInputRef.current.value = "";
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachment}>
                      <Paperclip className="mr-1 h-3 w-3" /> {uploadingAttachment ? "A carregar..." : "Anexar"}
                    </Button>
                  </div>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-secondary p-3">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{att.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={createQuestionnaire} disabled={submitting} className="w-full">
                {submitting ? "A criar..." : "Criar Questionário"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List of questionnaires */}
        {questionnaires.length === 0 && !creating ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Ainda não criaste nenhum questionário personalizado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questionnaires.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{q.title}</p>
                      {q.recurrence_active && q.recurrence && q.recurrence !== "none" && (
                        <Badge variant="default" className="text-xs">
                          <Repeat className="mr-1 h-3 w-3" />
                          {q.recurrence === "daily" ? "Diário" : q.recurrence === "weekly" ? "Semanal" : "Mensal"}
                        </Badge>
                      )}
                    </div>
                    {q.description && (
                      <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(q.created_at), "d MMM yyyy", { locale: pt })}
                      {q.recurrence_active && q.next_run_at && (
                        <span className="ml-2">· Próximo envio: {format(new Date(q.next_run_at), "d MMM HH:mm", { locale: pt })}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewQuestionnaire(q)}>
                      <Eye className="mr-1 h-3 w-3" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignDialog(q.id)}>
                      <Send className="mr-1 h-3 w-3" /> Atribuir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecurrenceQuestionnaireId(q.id);
                        setRecurrenceDialogOpen(true);
                      }}
                    >
                      <Repeat className="mr-1 h-3 w-3" /> Recorrência
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestionnaire(q.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar resultados...</p>}>
              <QuestionnaireResults />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Questionário</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {athletes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Não tens atletas associados.</p>
              ) : (
                athletes.map((a) => (
                  <div
                    key={a.athlete_id}
                    className="flex items-center gap-3 rounded-md bg-secondary p-3 cursor-pointer"
                    onClick={() => toggleAthlete(a.athlete_id)}
                  >
                    <Checkbox checked={selectedAthletes.includes(a.athlete_id)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">#{a.short_id}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button onClick={assignToAthletes} disabled={selectedAthletes.length === 0} className="w-full">
              Atribuir a {selectedAthletes.length} atleta(s)
            </Button>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingQuestionnaire?.title}</DialogTitle>
            </DialogHeader>
            {viewingQuestionnaire?.description && (
              <p className="text-sm text-muted-foreground">{viewingQuestionnaire.description}</p>
            )}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Campos:</Label>
              {viewingQuestionnaire?.fields?.map((f, i) => (
                <div key={f.id || i} className="flex items-center gap-3 rounded-md bg-secondary p-3">
                  <Badge variant="outline" className="text-xs">{FIELD_TYPES.find((t) => t.value === f.field_type)?.label || f.field_type}</Badge>
                  <span className="text-sm text-foreground">{f.label}</span>
                  {f.required && <Badge variant="default" className="text-xs">Obrigatório</Badge>}
                </div>
              ))}
            </div>
            {/* Show attachments */}
            {viewingQuestionnaire && (viewingQuestionnaire as any).attachments && (viewingQuestionnaire as any).attachments.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Anexos:</Label>
                {(viewingQuestionnaire as any).attachments.map((att: any, i: number) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md bg-secondary p-3 hover:bg-accent transition-colors">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{att.name}</span>
                  </a>
                ))}
              </div>
            )}
            {assignments.length > 0 && (
              <div className="space-y-3 mt-4">
                <Label className="text-sm font-semibold">Atribuído a:</Label>
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                    <span className="text-sm text-foreground">{a.full_name}</span>
                    <Badge variant={a.completed_at ? "default" : "outline"}>
                      {a.completed_at ? "Respondido" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Suspense fallback={null}>
          <QuestionnaireRecurrenceDialog
            open={recurrenceDialogOpen}
            onOpenChange={(o) => {
              setRecurrenceDialogOpen(o);
              if (!o) fetchAll();
            }}
            questionnaireId={recurrenceQuestionnaireId}
            athletes={athletes}
          />
        </Suspense>
      </div>
    </Layout>
  );
};

export default CustomQuestionnaires;
