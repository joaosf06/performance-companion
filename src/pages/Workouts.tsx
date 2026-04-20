import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, Dumbbell, ChevronUp, ChevronDown, BookOpen, CheckCircle2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Athlete {
  athlete_id: string;
  full_name: string;
  short_id: string | null;
}

interface LibFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  folder_id: string;
}

interface LibFolder {
  id: string;
  name: string;
}

interface WorkoutItem {
  id?: string;
  library_file_id: string | null;
  exercise_name: string;
  sets: number | null;
  reps: string;
  rest_seconds: number | null;
  load: string;
  notes: string;
  sort_order: number;
}

interface Workout {
  id: string;
  athlete_id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  athlete_name?: string;
}

const Workouts = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [folders, setFolders] = useState<LibFolder[]>([]);
  const [files, setFiles] = useState<LibFile[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewWorkout, setViewWorkout] = useState<Workout | null>(null);
  const [viewItems, setViewItems] = useState<WorkoutItem[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [items, setItems] = useState<WorkoutItem[]>([]);
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);

  const isCoach = role === "coach";
  const isPlayer = role === "player";

  useEffect(() => {
    if (!user || authLoading) return;
    void load();
  }, [user, authLoading, role]);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    if (isCoach) {
      const [wRes, aRes, fldRes, flRes] = await Promise.all([
        supabase
          .from("complementary_workouts")
          .select("*")
          .eq("coach_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id),
        supabase.from("library_folders").select("id, name").eq("coach_id", user.id),
        supabase.from("library_files").select("id, file_name, file_url, file_type, folder_id").eq("coach_id", user.id),
      ]);

      const athleteIds = (aRes.data ?? []).map((a) => a.athlete_id);
      let profileMap = new Map<string, { full_name: string; short_id: string | null }>();
      if (athleteIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, short_id")
          .in("user_id", athleteIds);
        profileMap = new Map((profs ?? []).map((p) => [p.user_id, { full_name: p.full_name, short_id: p.short_id }]));
      }

      const athleteList: Athlete[] = athleteIds.map((id) => ({
        athlete_id: id,
        full_name: profileMap.get(id)?.full_name ?? "Atleta",
        short_id: profileMap.get(id)?.short_id ?? null,
      }));

      const workoutsList: Workout[] = (wRes.data ?? []).map((w) => ({
        ...w,
        athlete_name: profileMap.get(w.athlete_id)?.full_name ?? "Atleta",
      }));

      setWorkouts(workoutsList);
      setAthletes(athleteList);
      setFolders(fldRes.data ?? []);
      setFiles(flRes.data ?? []);
    } else if (isPlayer) {
      const { data: wData } = await supabase
        .from("complementary_workouts")
        .select("*")
        .eq("athlete_id", user.id)
        .order("scheduled_date", { ascending: false, nullsFirst: false });
      setWorkouts(wData ?? []);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAthleteId("");
    setScheduledDate("");
    setItems([]);
  };

  const addItemFromLibrary = (file: LibFile) => {
    setItems((prev) => [
      ...prev,
      {
        library_file_id: file.id,
        exercise_name: file.file_name,
        sets: null,
        reps: "",
        rest_seconds: null,
        load: "",
        notes: "",
        sort_order: prev.length,
      },
    ]);
    setPickerOpen(false);
  };

  const updateItem = (index: number, patch: Partial<WorkoutItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, sort_order: i })));
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const newIdx = index + dir;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[index], next[newIdx]] = [next[newIdx], next[index]];
      return next.map((it, i) => ({ ...it, sort_order: i }));
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Título é obrigatório");
    if (!athleteId) return toast.error("Seleciona um atleta");
    if (items.length === 0) return toast.error("Adiciona pelo menos um exercício");

    setSubmitting(true);
    const { data: workoutData, error: wErr } = await supabase
      .from("complementary_workouts")
      .insert({
        coach_id: user.id,
        athlete_id: athleteId,
        title: title.trim(),
        description: description.trim() || null,
        scheduled_date: scheduledDate || null,
      })
      .select()
      .single();

    if (wErr || !workoutData) {
      setSubmitting(false);
      return toast.error("Erro ao criar treino");
    }

    const itemsPayload = items.map((it, i) => ({
      workout_id: workoutData.id,
      library_file_id: it.library_file_id,
      exercise_name: it.exercise_name,
      sets: it.sets,
      reps: it.reps || null,
      rest_seconds: it.rest_seconds,
      load: it.load || null,
      notes: it.notes || null,
      sort_order: i,
    }));

    const { error: iErr } = await supabase.from("complementary_workout_items").insert(itemsPayload);
    setSubmitting(false);

    if (iErr) return toast.error("Erro ao guardar exercícios");

    toast.success("Treino criado com sucesso");
    setCreateOpen(false);
    resetForm();
    void load();
  };

  const openWorkoutDetails = async (w: Workout) => {
    setViewWorkout(w);
    const { data } = await supabase
      .from("complementary_workout_items")
      .select("*")
      .eq("workout_id", w.id)
      .order("sort_order");
    setViewItems(
      (data ?? []).map((d) => ({
        id: d.id,
        library_file_id: d.library_file_id,
        exercise_name: d.exercise_name,
        sets: d.sets,
        reps: d.reps ?? "",
        rest_seconds: d.rest_seconds,
        load: d.load ?? "",
        notes: d.notes ?? "",
        sort_order: d.sort_order,
      })),
    );
  };

  const deleteWorkout = async (id: string) => {
    if (!confirm("Eliminar este treino?")) return;
    const { error } = await supabase.from("complementary_workouts").delete().eq("id", id);
    if (error) return toast.error("Erro ao eliminar");
    toast.success("Treino eliminado");
    void load();
  };

  const markCompleted = async (w: Workout) => {
    const { error } = await supabase
      .from("complementary_workouts")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", w.id);
    if (error) return toast.error("Erro");
    toast.success("Treino marcado como concluído");
    setViewWorkout(null);
    void load();
  };

  const filteredFiles = useMemo(
    () => (folderFilter === "all" ? files : files.filter((f) => f.folder_id === folderFilter)),
    [files, folderFilter],
  );

  const libraryFileMap = useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);

  if (authLoading) return <Layout><div className="p-6">A carregar...</div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isCoach && !isPlayer) return <Navigate to="/dashboard" replace />;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-7 w-7 text-primary" /> Treinos Complementares
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCoach ? "Cria treinos personalizados usando os elementos da biblioteca." : "Os teus treinos atribuídos pelo treinador."}
            </p>
          </div>
          {isCoach && (
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Treino
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-muted-foreground">A carregar...</div>
        ) : workouts.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-50" />
              {isCoach ? "Ainda não criaste nenhum treino." : "Sem treinos atribuídos."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((w) => (
              <Card
                key={w.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => openWorkoutDetails(w)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{w.title}</h3>
                    <Badge variant={w.status === "completed" ? "default" : "secondary"}>
                      {w.status === "completed" ? "Concluído" : "Pendente"}
                    </Badge>
                  </div>
                  {isCoach && w.athlete_name && (
                    <p className="text-sm text-muted-foreground">👤 {w.athlete_name}</p>
                  )}
                  {w.scheduled_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(w.scheduled_date), "dd MMM yyyy", { locale: pt })}
                    </p>
                  )}
                  {w.description && <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Treino Complementar</DialogTitle>
            <DialogDescription>Constrói um treino selecionando exercícios da biblioteca.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Treino de força - Inferior" />
              </div>
              <div className="space-y-1.5">
                <Label>Atleta *</Label>
                <Select value={athleteId} onValueChange={setAthleteId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar atleta" /></SelectTrigger>
                  <SelectContent>
                    {athletes.map((a) => (
                      <SelectItem key={a.athlete_id} value={a.athlete_id}>
                        {a.full_name}{a.short_id ? ` (${a.short_id})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data prevista</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Descrição / Objetivo</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exercícios ({items.length})</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                  <BookOpen className="mr-2 h-4 w-4" /> Adicionar da Biblioteca
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground border border-dashed rounded-md p-6">
                  Sem exercícios. Adiciona da biblioteca.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <Card key={idx} className="bg-secondary/30">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-6">{idx + 1}.</span>
                          <Input
                            value={it.exercise_name}
                            onChange={(e) => updateItem(idx, { exercise_name: e.target.value })}
                            className="font-medium"
                          />
                          <div className="flex flex-col">
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveItem(idx, -1)}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveItem(idx, 1)}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Séries</Label>
                            <Input
                              type="number"
                              min={0}
                              value={it.sets ?? ""}
                              onChange={(e) => updateItem(idx, { sets: e.target.value ? Number(e.target.value) : null })}
                              placeholder="3"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              value={it.reps}
                              onChange={(e) => updateItem(idx, { reps: e.target.value })}
                              placeholder="8-12"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descanso (s)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={it.rest_seconds ?? ""}
                              onChange={(e) => updateItem(idx, { rest_seconds: e.target.value ? Number(e.target.value) : null })}
                              placeholder="60"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Carga</Label>
                            <Input
                              value={it.load}
                              onChange={(e) => updateItem(idx, { load: e.target.value })}
                              placeholder="20kg / corporal"
                            />
                          </div>
                        </div>
                        <Textarea
                          value={it.notes}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })}
                          rows={1}
                          placeholder="Notas (opcional)"
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "A guardar..." : "Criar Treino"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Library picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Exercício da Biblioteca</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as pastas</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredFiles.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-6">Sem ficheiros nesta pasta.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredFiles.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addItemFromLibrary(f)}
                    className="text-left rounded-md border border-border p-3 hover:border-primary hover:bg-secondary/50 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{f.file_name}</p>
                    <p className="text-xs text-muted-foreground">{f.file_type ?? "ficheiro"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout details */}
      <Dialog open={!!viewWorkout} onOpenChange={(o) => !o && setViewWorkout(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewWorkout?.title}</DialogTitle>
            {viewWorkout?.description && <DialogDescription>{viewWorkout.description}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={viewWorkout?.status === "completed" ? "default" : "secondary"}>
                {viewWorkout?.status === "completed" ? "Concluído" : "Pendente"}
              </Badge>
              {viewWorkout?.scheduled_date && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(viewWorkout.scheduled_date), "dd MMM yyyy", { locale: pt })}
                </Badge>
              )}
              {viewWorkout?.completed_at && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Concluído em {format(new Date(viewWorkout.completed_at), "dd MMM HH:mm", { locale: pt })}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {viewItems.map((it, idx) => {
                const file = it.library_file_id ? libraryFileMap.get(it.library_file_id) : null;
                return (
                  <Card key={it.id ?? idx} className="bg-secondary/30">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                          {it.exercise_name}
                        </p>
                        {file?.file_url && (
                          <a href={file.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                            Ver ficheiro
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {it.sets != null && <div><span className="text-muted-foreground">Séries:</span> {it.sets}</div>}
                        {it.reps && <div><span className="text-muted-foreground">Reps:</span> {it.reps}</div>}
                        {it.rest_seconds != null && <div><span className="text-muted-foreground">Descanso:</span> {it.rest_seconds}s</div>}
                        {it.load && <div><span className="text-muted-foreground">Carga:</span> {it.load}</div>}
                      </div>
                      {it.notes && <p className="text-xs text-muted-foreground italic">{it.notes}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {isCoach && viewWorkout && (
                <Button variant="destructive" size="sm" onClick={() => deleteWorkout(viewWorkout.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              )}
              {isPlayer && viewWorkout?.status !== "completed" && viewWorkout && (
                <Button onClick={() => markCompleted(viewWorkout)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como concluído
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Workouts;
