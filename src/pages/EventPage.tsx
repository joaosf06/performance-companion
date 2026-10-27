import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SiteLogo from "@/components/site-editor/SiteLogo";
import BucketAssetPicker from "@/components/site-editor/BucketAssetPicker";
import { uploadSiteAsset } from "@/lib/siteAssets";
import { BLOCK_LABELS, newBlock, uid, videoEmbed, type EventBlock, type EventRow, type FormField } from "@/lib/events";
import { ArrowDown, ArrowUp, ArrowLeft, Check, Download, Images, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const cell = "border border-border px-3 py-2 text-sm";

const MediaPicker = ({ url, onChange, images }: { url: string; onChange: (u: string) => void; images: boolean }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input placeholder={images ? "Link da foto" : "Link do YouTube / Vimeo ou ficheiro"} value={url} onChange={(e) => onChange(e.target.value)} className="min-w-[200px] flex-1" />
      {images && <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Images className="mr-1 h-4 w-4" />Fotos guardadas</Button>}
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
        <label className="cursor-pointer"><Upload className="mr-1 h-4 w-4" />{busy ? "A carregar..." : "Carregar"}
          <input type="file" hidden accept={images ? "image/*" : "video/*"} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 50 * 1024 * 1024) return toast.error("Máximo 50 MB");
            setBusy(true);
            try { onChange(await uploadSiteAsset(f)); } catch { toast.error("Falhou o carregamento"); } finally { setBusy(false); }
          }} />
        </label>
      </Button>
      <BucketAssetPicker open={open} onOpenChange={setOpen} onSelect={(a) => onChange(a.url)} />
    </div>
  );
};

const RegistrationForm = ({ block, eventId }: { block: Extract<EventBlock, { type: "form" }>; eventId: string }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of block.fields) {
      const v = (values[f.id] ?? "").trim();
      if (f.required && !v) return toast.error(`Preenche "${f.label}"`);
      if (v.length > 500) return toast.error(`"${f.label}" é demasiado longo`);
      if (v && f.type === "email" && !z.string().email().safeParse(v).success) return toast.error("Email inválido");
    }
    const data = Object.fromEntries(block.fields.map((f) => [f.label, (values[f.id] ?? "").trim()]));
    setBusy(true);
    const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, block_id: block.id, data });
    setBusy(false);
    if (error) return toast.error("Não foi possível enviar a inscrição");
    setSent(true);
  };
  if (sent) return <p className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">Inscrição enviada. Obrigado!</p>;
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {block.fields.map((f) => (
        <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2 space-y-1" : "space-y-1"}>
          <Label>{f.label}{f.required && " *"}</Label>
          {f.type === "textarea"
            ? <Textarea maxLength={500} value={values[f.id] ?? ""} onChange={(e) => setValues({ ...values, [f.id]: e.target.value })} />
            : <Input type={f.type} maxLength={500} value={values[f.id] ?? ""} onChange={(e) => setValues({ ...values, [f.id]: e.target.value })} />}
        </div>
      ))}
      <Button type="submit" disabled={busy} className="sm:col-span-2 sm:w-fit">{busy ? "A enviar..." : block.button}</Button>
    </form>
  );
};

const Registrations = ({ eventId, blockId }: { eventId: string; blockId: string }) => {
  const [rows, setRows] = useState<{ id: string; created_at: string; data: Record<string, string> }[] | null>(null);
  const load = async () => {
    const { data } = await supabase.from("event_registrations").select("id,created_at,data").eq("event_id", eventId).eq("block_id", blockId).order("created_at");
    setRows((data as never) ?? []);
  };
  if (!rows) return <Button variant="outline" size="sm" onClick={load}>Ver inscrições</Button>;
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r.data))));
  const exportCsv = () => {
    const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = [["Data", ...cols].map(esc).join(";"), ...rows.map((r) => [new Date(r.created_at).toLocaleString("pt-PT"), ...cols.map((c) => r.data[c])].map(esc).join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "inscricoes.csv"; a.click();
  };
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between"><p className="text-sm font-semibold">{rows.length} inscrições</p>
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Exportar</Button></div>
      <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr><th className={cell}>Data</th>{cols.map((c) => <th key={c} className={cell}>{c}</th>)}<th className={cell} /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className={cell}>{new Date(r.created_at).toLocaleDateString("pt-PT")}</td>{cols.map((c) => <td key={c} className={cell}>{r.data[c]}</td>)}
          <td className={cell}><button onClick={async () => { await supabase.from("event_registrations").delete().eq("id", r.id); load(); }}><Trash2 className="h-4 w-4 text-destructive" /></button></td></tr>)}</tbody></table></div>
    </div>
  );
};

const BlockView = ({ b, eventId, isCoach }: { b: EventBlock; eventId: string; isCoach: boolean }) => {
  switch (b.type) {
    case "text": return <div><h2 className="font-display text-2xl font-bold">{b.title}</h2><p className="mt-3 whitespace-pre-wrap text-muted-foreground">{b.body}</p></div>;
    case "image": return b.url ? <figure><img src={b.url} alt={b.caption} className="w-full rounded-xl border border-border" loading="lazy" />{b.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{b.caption}</figcaption>}</figure> : null;
    case "video": {
      if (!b.url) return null;
      const embed = videoEmbed(b.url);
      return <figure>{embed ? <iframe src={embed} title={b.caption || "Vídeo"} className="aspect-video w-full rounded-xl" allowFullScreen /> : <video src={b.url} controls className="w-full rounded-xl" />}{b.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{b.caption}</figcaption>}</figure>;
    }
    case "form": return <div className="space-y-4 rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl font-bold">{b.title}</h2><RegistrationForm block={b} eventId={eventId} />{isCoach && <Registrations eventId={eventId} blockId={b.id} />}</div>;
    case "table": return <div><h2 className="mb-3 font-display text-2xl font-bold">{b.title}</h2><div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>{b.headers.map((h, i) => <th key={i} className={`${cell} bg-secondary text-left`}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={cell}>{c}</td>)}</tr>)}</tbody></table></div></div>;
    case "scorers": return <div><h2 className="mb-3 font-display text-2xl font-bold">{b.title}</h2><table className="w-full border-collapse"><thead><tr><th className={`${cell} bg-secondary`}>#</th><th className={`${cell} bg-secondary text-left`}>Jogador</th><th className={`${cell} bg-secondary text-left`}>Equipa</th><th className={`${cell} bg-secondary`}>Golos</th></tr></thead>
      <tbody>{[...b.rows].sort((x, y) => y.goals - x.goals).map((r, i) => <tr key={i}><td className={`${cell} text-center font-bold ${i === 0 ? "text-primary" : ""}`}>{i + 1}</td><td className={cell}>{r.name}</td><td className={cell}>{r.team}</td><td className={`${cell} text-center font-bold`}>{r.goals}</td></tr>)}</tbody></table></div>;
    case "matches": return <div><h2 className="mb-3 font-display text-2xl font-bold">{b.title}</h2><div className="space-y-2">{b.rows.map((m, i) => (
      <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-card p-3">
        <span className="text-right font-medium">{m.home}</span>
        <span className="rounded-md bg-secondary px-3 py-1 font-display font-bold">{m.homeScore || "-"} : {m.awayScore || "-"}</span>
        <span className="font-medium">{m.away}</span>
        {m.date && <span className="col-span-3 text-center text-xs text-muted-foreground">{m.date}</span>}
      </div>))}</div></div>;
  }
};

const BlockEditor = ({ b, set }: { b: EventBlock; set: (b: EventBlock) => void }) => {
  switch (b.type) {
    case "text": return <div className="space-y-2"><Input value={b.title} onChange={(e) => set({ ...b, title: e.target.value })} placeholder="Título" /><Textarea rows={5} value={b.body} onChange={(e) => set({ ...b, body: e.target.value })} /></div>;
    case "image": case "video": return <div className="space-y-2"><MediaPicker images={b.type === "image"} url={b.url} onChange={(url) => set({ ...b, url })} /><Input value={b.caption} placeholder="Legenda (opcional)" onChange={(e) => set({ ...b, caption: e.target.value })} />{b.url && <BlockView b={b} eventId="" isCoach={false} />}</div>;
    case "form": {
      const upd = (i: number, p: Partial<FormField>) => set({ ...b, fields: b.fields.map((f, j) => j === i ? { ...f, ...p } : f) });
      return <div className="space-y-2">
        <div className="flex gap-2"><Input value={b.title} onChange={(e) => set({ ...b, title: e.target.value })} placeholder="Título" /><Input value={b.button} onChange={(e) => set({ ...b, button: e.target.value })} placeholder="Texto do botão" className="w-40" /></div>
        {b.fields.map((f, i) => <div key={f.id} className="flex flex-wrap items-center gap-2">
          <Input value={f.label} onChange={(e) => upd(i, { label: e.target.value })} className="flex-1 min-w-[150px]" />
          <select value={f.type} onChange={(e) => upd(i, { type: e.target.value as FormField["type"] })} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
            <option value="text">Texto</option><option value="email">Email</option><option value="tel">Telemóvel</option><option value="number">Número</option><option value="textarea">Texto longo</option></select>
          <label className="flex items-center gap-1 text-xs"><Switch checked={f.required} onCheckedChange={(v) => upd(i, { required: v })} />Obrigatório</label>
          <Button size="icon" variant="ghost" onClick={() => set({ ...b, fields: b.fields.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
        <Button size="sm" variant="outline" onClick={() => set({ ...b, fields: [...b.fields, { id: uid(), label: "Nova pergunta", type: "text", required: false }] })}><Plus className="mr-1 h-4 w-4" />Campo</Button>
      </div>;
    }
    case "table": return <div className="space-y-2"><Input value={b.title} onChange={(e) => set({ ...b, title: e.target.value })} />
      <div className="overflow-x-auto"><table className="border-collapse"><thead><tr>{b.headers.map((h, i) => <th key={i} className="p-1"><div className="flex"><Input value={h} className="min-w-[90px] font-semibold" onChange={(e) => set({ ...b, headers: b.headers.map((x, j) => j === i ? e.target.value : x) })} />
        <Button size="icon" variant="ghost" onClick={() => set({ ...b, headers: b.headers.filter((_, j) => j !== i), rows: b.rows.map((r) => r.filter((_, j) => j !== i)) })}><X className="h-3 w-3" /></Button></div></th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="p-1"><Input value={c} className="min-w-[90px]" onChange={(e) => set({ ...b, rows: b.rows.map((row, ri) => ri === i ? row.map((x, cj) => cj === j ? e.target.value : x) : row) })} /></td>)}
          <td><Button size="icon" variant="ghost" onClick={() => set({ ...b, rows: b.rows.filter((_, ri) => ri !== i) })}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>
      <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => set({ ...b, rows: [...b.rows, b.headers.map(() => "")] })}><Plus className="mr-1 h-4 w-4" />Linha</Button>
        <Button size="sm" variant="outline" onClick={() => set({ ...b, headers: [...b.headers, "Coluna"], rows: b.rows.map((r) => [...r, ""]) })}><Plus className="mr-1 h-4 w-4" />Coluna</Button></div></div>;
    case "scorers": return <div className="space-y-2"><Input value={b.title} onChange={(e) => set({ ...b, title: e.target.value })} />
      {b.rows.map((r, i) => { const u = (p: Partial<typeof r>) => set({ ...b, rows: b.rows.map((x, j) => j === i ? { ...x, ...p } : x) }); return <div key={i} className="flex gap-2">
        <Input value={r.name} placeholder="Jogador" onChange={(e) => u({ name: e.target.value })} /><Input value={r.team} placeholder="Equipa" onChange={(e) => u({ team: e.target.value })} />
        <Button size="icon" variant="outline" onClick={() => u({ goals: Math.max(0, r.goals - 1) })}>-</Button><span className="w-8 self-center text-center font-bold">{r.goals}</span><Button size="icon" variant="outline" onClick={() => u({ goals: r.goals + 1 })}>+</Button>
        <Button size="icon" variant="ghost" onClick={() => set({ ...b, rows: b.rows.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>; })}
      <Button size="sm" variant="outline" onClick={() => set({ ...b, rows: [...b.rows, { name: "", team: "", goals: 0 }] })}><Plus className="mr-1 h-4 w-4" />Marcador</Button></div>;
    case "matches": return <div className="space-y-2"><Input value={b.title} onChange={(e) => set({ ...b, title: e.target.value })} />
      {b.rows.map((m, i) => { const u = (p: Partial<typeof m>) => set({ ...b, rows: b.rows.map((x, j) => j === i ? { ...x, ...p } : x) }); return <div key={i} className="flex flex-wrap gap-2">
        <Input value={m.date} placeholder="Data / hora" className="w-36" onChange={(e) => u({ date: e.target.value })} /><Input value={m.home} placeholder="Casa" className="flex-1 min-w-[100px]" onChange={(e) => u({ home: e.target.value })} />
        <Input value={m.homeScore} className="w-14 text-center" onChange={(e) => u({ homeScore: e.target.value })} /><Input value={m.awayScore} className="w-14 text-center" onChange={(e) => u({ awayScore: e.target.value })} />
        <Input value={m.away} placeholder="Fora" className="flex-1 min-w-[100px]" onChange={(e) => u({ away: e.target.value })} />
        <Button size="icon" variant="ghost" onClick={() => set({ ...b, rows: b.rows.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>; })}
      <Button size="sm" variant="outline" onClick={() => set({ ...b, rows: [...b.rows, { date: "", home: "", away: "", homeScore: "", awayScore: "" }] })}><Plus className="mr-1 h-4 w-4" />Jogo</Button></div>;
  }
};

const EventPage = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isCoach = role === "coach";
  const [ev, setEv] = useState<EventRow | null>(null);
  const [draft, setDraft] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editing = !!draft;

  useEffect(() => {
    supabase.from("events").select("*").eq("slug", slug ?? "").maybeSingle().then(({ data }) => {
      const row = data ? ({ ...data, blocks: (data.blocks as unknown as EventBlock[]) ?? [] } as EventRow) : null;
      setEv(row); setLoading(false);
    });
  }, [slug, role]);

  useEffect(() => { if (ev && isCoach && params.get("edit") === "1" && !draft) setDraft(ev); }, [ev, isCoach]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("events").update({ title: draft.title, subtitle: draft.subtitle, cover_url: draft.cover_url, published: draft.published, blocks: draft.blocks as unknown as Json, updated_at: new Date().toISOString() }).eq("id", draft.id);
    setSaving(false);
    if (error) return toast.error("Não foi possível guardar");
    setEv(draft); setDraft(null); toast.success("Evento guardado");
  };

  const remove = async () => {
    if (!ev || !confirm("Apagar este evento e todas as inscrições?")) return;
    await supabase.from("events").delete().eq("id", ev.id);
    navigate("/#eventos");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!ev) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"><p>Evento não encontrado.</p><Link to="/" className="text-primary">Voltar à página inicial</Link></div>;

  const cur = draft ?? ev;
  const setBlocks = (blocks: EventBlock[]) => setDraft({ ...cur, blocks });
  const move = (i: number, d: number) => { const b = [...cur.blocks]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; setBlocks(b); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <Link to="/"><SiteLogo className="h-10 w-auto" /></Link>
        <Link to="/#eventos" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Página inicial</Link>
      </header>

      <div className="relative">
        {cur.cover_url && <img src={cur.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          {editing ? (
            <div className="space-y-3 text-left">
              <Input value={cur.title} onChange={(e) => setDraft({ ...cur, title: e.target.value })} className="text-2xl font-bold" />
              <Textarea value={cur.subtitle ?? ""} placeholder="Descrição curta" onChange={(e) => setDraft({ ...cur, subtitle: e.target.value })} />
              <Label>Foto de capa</Label>
              <MediaPicker images url={cur.cover_url ?? ""} onChange={(u) => setDraft({ ...cur, cover_url: u || null })} />
              <label className="flex items-center gap-2 text-sm"><Switch checked={cur.published} onCheckedChange={(v) => setDraft({ ...cur, published: v })} />Visível para o público</label>
            </div>
          ) : (<>
            <h1 className="font-display text-4xl font-bold md:text-6xl">{cur.title}</h1>
            {cur.subtitle && <p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap text-lg text-muted-foreground">{cur.subtitle}</p>}
            {isCoach && !cur.published && <p className="mt-4 text-sm text-primary">Este evento está escondido do público.</p>}
          </>)}
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-12 px-6 pb-32">
        {cur.blocks.map((b, i) => editing ? (
          <div key={b.id} className="space-y-3 rounded-xl border border-dashed border-primary/50 p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-primary">{BLOCK_LABELS[b.type]}</span>
              <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setBlocks(cur.blocks.filter((x) => x.id !== b.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
            <BlockEditor b={b} set={(nb) => setBlocks(cur.blocks.map((x) => x.id === b.id ? nb : x))} />
          </div>
        ) : <BlockView key={b.id} b={b} eventId={ev.id} isCoach={isCoach} />)}

        {editing && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Adicionar parte</p>
            <div className="flex flex-wrap gap-2">{(Object.keys(BLOCK_LABELS) as EventBlock["type"][]).map((t) => (
              <Button key={t} size="sm" variant="outline" onClick={() => setBlocks([...cur.blocks, newBlock(t)])}><Plus className="mr-1 h-4 w-4" />{BLOCK_LABELS[t]}</Button>))}</div>
          </div>
        )}
      </main>

      {isCoach && (
        <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
          {editing ? (<>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Apagar evento</Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={saving}><X className="mr-1 h-4 w-4" />Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving}><Check className="mr-1 h-4 w-4" />{saving ? "A guardar..." : "Guardar"}</Button>
          </>) : <Button size="sm" variant="outline" onClick={() => setDraft(ev)}><Pencil className="mr-1 h-4 w-4" />Editar evento</Button>}
        </div>
      )}
    </div>
  );
};

export default EventPage;
