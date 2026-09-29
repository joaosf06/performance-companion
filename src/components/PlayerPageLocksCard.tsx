import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { usePlayerPageLocks } from "@/hooks/usePlayerPageLocks";

export const PLAYER_PAGES = [
  { path: "/reports", label: "Relatórios" },
  { path: "/questionnaire", label: "Questionário" },
  { path: "/library", label: "Biblioteca" },
  { path: "/workouts", label: "Treinos" },
  { path: "/bookings", label: "Marcações" },
  { path: "/chat", label: "Mensagens" },
];

const PlayerPageLocksCard = () => {
  const { locks, loading, toggle } = usePlayerPageLocks();

  const onChange = async (path: string, visible: boolean) => {
    try {
      await toggle(path, !visible);
      toast.success(visible ? "Página aberta aos atletas" : "Página bloqueada aos atletas");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visibilidade para atletas</CardTitle>
        <p className="text-sm text-muted-foreground">Bloqueia ou reabre as páginas que os atletas podem ver.</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLAYER_PAGES.map((p) => {
          const locked = !!locks[p.path];
          return (
            <div key={p.path} className="flex items-center justify-between rounded-md bg-secondary p-3">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {locked ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                {p.label}
              </span>
              <Switch checked={!locked} disabled={loading} onCheckedChange={(v) => onChange(p.path, v)} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PlayerPageLocksCard;
