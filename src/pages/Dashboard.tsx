import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PlayerDashboard from "./PlayerDashboard";
import CoachDashboard from "./CoachDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 rounded-xl" />
  </div>
);

const Dashboard = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Role still loading (edge case) — show skeleton inside layout
  if (!role) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      {role === "coach" ? <CoachDashboard /> : <PlayerDashboard />}
    </Layout>
  );
};

export default Dashboard;
