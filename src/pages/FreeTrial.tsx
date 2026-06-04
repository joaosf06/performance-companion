import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, CheckCircle } from "lucide-react";
import logoPrime11 from "@/assets/logo-prime11.png.asset.json";

const positions = [
  "Guarda-redes",
  "Defesa Central",
  "Defesa Esquerdo",
  "Defesa Direito",
  "Médio Defensivo",
  "Médio Centro",
  "Médio Ofensivo",
  "Extremo Esquerdo",
  "Extremo Direito",
  "Avançado",
];

const levels = [
  "Sub-13",
  "Sub-14",
  "Sub-15",
  "Sub-16",
  "Sub-17",
  "Sub-18",
  "Sub-19",
  "Sub-23",
  "Seniores",
];

const availabilities = [
  "Segunda-feira (manhã)",
  "Segunda-feira (tarde)",
  "Terça-feira (manhã)",
  "Terça-feira (tarde)",
  "Quarta-feira (manhã)",
  "Quarta-feira (tarde)",
  "Quinta-feira (manhã)",
  "Quinta-feira (tarde)",
  "Sexta-feira (manhã)",
  "Sexta-feira (tarde)",
  "Sábado (manhã)",
  "Sábado (tarde)",
  "Domingo (manhã)",
  "Domingo (tarde)",
];

const FreeTrial = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    age: "",
    position: "",
    club: "",
    level: "",
    preferred_foot: "",
    availability: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.email || !form.age || !form.position || !form.club || !form.level || !form.preferred_foot || !form.availability) {
      toast({ title: "Preenche todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const age = parseInt(form.age);
    if (isNaN(age) || age < 5 || age > 50) {
      toast({ title: "Idade inválida.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("free_trial_requests").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      age,
      position: form.position,
      club: form.club.trim(),
      level: form.level,
      preferred_foot: form.preferred_foot,
      availability: form.availability,
      notes: form.notes.trim() || null,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao enviar. Tenta novamente.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <img src={logoPrime11.url} alt="Prime11" className="h-10 w-auto" />
          </Link>
          <Link to="/auth">
            <Button size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 pt-28 pb-20">
        <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        {submitted ? (
          <div className="mt-12 text-center animate-fade-in">
            <CheckCircle className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 text-2xl font-bold">Pedido enviado!</h2>
            <p className="mt-3 text-muted-foreground">
              Entraremos em contacto contigo brevemente para agendar o teu treino grátis.
            </p>
            <Link to="/" className="mt-8 inline-block">
              <Button variant="outline">Voltar à página inicial</Button>
            </Link>
          </div>
        ) : (
          <Card className="border-border/50">
            <CardHeader>
              <span className="mb-2 inline-block w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
                Treino Grátis
              </span>
              <CardTitle className="text-2xl">Experimenta um treino individual</CardTitle>
              <CardDescription className="text-base">
                Preenche o formulário e agenda o teu primeiro treino gratuito com um dos nossos treinadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo *</Label>
                    <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="João Silva" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@email.com" maxLength={255} />
                  </div>
                </div>

                {/* Phone & Age */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telemóvel</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="912 345 678" maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade *</Label>
                    <Input id="age" type="number" min={5} max={50} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="16" />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label>Posição *</Label>
                  <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleciona a posição" /></SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Club & Level */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="club">Clube *</Label>
                    <Input id="club" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} placeholder="FC Porto" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Escalão *</Label>
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleciona o escalão" /></SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preferred Foot */}
                <div className="space-y-2">
                  <Label>Pé favorito *</Label>
                  <Select value={form.preferred_foot} onValueChange={(v) => setForm({ ...form, preferred_foot: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleciona o pé favorito" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direito">Direito</SelectItem>
                      <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label>Disponibilidade preferida *</Label>
                  <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleciona a disponibilidade" /></SelectTrigger>
                    <SelectContent>
                      {availabilities.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Algo que queiras partilhar..." maxLength={500} rows={3} />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "A enviar..." : "Agendar treino grátis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FreeTrial;
