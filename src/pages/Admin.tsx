import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AuthPage } from "@/components/admin/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in or not an admin, show AuthPage
  if (!user || !isAdmin) {
    return <AuthPage />;
  }

  // If logged in as admin, show Dashboard
  return <AdminDashboard />;
};

export default Admin;
