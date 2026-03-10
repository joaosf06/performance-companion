import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Users, TrendingUp, Brain, ChevronRight, Star, Shield, Zap } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-tight">
            PRIME<span className="text-primary">11</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#sobre" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Sobre</a>
            <a href="#servicos" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Serviços</a>
            <a href="#equipa" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Equipa</a>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center animate-fade-in">
          <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Treino Individual de Elite
          </span>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            O teu rendimento.{" "}
            <span className="text-primary">Sem limites.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A Prime11 conecta jogadores e treinadores numa plataforma de acompanhamento personalizado. 
            Monitoriza, evolui e atinge o teu máximo potencial.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Começar agora <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#sobre">
              <Button variant="outline" size="lg" className="text-base px-8">
                Saber mais
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-md grid-cols-3 gap-8">
            {[
              { value: "500+", label: "Atletas" },
              { value: "50+", label: "Treinadores" },
              { value: "98%", label: "Satisfação" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="border-t border-border/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-primary">Quem somos</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Treinadores e jogadores, juntos.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              A Prime11 nasceu da necessidade de profissionalizar o acompanhamento individual no futebol. 
              Acreditamos que cada jogador merece um plano personalizado, dados concretos e comunicação direta com o seu treinador.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Missão",
                description: "Democratizar o treino individual de alta qualidade, acessível a todos os níveis competitivos.",
              },
              {
                icon: Star,
                title: "Visão",
                description: "Ser a plataforma de referência em Portugal para treino individual e monitorização de atletas.",
              },
              {
                icon: Shield,
                title: "Valores",
                description: "Transparência, excelência, personalização e compromisso com a evolução de cada atleta.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border/50 bg-card p-8 transition-all hover:border-primary/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="border-t border-border/50 bg-card/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-primary">Serviços</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              O que oferecemos
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Ferramentas profissionais para maximizar o potencial de cada atleta.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: TrendingUp,
                title: "Relatórios de Treino Detalhados",
                description: "O treinador avalia cada sessão com notas técnicas, de intensidade e observações comportamentais. O jogador acompanha a sua evolução em tempo real.",
              },
              {
                icon: Brain,
                title: "Monitorização Semanal",
                description: "Questionários semanais sobre fadiga, sono, motivação e confiança. Dados essenciais para ajustar o plano de treino.",
              },
              {
                icon: Users,
                title: "Gestão de Atletas",
                description: "O treinador gere a sua carteira de atletas, com acesso ao histórico completo de cada jogador — relatórios, questionários e evolução.",
              },
              {
                icon: Zap,
                title: "Dashboard Personalizado",
                description: "Cada utilizador tem um painel adaptado ao seu perfil. Jogadores veem os seus dados; treinadores gerem a sua equipa.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/50 bg-background p-8 transition-all hover:border-primary/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipa */}
      <section id="equipa" className="border-t border-border/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-primary">Equipa</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Quem está por trás da Prime11
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Uma equipa apaixonada por futebol e tecnologia, comprometida em transformar o treino individual.
            </p>
          </div>

          <div className="mt-16 mx-auto max-w-3xl rounded-xl border border-border/50 bg-card p-10 text-center">
            <p className="text-muted-foreground leading-relaxed text-base">
              A Prime11 foi fundada por profissionais do futebol e da tecnologia que identificaram 
              uma lacuna no mercado: a falta de ferramentas digitais profissionais para o treino individual. 
              A nossa missão é dar a cada jogador — independentemente do nível — acesso a um acompanhamento 
              de excelência, com dados, relatórios e comunicação contínua com o treinador.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-border/50 bg-card/50 py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para evoluir?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Junta-te à Prime11 e leva o teu treino ao próximo nível.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-10">
                Criar conta grátis <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xl font-bold tracking-tight">
            PRIME<span className="text-primary">11</span>
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Prime11. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
