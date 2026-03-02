import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PlayerDashboard from "./PlayerDashboard";
import CoachDashboard from "./CoachDashboard";

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      {role === "coach" ? <CoachDashboard /> : <PlayerDashboard />}
    </Layout>
  );
};

export default Dashboard;
