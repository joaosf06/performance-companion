import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Mail, MessageCircle, Phone, Search, Trash2, X, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { TRIAL_STATUSES, whatsappNumber } from "@/lib/freeTrial";

type Req = Database["public"]["Tables"]["free_trial_requests"]["Row"];
const ALL = "__all";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—");
const statusLabel = (v: string) => TRIAL_STATUSES.find((s) => s.value === v)?.label ?? v;

const FreeTrialRequests = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [position, setPosition] = useState(ALL);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [desc, setDesc] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || role !== "coach") return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("free_trial_requests").select("*").order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar pedidos");
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user, role]);

  const levels = useMemo(() => [...new Set(rows.map((r) => r.level))].sort(), [rows]);
  const positions = useMemo(() => [...new Set(rows.map((r) => r.position))].sort(), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return rows
      .filter((r) => status === ALL || r.status === status)
      .filter((r) => level === ALL || r.level === level)
      .filter((r) => position === ALL || r.position === position)
      .filter((r) => !minAge || r.age >= Number(minAge))
      .filter((r) => !maxAge || r.age <= Number(maxAge))
      .filter((r) => {
        if (!term) return true;
        if (r.full_name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)) return true;
        return !!digits && (r.phone ?? "").replace(/\D/g, "").includes(digits);
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1) * (desc ? 1 : -1));
  }, [rows, q, status, level, position, minAge, maxAge, desc]);

  if (role !== "coach") return <Navigate to="/dashboard" replace />;

  const patch = async (id: string, values: Partial<Req>) => {
    const { data, error } = await supabase.from("free_trial_requests").update(values).eq("id", id).select().single();
    if (error || !data) {
      toast.error("Não foi possível guardar");
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? data : r)));
    toast.success("Guardado");
  };

  const changeStatus = (r: Req, value: string) =>
    patch(r.id, value === "contactado" ? { status: value, last_contacted_at: new Date().toISOString() } : { status: value });

  const remove = async (id: string) => {
    const { error } = await supabase.from("free_trial_requests").delete().eq("id", id);
    if (error) return toast.error("Não foi possível apagar");
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Pedido apagado");
  };

  const reset = () => { setQ(""); setStatus(ALL); setLevel(ALL); setPosition(ALL); setMinAge(""); setMaxAge(""); };

  const exportCsv = () => {
    const head = ["Data", "Estado", "Nome", "Email", "Telemóvel", "Idade", "Posição", "Clube", "Escalão", "Pé favorito", "Disponibilidade", "Observações", "Encarregado", "Tel. Encarregado", "Email Encarregado", "Consentimento", "Versão", "Último contacto", "Notas"];
    const lines = filtered.map((r) =>
      [fmt(r.created_at), statusLabel(r.status), r.full_name, r.email, r.phone, r.age, r.position, r.club, r.level, r.preferred_foot, r.availability, r.notes, r.guardian_name, r.guardian_phone, r.guardian_email, fmt(r.consent_accepted_at), r.consent_version, fmt(r.last_contacted_at), r.coach_notes]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["\uFEFF" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos-treino-gratis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos de treino grátis</h1>
            <p className="text-muted-foreground mt-1">{filtered.length} de {rows.length} pedidos</p>
          </div>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
        </div>

        <Card>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Nome, email ou telemóvel" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os estados</SelectItem>
                {TRIAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Escalão" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os escalões</SelectItem>
                {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger><SelectValue placeholder="Posição" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as posições</SelectItem>
                {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="number" placeholder="Idade mín." value={minAge} onChange={(e) => setMinAge(e.target.value)} />
              <Input type="number" placeholder="máx." value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
            </div>
            <div className="flex gap-2 lg:col-span-6">
              <Button variant="ghost" size="sm" onClick={reset}><X className="mr-1 h-4 w-4" />Limpar filtros</Button>
              <Button variant="ghost" size="sm" onClick={() => setDesc((d) => !d)}>
                <ArrowUpDown className="mr-1 h-4 w-4" />{desc ? "Mais recentes primeiro" : "Mais antigos primeiro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem pedidos.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {["Data", "Nome", "Idade", "Posição", "Clube", "Escalão", "Pé", "Disponibilidade", "Observações", "Encarregado / Consentimento", "Estado", "Notas", "Ações"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const wa = whatsappNumber(r.phone);
                  return (
                    <tr key={r.id} className="border-t border-border align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{r.full_name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                        {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                      </td>
                      <td className="px-3 py-2">{r.age}</td>
                      <td className="px-3 py-2">{r.position}</td>
                      <td className="px-3 py-2">{r.club}</td>
                      <td className="px-3 py-2">{r.level}</td>
                      <td className="px-3 py-2">{r.preferred_foot}</td>
                      <td className="px-3 py-2">{r.availability}</td>
                      <td className="px-3 py-2 max-w-[200px] text-xs">{r.notes || "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.guardian_name ? (
                          <div>
                            <div className="text-foreground">{r.guardian_name}</div>
                            <div className="text-muted-foreground">{r.guardian_phone}</div>
                            <div className="text-muted-foreground">{r.guardian_email}</div>
                          </div>
                        ) : <div className="text-muted-foreground">—</div>}
                        <div className="mt-1 text-muted-foreground">
                          {r.consent_accepted_at ? `Consentimento ${r.consent_version ?? ""} · ${fmt(r.consent_accepted_at)}` : "Sem consentimento registado"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Select value={r.status} onValueChange={(v) => changeStatus(r, v)}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRIAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="mt-1 text-xs text-muted-foreground">Último contacto: {fmt(r.last_contacted_at)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Textarea
                          className="min-h-[60px] w-48 text-xs"
                          value={notes[r.id] ?? r.coach_notes ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                          onBlur={() => {
                            const v = notes[r.id];
                            if (v !== undefined && v !== (r.coach_notes ?? "")) patch(r.id, { coach_notes: v || null });
                          }}
                          placeholder="Notas..."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {r.phone && (
                            <Button asChild size="icon" variant="ghost" title="Ligar"><a href={`tel:${r.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" /></a></Button>
                          )}
                          {wa && (
                            <Button asChild size="icon" variant="ghost" title="WhatsApp"><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
                          )}
                          <Button asChild size="icon" variant="ghost" title="Email"><a href={`mailto:${r.email}`}><Mail className="h-4 w-4" /></a></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" title="Apagar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apagar pedido?</AlertDialogTitle>
                                <AlertDialogDescription>O pedido de {r.full_name} será apagado definitivamente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(r.id)}>Apagar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FreeTrialRequests;
