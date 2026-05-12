import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LogOut,
  User,
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  MessageCircle,
  BookOpen,
  Dumbbell,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const coachLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/athletes", label: "Atletas", icon: Users },
    { path: "/reports", label: "Relatórios", icon: FileText },
    { path: "/custom-questionnaires", label: "Questionários", icon: ClipboardList },
    { path: "/library", label: "Biblioteca", icon: BookOpen },
    { path: "/workouts", label: "Treinos", icon: Dumbbell },
    { path: "/chat", label: "Mensagens", icon: MessageCircle },
  ];

  const playerLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/reports", label: "Relatórios", icon: FileText },
    { path: "/questionnaire", label: "Questionário", icon: ClipboardList },
    { path: "/library", label: "Biblioteca", icon: BookOpen },
    { path: "/workouts", label: "Treinos", icon: Dumbbell },
    { path: "/chat", label: "Mensagens", icon: MessageCircle },
  ];

  const links = role === "coach" ? coachLinks : playerLinks;

  const NavList = ({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 p-3">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={onNavigate}
          title={compact ? link.label : undefined}
          className={`flex items-center ${compact ? "justify-center" : "gap-3"} rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(link.path)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <link.icon className="h-4 w-4 shrink-0" />
          {!compact && <span className="truncate">{link.label}</span>}
        </Link>
      ))}
    </nav>
  );

  const SidebarFooter = ({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) => (
    <div className="border-t border-border p-3">
      {!compact && (
        <Link
          to="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 mb-2 rounded-md p-2 transition-colors ${
            isActive("/settings") ? "bg-secondary" : "hover:bg-secondary/60"
          }`}
        >
          <Avatar className="h-9 w-9">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || "Utilizador"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {role === "coach" ? "Treinador" : "Jogador"}
            </p>
          </div>
          <SettingsIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      )}
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={signOut}
        className={compact ? "w-full" : "w-full justify-start text-muted-foreground hover:text-foreground"}
        title={compact ? "Sair" : undefined}
      >
        <LogOut className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
        {!compact && "Sair"}
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar (collapsed icon-only on md, full on lg) */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-16 lg:w-64 flex-col border-r border-border bg-card">
        <Link to="/" className="flex h-16 items-center justify-center lg:justify-start px-3 lg:px-6 border-b border-border hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="lg:hidden text-primary">P11</span>
            <span className="hidden lg:inline">PRIME<span className="text-primary">11</span></span>
          </h1>
        </Link>

        {/* Show compact nav on md, full on lg */}
        <div className="flex-1 overflow-y-auto lg:hidden">
          <NavList compact />
        </div>
        <div className="flex-1 overflow-y-auto hidden lg:block">
          <NavList />
        </div>

        <div className="lg:hidden">
          <SidebarFooter compact />
        </div>
        <div className="hidden lg:block">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-3 border-b border-border bg-card">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 flex flex-col">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex h-16 items-center px-6 border-b border-border hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold tracking-tight">
                PRIME<span className="text-primary">11</span>
              </h1>
            </Link>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link to="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
          PRIME<span className="text-primary">11</span>
        </Link>

        <Link to="/settings" aria-label="Conta" className="rounded-full">
          <Avatar className="h-9 w-9">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden pt-14 md:pt-0 md:ml-16 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
