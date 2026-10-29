import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, EyeOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLogo from "@/components/site-editor/SiteLogo";
import PageBackground from "@/components/site-editor/PageBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEvent, useEventsList } from "@/components/EventsSection";
import { useEventCovers } from "@/hooks/useEventCovers";

const EventsList = () => {
  const { role } = useAuth();
  const isCoach = role === "coach";
  const events = useEventsList();
  const create = useCreateEvent();
  const covers = useEventCovers();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground pageKey="eventos" label="Eventos" />
      <header className="relative z-10 flex items-center justify-between border-b border-border/50 px-6 py-4">
        <Link to="/"><SiteLogo className="h-10 w-auto" /></Link>
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Página inicial</Link>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Eventos</p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">Torneios e eventos</h1>
          </div>
          {isCoach && <Button onClick={create} className="gap-2"><Plus className="h-4 w-4" />Criar evento</Button>}
        </div>
        {events === null ? null : events.length === 0 ? (
          <p className="text-muted-foreground">Ainda não há eventos.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((e) => { const c = covers.get(e.id); return (
              <Link key={e.id} to={`/eventos/${e.slug}`} className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary">
                <div className="flex aspect-video items-center justify-center overflow-hidden bg-muted">
                  {e.cover_url ? <img src={e.cover_url} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" style={{ objectPosition: `${c.x}% ${c.y}%` }} /> : <CalendarDays className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="p-6">
                  {!e.published && <span className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3 w-3" /> Escondido</span>}
                  <h2 className="font-display text-2xl font-semibold group-hover:text-primary">{e.title}</h2>
                  {e.subtitle && <p className="mt-2 text-muted-foreground line-clamp-2">{e.subtitle}</p>}
                </div>
              </Link>
            ); })}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsList;
