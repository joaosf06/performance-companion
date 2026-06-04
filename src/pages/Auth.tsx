import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoPrime11 from "@/assets/logo-prime11.jpeg.asset.json";

const Auth = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user) {
          const { error: roleError } = await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "player" as const,
          });
          if (roleError) throw roleError;

          await supabase
            .from("profiles")
            .update({
              full_name: fullName,
              birth_date: birthDate || null,
              phone: phone || null,
              guardian_phone: guardianPhone || null,
              instagram: instagram || null,
              position: position || null,
              age_group: ageGroup || null,
              current_club: currentClub || null,
            })
            .eq("user_id", data.user.id);
        }

        toast.success("Conta criada com sucesso! Confirma o teu email.");
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-card border-border text-foreground placeholder:text-muted-foreground";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-10">
      <div className="w-full max-w-md space-y-8 px-6">
        <div className="text-center flex flex-col items-center">
          <img src={logoPrime11.url} alt="Prime11" className="h-16 w-auto" />
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
            {loading ? "A processar..." : isLogin ? "Entrar" : "Criar conta"}
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
