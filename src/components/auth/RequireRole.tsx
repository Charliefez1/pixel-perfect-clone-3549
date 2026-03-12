import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/types/auth";

interface RequireRoleProps {
  roles: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({ roles, children, redirectTo = "/" }: RequireRoleProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse">
          N
        </div>
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
