import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Loader2, Sparkles, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

type Ev = { id: string; slug: string; title: string };
type FieldStat = { label: string; required: boolean; private: boolean; filled: number; missing: number; categories: { value: string; count: number }[] | null };
type Result = { total: number; summary: string | null; aiError?: string; stats: { formTitle: string; total: number; fields: FieldStat[] }[] };

const EventSummary = ({ ev, count }: { ev: Ev; count: number }) => {
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("event-registrations-summary", { body: { eventId: ev.id } });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error ?? "Não foi possível gerar o resumo");
    setRes(data as Result);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/eventos/${ev.slug}`} className="font-semibold hover:text-primary">{ev.title}</Link>
          <p className="text-xs text-muted-foreground">{count} inscrições</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {res ? "Atualizar resumo" : "Gerar resumo"}
        </Button>
      </div>
      {res && (
        <div className="mt-4 space-y-4">
          {res.summary ? (
            <p className="whitespace-pre-wrap rounded-md bg-secondary/40 p-3 text-sm">{res.summary}</p>
          ) : res.aiError ? (
            <p className="text-sm text-destructive">{res.aiError} Os totais abaixo continuam certos.</p>
          ) : null}
          {res.stats.map((f, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium">{f.formTitle} · {f.total} inscrições</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {f.fields.map((fl) => (
                  <div key={fl.label} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-medium">{fl.private && <Lock className="h-3 w-3 text-muted-foreground" />}{fl.label}</span>
                      {fl.missing > 0 ? (
                        <Badge variant={fl.required ? "destructive" : "secondary"} className="gap-1"><AlertTriangle className="h-3 w-3" />{fl.missing} em falta</Badge>
                      ) : <Badge variant="secondary">Completo</Badge>}
                    </div>
                    {fl.categories && fl.categories.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {fl.categories.map((c) => <li key={c.value} className="flex justify-between gap-2"><span className="truncate">{c.value}</span><span>{c.count}</span></li>)}
                      </ul>
                    )}
                    {fl.private && <p className="mt-1 text-xs text-muted-foreground">{fl.filled} preenchidos · dados privados não mostrados</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EventRegistrationsSummaryCard = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("id,slug,title").order("created_at", { ascending: false });
      setEvents((data as Ev[]) ?? []);
      const { data: regs } = await supabase.from("event_registrations").select("event_id");
      const c: Record<string, number> = {};
      (regs ?? []).forEach((r) => { c[r.event_id] = (c[r.event_id] ?? 0) + 1; });
      setCounts(c);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-primary" /> Inscrições nos eventos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há eventos.</p>
        ) : events.map((e) => <EventSummary key={e.id} ev={e} count={counts[e.id] ?? 0} />)}
      </CardContent>
    </Card>
  );
};

export default EventRegistrationsSummaryCard;
