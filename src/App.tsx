import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Athletes from "./pages/Athletes";
import Reports from "./pages/Reports";
import Questionnaire from "./pages/Questionnaire";
import AthleteProfile from "./pages/AthleteProfile";
import NotFound from "./pages/NotFound";
import FreeTrial from "./pages/FreeTrial";
import Chat from "./pages/Chat";
import CustomQuestionnaires from "./pages/CustomQuestionnaires";
import Library from "./pages/Library";
import AnswerQuestionnaire from "./pages/AnswerQuestionnaire";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/athletes" element={<ProtectedRoute><Athletes /></ProtectedRoute>} />
            <Route path="/athletes/:athleteId" element={<ProtectedRoute><AthleteProfile /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/questionnaire" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/custom-questionnaires" element={<ProtectedRoute><CustomQuestionnaires /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/answer-questionnaire/:assignmentId" element={<ProtectedRoute><AnswerQuestionnaire /></ProtectedRoute>} />
            <Route path="/treino-gratis" element={<FreeTrial />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
