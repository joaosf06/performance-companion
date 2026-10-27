import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Ev = { id: string; slug: string; title: string; subtitle: string | null; cover_url: string | null; published: boolean };

const EventsSection = () => {
  const { role } = useAuth();
  const isCoach = role === "coach";
  const navigate = useNavigate();
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    supabase.from("events").select("id,slug,title,subtitle,cover_url,published").order("created_at", { ascending: false })
      .then(({ data }) => setEvents((data as Ev[]) ?? []));
  }, [role]);

  const create = async () => {
    const slug = `evento-${Date.now().toString(36)}`;
    const { error } = await supabase.from("events").insert({ slug, title: "Novo evento" });
    if (error) return toast.error("Não foi possível criar o evento");
    navigate(`/eventos/${slug}?edit=1`);
  };

  if (!isCoach && events.length === 0) return null;

  return (
    <section id="eventos" className="border-t border-border/50 py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Eventos</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Torneios e eventos</h2>
          </div>
          {isCoach && <Button onClick={create} className="gap-2"><Plus className="h-4 w-4" /> Criar evento</Button>}
        </div>
        {events.length === 0 ? (
          <p className="text-muted-foreground">Ainda não há eventos. Carrega em "Criar evento".</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} to={`/eventos/${e.slug}`} className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary">
                <div className="flex aspect-video items-center justify-center bg-muted">
                  {e.cover_url ? <img src={e.cover_url} alt={e.title} className="h-full w-full object-cover" loading="lazy" /> : <CalendarDays className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="p-5">
                  {!e.published && <span className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3 w-3" /> Escondido</span>}
                  <h3 className="font-display text-xl font-semibold group-hover:text-primary">{e.title}</h3>
                  {e.subtitle && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
