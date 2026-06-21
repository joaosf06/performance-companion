import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, parse, startOfMonth, endOfMonth, addMonths, isBefore } from "date-fns";
import { pt } from "date-fns/locale";
import { Trash2, Plus, CalendarDays, Clock, Users as UsersIcon, Ban, AlertCircle } from "lucide-react";
import {
  buildSlots,
  bookingKey,
  formatTime,
  slotEndTime,
  WEEKDAYS,
  type Booking,
  type DateSlot,
  type RecurringSlot,
  type SlotInstance,
} from "@/lib/bookings";

const Bookings = () => {
  const { user, role, profile, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <Skeleton className="h-64" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Marcações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {role === "coach"
              ? "Define os horários disponíveis e gere as marcações dos teus atletas."
              : `Marca os teus treinos nos horários disponíveis${profile?.full_name ? "" : ""}.`}
          </p>
        </div>
        {role === "coach" ? <CoachBookings userId={user!.id} /> : <PlayerBookings userId={user!.id} />}
      </div>
    </Layout>
  );
};

export default Bookings;

/* -------------------- COACH -------------------- */

const CoachBookings = ({ userId }: { userId: string }) => {
  const [tab, setTab] = useState("weekly");
  const [recurring, setRecurring] = useState<RecurringSlot[]>([]);
  const [dateSlots, setDateSlots] = useState<DateSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [minCancelHours, setMinCancelHours] = useState(24);
  const [athleteNames, setAthleteNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [rRes, dRes, bRes, sRes] = await Promise.all([
      supabase.from("coach_recurring_slots").select("*").eq("coach_id", userId).order("weekday"),
      supabase.from("coach_date_slots").select("*").eq("coach_id", userId).order("slot_date"),
      supabase
        .from("bookings")
        .select("*")
        .eq("coach_id", userId)
        .gte("slot_date", format(new Date(), "yyyy-MM-dd"))
        .order("slot_date"),
      supabase.from("coach_schedule_settings").select("*").eq("coach_id", userId).maybeSingle(),
    ]);
    setRecurring((rRes.data ?? []) as RecurringSlot[]);
    setDateSlots((dRes.data ?? []) as DateSlot[]);
    setBookings((bRes.data ?? []) as Booking[]);
    if (sRes.data) setMinCancelHours(sRes.data.min_cancel_hours);
    // load athlete names
    const ids = [...new Set((bRes.data ?? []).map((b: any) => b.athlete_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      setAthleteNames(Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p.full_name])));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("coach-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `coach_id=eq.${userId}` }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveSettings = async (val: number) => {
    setMinCancelHours(val);
    const { error } = await supabase
      .from("coach_schedule_settings")
      .upsert({ coach_id: userId, min_cancel_hours: val });
    if (error) toast.error("Erro a guardar configuração");
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="weekly">Horário Semanal</TabsTrigger>
        <TabsTrigger value="dates">Datas Específicas</TabsTrigger>
        <TabsTrigger value="bookings">Reservas ({bookings.length})</TabsTrigger>
        <TabsTrigger value="settings">Definições</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="mt-6">
        <WeeklySlots coachId={userId} slots={recurring} onChange={loadAll} loading={loading} />
      </TabsContent>

      <TabsContent value="dates" className="mt-6">
        <DateSlotsManager coachId={userId} items={dateSlots} onChange={loadAll} loading={loading} />
      </TabsContent>

      <TabsContent value="bookings" className="mt-6">
        <BookingsList bookings={bookings} athleteNames={athleteNames} onChange={loadAll} canCancel loading={loading} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Definições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Antecedência mínima para cancelamento (horas)</Label>
              <Input
                type="number"
                min={0}
                value={minCancelHours}
                onChange={(e) => saveSettings(Number(e.target.value) || 0)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Os atletas não conseguem cancelar marcações com menos de {minCancelHours}h de antecedência.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

/* Weekly recurring */
const WeeklySlots = ({
  coachId,
  slots,
  onChange,
  loading,
}: {
  coachId: string;
  slots: RecurringSlot[];
  onChange: () => void;
  loading: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("1");

  const add = async () => {
    const { error } = await supabase.from("coach_recurring_slots").insert({
      coach_id: coachId,
      weekday: Number(weekday),
      start_time: startTime,
      duration_minutes: Number(duration),
      capacity: Number(capacity),
    });
    if (error) return toast.error("Erro a criar slot");
    toast.success("Slot adicionado");
    setOpen(false);
    onChange();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coach_recurring_slots").delete().eq("id", id);
    if (error) return toast.error("Erro a remover");
    onChange();
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("coach_recurring_slots").update({ active }).eq("id", id);
    if (error) return toast.error("Erro");
    onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Blocos recorrentes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo bloco semanal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Dia da semana</Label>
                <Select value={weekday} onValueChange={setWeekday}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora de início</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[30, 45, 60, 75, 90, 120].map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Capacidade (atletas)</Label>
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1" />
              </div>
            </div>
            <DialogFooter><Button onClick={add}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-24" /> : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem horários definidos. Adiciona um bloco semanal para começar.</p>
        ) : (
          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{WEEKDAYS[s.weekday]}</Badge>
                  <span className="text-sm text-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(s.start_time)} – {slotEndTime(s.start_time, s.duration_minutes)}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><UsersIcon className="h-3 w-3" />{s.capacity}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={s.active} onCheckedChange={(v) => toggle(s.id, v)} />
                    <span className="text-xs text-muted-foreground">{s.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* Date-specific slots / blocks */
const DateSlotsManager = ({
  coachId,
  items,
  onChange,
  loading,
}: {
  coachId: string;
  items: DateSlot[];
  onChange: () => void;
  loading: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"slot" | "block-day" | "block-slot">("slot");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("1");
  const [note, setNote] = useState("");

  const add = async () => {
    if (!date) return;
    const payload: any = {
      coach_id: coachId,
      slot_date: format(date, "yyyy-MM-dd"),
      note: note || null,
    };
    if (mode === "block-day") {
      payload.is_blocked = true;
    } else if (mode === "block-slot") {
      payload.is_blocked = true;
      payload.start_time = startTime;
    } else {
      payload.start_time = startTime;
      payload.duration_minutes = Number(duration);
      payload.capacity = Number(capacity);
    }
    const { error } = await supabase.from("coach_date_slots").insert(payload);
    if (error) return toast.error("Erro a adicionar");
    toast.success("Adicionado");
    setOpen(false);
    setNote("");
    onChange();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coach_date_slots").delete().eq("id", id);
    if (error) return toast.error("Erro");
    onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Datas específicas e bloqueios</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova entrada</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slot">Slot pontual</SelectItem>
                    <SelectItem value="block-slot">Bloquear horário específico</SelectItem>
                    <SelectItem value="block-day">Bloquear dia inteiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <div className="mt-1 rounded-md border border-border p-2">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="pointer-events-auto" />
                </div>
              </div>
              {mode !== "block-day" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hora</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
                  </div>
                  {mode === "slot" && (
                    <div>
                      <Label>Duração (min)</Label>
                      <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" />
                    </div>
                  )}
                </div>
              )}
              {mode === "slot" && (
                <div>
                  <Label>Capacidade</Label>
                  <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1" />
                </div>
              )}
              <div>
                <Label>Nota (opcional)</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" placeholder="Ex: Férias, treino especial" />
              </div>
            </div>
            <DialogFooter><Button onClick={add}>Adicionar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-24" /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem entradas pontuais.</p>
        ) : (
          <div className="space-y-2">
            {items.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={d.is_blocked ? "destructive" : "default"}>
                    {d.is_blocked ? <><Ban className="h-3 w-3 mr-1" />Bloqueado</> : "Slot"}
                  </Badge>
                  <span className="text-sm text-foreground">{format(parse(d.slot_date, "yyyy-MM-dd", new Date()), "EEE, d MMM yyyy", { locale: pt })}</span>
                  {d.start_time && <span className="text-sm text-muted-foreground">{formatTime(d.start_time)}{d.duration_minutes ? ` (${d.duration_minutes}min)` : ""}</span>}
                  {d.capacity && !d.is_blocked && <span className="text-sm text-muted-foreground">· {d.capacity} vagas</span>}
                  {d.note && <span className="text-xs text-muted-foreground italic">{d.note}</span>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* Bookings list (coach) */
const BookingsList = ({
  bookings,
  athleteNames,
  onChange,
  canCancel,
  loading,
}: {
  bookings: Booking[];
  athleteNames: Record<string, string>;
  onChange: () => void;
  canCancel: boolean;
  loading: boolean;
}) => {
  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error("Erro a cancelar");
    toast.success("Marcação cancelada");
    onChange();
  };

  // group by date
  const grouped = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const arr = m.get(b.slot_date) ?? [];
      arr.push(b);
      m.set(b.slot_date, arr);
    });
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  if (loading) return <Skeleton className="h-32" />;
  if (bookings.length === 0)
    return <p className="text-sm text-muted-foreground">Sem reservas futuras.</p>;

  return (
    <div className="space-y-4">
      {grouped.map(([date, items]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-base">{format(parse(date, "yyyy-MM-dd", new Date()), "EEEE, d 'de' MMMM yyyy", { locale: pt })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-md bg-secondary/30 border border-border p-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatTime(b.start_time)} – {slotEndTime(b.start_time, b.duration_minutes)}</span>
                  <span className="text-sm text-foreground">{athleteNames[b.athlete_id] ?? "Atleta"}</span>
                </div>
                {canCancel && (
                  <Button size="sm" variant="ghost" onClick={() => cancel(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* -------------------- PLAYER -------------------- */

const PlayerBookings = ({ userId }: { userId: string }) => {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [recurring, setRecurring] = useState<RecurringSlot[]>([]);
  const [dateSlots, setDateSlots] = useState<DateSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [minCancelHours, setMinCancelHours] = useState(24);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // load coach
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("coach_athletes")
        .select("coach_id")
        .eq("athlete_id", userId)
        .limit(1)
        .maybeSingle();
      if (data?.coach_id) {
        setCoachId(data.coach_id);
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", data.coach_id).maybeSingle();
        setCoachName(prof?.full_name ?? "");
      } else {
        setLoading(false);
      }
    })();
  }, [userId]);

  const loadAll = async () => {
    if (!coachId) return;
    setLoading(true);
    const monthStart = startOfMonth(month);
    const rangeEnd = endOfMonth(addMonths(month, 1));
    const [rRes, dRes, bRes, sRes] = await Promise.all([
      supabase.from("coach_recurring_slots").select("*").eq("coach_id", coachId).eq("active", true),
      supabase
        .from("coach_date_slots")
        .select("*")
        .eq("coach_id", coachId)
        .gte("slot_date", format(monthStart, "yyyy-MM-dd"))
        .lte("slot_date", format(rangeEnd, "yyyy-MM-dd")),
      supabase
        .from("bookings")
        .select("*")
        .eq("coach_id", coachId)
        .gte("slot_date", format(monthStart, "yyyy-MM-dd"))
        .lte("slot_date", format(rangeEnd, "yyyy-MM-dd")),
      supabase.from("coach_schedule_settings").select("min_cancel_hours").eq("coach_id", coachId).maybeSingle(),
    ]);
    setRecurring((rRes.data ?? []) as RecurringSlot[]);
    setDateSlots((dRes.data ?? []) as DateSlot[]);
    setBookings((bRes.data ?? []) as Booking[]);
    if (sRes.data) setMinCancelHours(sRes.data.min_cancel_hours);
    setLoading(false);
  };

  useEffect(() => {
    if (!coachId) return;
    loadAll();
    const ch = supabase
      .channel(`player-bookings-${coachId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `coach_id=eq.${coachId}` }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, month]);

  const instances = useMemo(() => {
    if (!coachId) return [];
    return buildSlots(startOfMonth(month), endOfMonth(addMonths(month, 1)), recurring, dateSlots);
  }, [coachId, month, recurring, dateSlots]);

  const bookingsByKey = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const k = bookingKey(b);
      const arr = m.get(k) ?? [];
      arr.push(b);
      m.set(k, arr);
    });
    return m;
  }, [bookings]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    instances.forEach((i) => {
      const taken = bookingsByKey.get(i.key)?.length ?? 0;
      if (taken < i.capacity) set.add(i.dateISO);
    });
    return set;
  }, [instances, bookingsByKey]);

  const myBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.athlete_id === userId)
        .sort((a, b) =>
          a.slot_date === b.slot_date ? a.start_time.localeCompare(b.start_time) : a.slot_date.localeCompare(b.slot_date),
        ),
    [bookings, userId],
  );

  if (!coachId && !loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Sem treinador associado</p>
            <p className="text-sm text-muted-foreground">Quando estiveres associado a um treinador podes marcar treinos aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedISO = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const todaySlots = instances.filter((i) => i.dateISO === selectedISO);

  const book = async (slot: SlotInstance) => {
    if (!coachId) return;
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      coach_id: coachId,
      athlete_id: userId,
      slot_date: slot.dateISO,
      start_time: slot.startTime,
      duration_minutes: slot.durationMinutes,
      source: slot.source,
      source_id: slot.sourceId,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("Já tens uma marcação neste horário");
      else toast.error("Erro a marcar: " + error.message);
      return;
    }
    toast.success("Treino marcado!");
  };

  const cancelBooking = async (b: Booking) => {
    const dt = new Date(`${b.slot_date}T${b.start_time}`);
    const hoursLeft = (dt.getTime() - Date.now()) / 36e5;
    if (hoursLeft < minCancelHours) {
      toast.error(`Só podes cancelar com ${minCancelHours}h de antecedência`);
      return;
    }
    const { error } = await supabase.from("bookings").delete().eq("id", b.id);
    if (error) return toast.error("Erro a cancelar");
    toast.success("Marcação cancelada");
  };

  const canCancel = (b: Booking) => {
    const dt = new Date(`${b.slot_date}T${b.start_time}`);
    return (dt.getTime() - Date.now()) / 36e5 >= minCancelHours;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <Card className="lg:w-fit">
        <CardHeader>
          <CardTitle className="text-base">Treinador: <span className="text-primary">{coachName}</span></CardTitle>
          <p className="text-xs text-muted-foreground">Dias com vagas a verde</p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            locale={pt}
            disabled={(d) => isBefore(d, new Date(new Date().setHours(0, 0, 0, 0)))}
            modifiers={{ available: (d) => availableDates.has(format(d, "yyyy-MM-dd")) }}
            modifiersClassNames={{ available: "bg-primary/15 text-primary font-semibold" }}
            className="pointer-events-auto"
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt }) : "Seleciona um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-24" />
            ) : todaySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem horários disponíveis neste dia.</p>
            ) : (
              todaySlots.map((s) => {
                const slotBookings = bookingsByKey.get(s.key) ?? [];
                const taken = slotBookings.length;
                const left = s.capacity - taken;
                const mine = slotBookings.find((b) => b.athlete_id === userId);
                const isPast = new Date(`${s.dateISO}T${s.startTime}`).getTime() < Date.now();
                return (
                  <div key={s.key} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{formatTime(s.startTime)} – {slotEndTime(s.startTime, s.durationMinutes)}</span>
                      <Badge variant={left === 0 ? "secondary" : left <= Math.ceil(s.capacity / 3) ? "destructive" : "default"}>
                        {taken}/{s.capacity} {left === 0 ? "lotado" : `vagas (${left})`}
                      </Badge>
                    </div>
                    {mine ? (
                      <Button size="sm" variant="outline" disabled={!canCancel(mine)} onClick={() => cancelBooking(mine)}>
                        Cancelar
                      </Button>
                    ) : (
                      <Button size="sm" disabled={left === 0 || submitting || isPast} onClick={() => book(s)}>
                        Reservar
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">As minhas marcações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem marcações futuras.</p>
            ) : (
              myBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {format(parse(b.slot_date, "yyyy-MM-dd", new Date()), "EEE, d MMM", { locale: pt })}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatTime(b.start_time)} – {slotEndTime(b.start_time, b.duration_minutes)}</span>
                  </div>
                  <Button size="sm" variant="ghost" disabled={!canCancel(b)} onClick={() => cancelBooking(b)} title={!canCancel(b) ? `Cancelamento requer ${minCancelHours}h de antecedência` : ""}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
