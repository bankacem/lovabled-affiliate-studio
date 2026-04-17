import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AuthPage } from "@/components/admin/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();

  // FIX: Show spinner while EITHER loading OR user is logged in but admin check not done yet.
  // Previously: if (!user || !isAdmin) showed AuthPage immediately when user IS logged in
  // but isAdmin=false (not yet confirmed) → confused the user with a login form.
  if (isLoading || (user && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {user ? "Verifying admin access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → show login form
  if (!user) {
    return <AuthPage />;
  }

  // Logged in but not admin → show access denied with SQL fix instructions
  if (!isAdmin) {
    return <AuthPage showAccessDenied email={user.email} />;
  }

  return <AdminDashboard />;
};

export default Admin;
