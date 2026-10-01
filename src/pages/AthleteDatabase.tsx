import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, X } from "lucide-react";

interface Row {
  user_id: string;
  full_name: string;
  short_id: string | null;
  birth_date: string | null;
  phone: string | null;
  guardian_phone: string | null;
  instagram: string | null;
  position: string | null;
  age_group: string | null;
  current_club: string | null;
  created_at: string;
  linked: boolean;
}

const ALL = "__all";

const ageOf = (d: string | null) => {
  if (!d) return null;
  const b = new Date(d);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-PT") : "—");

const AthleteDatabase = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [position, setPosition] = useState(ALL);
  const [ageGroup, setAgeGroup] = useState(ALL);
  const [club, setClub] = useState(ALL);
  const [linkedF, setLinkedF] = useState(ALL);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "created_at", dir: -1 });

  useEffect(() => {
    if (!user || role !== "coach") return;
    (async () => {
      setLoading(true);
      const [{ data: profiles }, { data: coaches }, { data: links }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, short_id, birth_date, phone, guardian_phone, instagram, position, age_group, current_club, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "coach"),
        supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id),
      ]);
      const coachIds = new Set((coaches || []).map((c) => c.user_id));
      coachIds.add(user.id);
      const linked = new Set((links || []).map((l) => l.athlete_id));
      setRows(
        (profiles || [])
          .filter((p) => !coachIds.has(p.user_id))
          .map((p) => ({ ...p, linked: linked.has(p.user_id) })) as Row[],
      );
      setLoading(false);
    })();
  }, [user, role]);

  const uniq = (k: keyof Row) =>
    Array.from(new Set(rows.map((r) => (r[k] as string | null)?.trim()).filter(Boolean) as string[])).sort();
  const positions = useMemo(() => uniq("position"), [rows]);
  const ageGroups = useMemo(() => uniq("age_group"), [rows]);
  const clubs = useMemo(() => uniq("current_club"), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const res = rows.filter((r) => {
      if (s && ![r.full_name, r.short_id, r.phone, r.guardian_phone, r.instagram, r.current_club].some((v) => v?.toLowerCase().includes(s))) return false;
      if (position !== ALL && r.position?.trim() !== position) return false;
      if (ageGroup !== ALL && r.age_group?.trim() !== ageGroup) return false;
      if (club !== ALL && r.current_club?.trim() !== club) return false;
      if (linkedF === "yes" && !r.linked) return false;
      if (linkedF === "no" && r.linked) return false;
      const a = ageOf(r.birth_date);
      if (minAge && (a === null || a < Number(minAge))) return false;
      if (maxAge && (a === null || a > Number(maxAge))) return false;
      return true;
    });
    return res.sort((a, b) => {
      const va = sort.key === "age" ? ageOf(a.birth_date) ?? -1 : ((a as any)[sort.key] ?? "");
      const vb = sort.key === "age" ? ageOf(b.birth_date) ?? -1 : ((b as any)[sort.key] ?? "");
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
    });
  }, [rows, q, position, ageGroup, club, linkedF, minAge, maxAge, sort]);

  if (role !== "coach") return <Navigate to="/dashboard" replace />;

  const reset = () => {
    setQ(""); setPosition(ALL); setAgeGroup(ALL); setClub(ALL); setLinkedF(ALL); setMinAge(""); setMaxAge("");
  };

  const exportCsv = () => {
    const head = ["Código", "Nome", "Data nascimento", "Idade", "Telemóvel", "Tel. Encarregado", "Instagram", "Posição", "Escalão", "Clube", "Meu atleta", "Registo"];
    const lines = filtered.map((r) =>
      [r.short_id, r.full_name, fmt(r.birth_date), ageOf(r.birth_date) ?? "", r.phone, r.guardian_phone, r.instagram, r.position, r.age_group, r.current_club, r.linked ? "Sim" : "Não", fmt(r.created_at)]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["\uFEFF" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atletas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const Th = ({ k, children }: { k: string; children: string }) => (
    <th
      className="cursor-pointer whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
      onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((-s.dir) as 1 | -1) : 1 }))}
    >
      {children} {sort.key === k ? (sort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );

  const SelectF = ({ value, onChange, label, items }: { value: string; onChange: (v: string) => void; label: string; items: string[] }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Base de Dados</h1>
            <p className="mt-1 text-muted-foreground">Todos os atletas registados na plataforma.</p>
          </div>
          <Button onClick={exportCsv} variant="outline" disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar Excel (CSV)
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total registados</p><p className="text-2xl font-bold text-foreground">{rows.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Resultados do filtro</p><p className="text-2xl font-bold text-foreground">{filtered.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Meus atletas</p><p className="text-2xl font-bold text-foreground">{rows.filter((r) => r.linked).length}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar nome, código, telemóvel, instagram, clube..." className="bg-background pl-9" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <SelectF value={position} onChange={setPosition} label="Posição" items={positions} />
              <SelectF value={ageGroup} onChange={setAgeGroup} label="Escalão" items={ageGroups} />
              <SelectF value={club} onChange={setClub} label="Clube" items={clubs} />
              <Select value={linkedF} onValueChange={setLinkedF}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Associação: todos</SelectItem>
                  <SelectItem value="yes">Meus atletas</SelectItem>
                  <SelectItem value="no">Não associados</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Idade mín." className="bg-background" />
              <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="Idade máx." className="bg-background" />
            </div>
            <Button variant="ghost" size="sm" onClick={reset}><X className="mr-1 h-4 w-4" /> Limpar filtros</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">A carregar...</p>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nenhum atleta encontrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <Th k="short_id">Código</Th>
                    <Th k="full_name">Nome</Th>
                    <Th k="age">Idade</Th>
                    <Th k="position">Posição</Th>
                    <Th k="age_group">Escalão</Th>
                    <Th k="current_club">Clube</Th>
                    <Th k="phone">Telemóvel</Th>
                    <Th k="guardian_phone">Encarregado</Th>
                    <Th k="instagram">Instagram</Th>
                    <Th k="created_at">Registo</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.user_id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="px-3 py-2 text-muted-foreground">#{r.short_id}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                        {r.linked ? <Link to={`/athletes/${r.user_id}`} className="hover:text-primary">{r.full_name || "Sem nome"}</Link> : r.full_name || "Sem nome"}
                        {r.linked && <Badge variant="outline" className="ml-2">Meu</Badge>}
                      </td>
                      <td className="px-3 py-2">{ageOf(r.birth_date) ?? "—"}<span className="block text-xs text-muted-foreground">{fmt(r.birth_date)}</span></td>
                      <td className="px-3 py-2">{r.position || "—"}</td>
                      <td className="px-3 py-2">{r.age_group || "—"}</td>
                      <td className="px-3 py-2">{r.current_club || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.phone ? <a href={`tel:${r.phone}`} className="hover:text-primary">{r.phone}</a> : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.guardian_phone ? <a href={`tel:${r.guardian_phone}`} className="hover:text-primary">{r.guardian_phone}</a> : "—"}</td>
                      <td className="px-3 py-2">{r.instagram ? <a href={`https://instagram.com/${r.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-primary">@{r.instagram.replace(/^@/, "")}</a> : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{fmt(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AthleteDatabase;
