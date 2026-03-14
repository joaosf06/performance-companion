import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, Users, FileText, ClipboardList, MessageCircle, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const coachLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/athletes", label: "Atletas", icon: Users },
    { path: "/reports", label: "Relatórios", icon: FileText },
    { path: "/custom-questionnaires", label: "Questionários", icon: ClipboardList },
    { path: "/chat", label: "Mensagens", icon: MessageCircle },
  ];

  const playerLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/reports", label: "Relatórios", icon: FileText },
    { path: "/questionnaire", label: "Questionário", icon: ClipboardList },
    { path: "/chat", label: "Mensagens", icon: MessageCircle },
  ];

  const links = role === "coach" ? coachLinks : playerLinks;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">
            PRIME<span className="text-primary">11</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || "Utilizador"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {role === "coach" ? "Treinador" : "Jogador"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
