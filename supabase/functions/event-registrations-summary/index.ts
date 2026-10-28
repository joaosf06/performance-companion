import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createResponsesCall } from "../_shared/responses.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Field = { id: string; label: string; type: string; required: boolean };
type Block = { id: string; type: string; title?: string; fields?: Field[] };

// Contact / identifying fields are never broken down into values — only counted as filled or missing.
const isPrivate = (f: Field) =>
  ["email", "tel"].includes(f.type) ||
  /nome|name|email|mail|telem|telef|phone|contacto|contact|instagram|morada|nif|cc\b/i.test(f.label);

export function buildStats(blocks: Block[], regs: { block_id: string; data: Record<string, string> }[]) {
  const forms = blocks.filter((b) => b.type === "form");
  return forms.map((b) => {
    const rows = regs.filter((r) => r.block_id === b.id);
    const fields = (b.fields ?? []).map((f) => {
      const vals = rows.map((r) => String(r.data?.[f.label] ?? "").trim());
      const missing = vals.filter((v) => !v).length;
      let categories: { value: string; count: number }[] | null = null;
      if (!isPrivate(f) && f.type !== "textarea") {
        const m = new Map<string, number>();
        vals.filter(Boolean).forEach((v) => {
          const k = v.length > 40 ? v.slice(0, 40) + "…" : v;
          m.set(k, (m.get(k) ?? 0) + 1);
        });
        categories = [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, c) => c.count - a.count).slice(0, 12);
      }
      return { label: f.label, required: f.required, private: isPrivate(f), filled: vals.length - missing, missing, categories };
    });
    return { formTitle: b.title ?? "Inscrição", total: rows.length, fields };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return json({ error: "Sessão inválida" }, 401);
    const { data: role } = await sb.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "coach").maybeSingle();
    if (!role) return json({ error: "Apenas treinadores" }, 403);

    const { eventId } = await req.json();
    if (typeof eventId !== "string") return json({ error: "Evento em falta" }, 400);
    const { data: ev } = await sb.from("events").select("id,title,blocks").eq("id", eventId).maybeSingle();
    if (!ev) return json({ error: "Evento não encontrado" }, 404);
    const { data: regs, error } = await sb.from("event_registrations").select("block_id,data").eq("event_id", eventId);
    if (error) return json({ error: "Não foi possível ler as inscrições" }, 500);

    const stats = buildStats((ev.blocks ?? []) as Block[], (regs ?? []) as never);
    const total = stats.reduce((s, f) => s + f.total, 0);
    if (total === 0) return json({ stats, total, summary: "Ainda não há inscrições neste evento." });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ stats, total, summary: null, aiError: "IA não configurada" });

    const call = createResponsesCall(
      req,
      { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
      [{ role: "user", content: `Evento: ${ev.title}\nDados agregados (JSON):\n${JSON.stringify(stats)}` }],
      "És assistente de um treinador de futebol. Escreve em português de Portugal um resumo curto (máx. 6 frases ou tópicos) das inscrições: total, distribuição pelas categorias principais e campos com dados em falta (sobretudo obrigatórios). Nunca menciones nomes, emails, telefones ou outros contactos. Usa só os números fornecidos; não inventes.",
    );
    try {
      const summary = (await call.result.text).trim();
      return json({ stats, total, summary: summary || null, aiError: summary ? undefined : "Resumo vazio" });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      const msg = status === 402 ? "Créditos de IA esgotados." : status === 429 ? "Demasiados pedidos, tenta daqui a pouco." : "Não foi possível gerar o resumo com IA.";
      return json({ stats, total, summary: null, aiError: msg });
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
