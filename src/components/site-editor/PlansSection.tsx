import { Link } from "react-router-dom";
import { Check, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditableText from "@/components/site-editor/EditableText";
import type { HomeContent, PlanItem } from "@/hooks/useSiteContent";

type Props = {
  content: HomeContent;
  editing: boolean;
  set: <K extends keyof HomeContent>(key: K, value: HomeContent[K]) => void;
};

const PlansSection = ({ content, editing, set }: Props) => {
  const plans = content.plans;
  const updatePlan = (i: number, patch: Partial<PlanItem>) =>
    set("plans", plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <section id="planos" className="border-t border-border/50 py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <EditableText editing={editing} value={content.plansEyebrow} onChange={(v) => set("plansEyebrow", v)}
            className="text-xs font-medium uppercase tracking-widest text-primary" />
          <EditableText as="h2" editing={editing} value={content.plansTitle} onChange={(v) => set("plansTitle", v)}
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" />
          <EditableText as="p" editing={editing} value={content.plansSubtitle} onChange={(v) => set("plansSubtitle", v)}
            multiline className="mt-4 text-muted-foreground text-lg" />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <div key={i}
              className={`relative flex flex-col rounded-xl border bg-card p-8 transition-all ${
                plan.featured ? "border-primary shadow-lg shadow-primary/10 lg:-translate-y-2" : "border-border/50 hover:border-primary/30"
              }`}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <EditableText editing={editing} value={plan.badge} onChange={(v) => updatePlan(i, { badge: v })} />
                </div>
              )}
              <EditableText as="h3" editing={editing} value={plan.name} onChange={(v) => updatePlan(i, { name: v })}
                className="text-xl font-bold text-foreground" />
              <EditableText as="p" editing={editing} value={plan.description} onChange={(v) => updatePlan(i, { description: v })}
                multiline className="mt-3 text-sm text-muted-foreground leading-relaxed" />

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f, k) => (
                  <li key={k} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <EditableText editing={editing} value={f}
                      onChange={(v) => updatePlan(i, { features: plan.features.map((x, y) => (y === k ? v : x)) })}
                      className="flex-1 text-foreground" />
                    {editing && (
                      <button type="button" aria-label="Remover componente" className="text-destructive"
                        onClick={() => updatePlan(i, { features: plan.features.filter((_, y) => y !== k) })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {editing && (
                <Button size="sm" variant="ghost" className="mt-3 gap-1 self-start"
                  onClick={() => updatePlan(i, { features: [...plan.features, "Nova componente"] })}>
                  <Plus className="h-3.5 w-3.5" /> Componente
                </Button>
              )}

              <Button asChild={!editing} className="mt-6 w-full" variant={plan.featured ? "default" : "outline"}>
                {editing ? (
                  <span>
                    <EditableText editing value={plan.ctaLabel} onChange={(v) => updatePlan(i, { ctaLabel: v })} />
                  </span>
                ) : (
                  <Link to={plan.ctaLink || "/treino-gratis"}>{plan.ctaLabel}</Link>
                )}
              </Button>

              {editing && (
                <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                  <label className="text-xs text-muted-foreground">Link do botão</label>
                  <Input value={plan.ctaLink} onChange={(e) => updatePlan(i, { ctaLink: e.target.value })} placeholder="/treino-gratis" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant={plan.featured ? "default" : "outline"} className="gap-1"
                      onClick={() => updatePlan(i, { featured: !plan.featured })}>
                      <Star className="h-3.5 w-3.5" /> {plan.featured ? "Em destaque" : "Destacar"}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive"
                      onClick={() => set("plans", plans.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" /> Remover plano
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="sm" className="gap-2"
              onClick={() => set("plans", [...plans, {
                name: "Novo plano", badge: "Mais procurado", featured: false,
                description: "Descrição do plano.", features: ["Componente incluída"],
                ctaLabel: "Saber mais", ctaLink: "/treino-gratis",
              }])}>
              <Plus className="h-4 w-4" /> Adicionar plano
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlansSection;
