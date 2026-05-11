import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Athletes = lazy(() => import("./pages/Athletes"));
const Reports = lazy(() => import("./pages/Reports"));
const Questionnaire = lazy(() => import("./pages/Questionnaire"));
const AthleteProfile = lazy(() => import("./pages/AthleteProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FreeTrial = lazy(() => import("./pages/FreeTrial"));
const Chat = lazy(() => import("./pages/Chat"));
const CustomQuestionnaires = lazy(() => import("./pages/CustomQuestionnaires"));
const Library = lazy(() => import("./pages/Library"));
const AnswerQuestionnaire = lazy(() => import("./pages/AnswerQuestionnaire"));
const Workouts = lazy(() => import("./pages/Workouts"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/athletes" element={<Athletes />} />
                <Route path="/athletes/:athleteId" element={<AthleteProfile />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/questionnaire" element={<Questionnaire />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/custom-questionnaires" element={<CustomQuestionnaires />} />
                <Route path="/library" element={<Library />} />
                <Route path="/answer-questionnaire/:assignmentId" element={<AnswerQuestionnaire />} />
                <Route path="/workouts" element={<Workouts />} />
              </Route>
              <Route path="/treino-gratis" element={<FreeTrial />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
