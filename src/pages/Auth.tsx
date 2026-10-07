import PageBackground from "@/components/site-editor/PageBackground";
import { useEffect, useState } from "react";
import { useNavigate, Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SiteLogo from "@/components/site-editor/SiteLogo";
import { ArrowLeft, Eye } from "lucide-react";

const Auth = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isCoachPreview = !!user && role === "coach";

  useEffect(() => {
    if (isCoachPreview && searchParams.get("preview") === "signup") setIsLogin(false);
  }, [isCoachPreview, searchParams]);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup extras
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [position, setPosition] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (authLoading) return null;
  if (user && role !== "coach") return <Navigate to="/dashboard" replace />;

  if (sentTo) {
    const resend = async () => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sentTo,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      if (error) toast.error(error.message);
      else toast.success("Email reenviado.");
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 text-center">
          <SiteLogo className="mx-auto h-14 w-auto" />
          <h1 className="font-display text-2xl font-bold text-foreground">Confirma o teu email</h1>
          <p className="text-sm text-muted-foreground">
            Conta criada! Enviámos um link de confirmação para <strong className="text-foreground">{sentTo}</strong>.
            Abre o email (vê também a pasta de spam) e clica no link para ativar a conta.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => { setSentTo(null); setIsLogin(true); }}>Já confirmei — Entrar</Button>
            <Button variant="outline" onClick={resend}>Reenviar email</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoachPreview) {
      toast.info("Estás a pré-visualizar a página. O formulário não foi enviado.");
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login efetuado com sucesso!");
        navigate("/dashboard", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              birth_date: birthDate,
              phone,
              guardian_phone: guardianPhone,
              instagram,
              position,
              age_group: ageGroup,
              current_club: currentClub,
            },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate("/dashboard", { replace: true });
        } else {
          setSentTo(email);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-card border-border text-foreground placeholder:text-muted-foreground";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background py-10 [&>*:not(.fixed)]:relative [&>*:not(.fixed)]:z-10">
      <PageBackground pageKey="auth" label="Entrar / Registo" />
      {isCoachPreview && (
        <div className="fixed inset-x-0 top-0 z-50 flex min-h-12 items-center justify-between gap-3 border-b border-border bg-card px-3 py-2 sm:px-6">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Pré-visualização da criação de conta</span>
          </span>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
          </Button>
        </div>
      )}
      <div className="w-full max-w-md space-y-8 px-6">
        <div className="text-center flex flex-col items-center">
          <SiteLogo className="h-16 w-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Entra na tua conta" : "Cria a tua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome completo</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="O teu nome" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth" className="text-foreground">Data de nascimento</Label>
                <Input id="birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Número de telemóvel</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="912345678" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gphone" className="text-foreground">Telemóvel do encarregado de educação</Label>
                <Input id="gphone" type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="912345678" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-foreground">Instagram</Label>
                <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@utilizador" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-foreground">Posição</Label>
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required placeholder="Ex: Médio" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_group" className="text-foreground">Escalão</Label>
                <Input id="age_group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required placeholder="Ex: Sub-15" className={inputCls} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club" className="text-foreground">Clube atual</Label>
                <Input id="club" value={currentClub} onChange={(e) => setCurrentClub(e.target.value)} required placeholder="Nome do clube" className={inputCls} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemplo.com" className={inputCls} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className={inputCls} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {isCoachPreview ? "Pré-visualização — não enviar" : loading ? "A processar..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Não tens conta?" : "Já tens conta?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
