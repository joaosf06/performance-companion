import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FreeTrialRequestsCard = () => {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from("free_trial_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "novo")
      .then(({ count }) => setCount(count ?? 0));
  }, []);
  return (
    <Link to="/pedidos" className="block">
      <Card className={`cursor-pointer transition-all hover:border-primary/50 ${count ? "border-primary/30" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos de treino grátis</CardTitle>
          <Inbox className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{count ?? "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Pedidos novos por tratar</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FreeTrialRequestsCard;
