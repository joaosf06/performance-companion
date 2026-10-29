import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Plus, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useEventCovers } from "@/hooks/useEventCovers";

export type Ev = { id: string; slug: string; title: string; subtitle: string | null; cover_url: string | null; published: boolean };

export const useEventsList = () => {
  const { role } = useAuth();
  const [events, setEvents] = useState<Ev[] | null>(null);
  useEffect(() => {
    supabase.from("events").select("id,slug,title,subtitle,cover_url,published").order("created_at", { ascending: false })
      .then(({ data }) => setEvents((data as Ev[]) ?? []));
  }, [role]);
  return events;
};

export const useCreateEvent = () => {
  const navigate = useNavigate();
  return async () => {
    const slug = `evento-${Date.now().toString(36)}`;
    const { error } = await supabase.from("events").insert({ slug, title: "Novo evento" });
    if (error) return toast.error("Não foi possível criar o evento");
    navigate(`/eventos/${slug}?edit=1`);
  };
};

const EventsSection = () => {
  const { role } = useAuth();
  const isCoach = role === "coach";
  const events = useEventsList() ?? [];
  const create = useCreateEvent();
  const covers = useEventCovers();

  if (!isCoach && events.length === 0) return null;
  const [main, ...rest] = events;
  const mc = main ? covers.get(main.id) : null;

  return (
    <section id="eventos" className="border-t border-border/50">
      {main ? (
        <Link to={`/eventos/${main.slug}`} className="group relative block min-h-[80vh] overflow-hidden">
          {main.cover_url ? (
            <img src={main.cover_url} alt={main.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: `${mc!.x}% ${mc!.y}%` }} />
          ) : <div className="absolute inset-0 bg-muted" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-end px-6 py-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Eventos</p>
            {!main.published && <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3 w-3" /> Escondido</span>}
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold md:text-7xl">{main.title}</h2>
            {main.subtitle && <p className="mt-4 max-w-2xl text-lg text-muted-foreground line-clamp-3">{main.subtitle}</p>}
            <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground">Ver evento <ArrowRight className="h-4 w-4" /></span>
          </div>
        </Link>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Ainda não há eventos.</p>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="text-muted-foreground">{rest.length > 0 ? `+${rest.length} ${rest.length === 1 ? "outro evento" : "outros eventos"}` : "Torneios e eventos Prime11"}</p>
        <div className="flex gap-2">
          {isCoach && <Button variant="outline" onClick={create} className="gap-2"><Plus className="h-4 w-4" /> Criar evento</Button>}
          <Button asChild className="gap-2"><Link to="/eventos">Ver todos os eventos <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
