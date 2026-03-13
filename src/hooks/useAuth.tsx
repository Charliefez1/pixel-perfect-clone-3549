import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile, AppRole } from "@/types/auth";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isTeam: boolean;
  isClient: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isTeam: false,
  isClient: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError || !profileData) {
        console.error("Failed to fetch profile:", profileError);
        return null;
      }

      // user_roles table may not exist — gracefully fallback to 'client'
      let role: AppRole = 'client';
      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (!roleError && roleData?.role) role = roleData.role as AppRole;
      } catch {
        // table doesn't exist or network issue — keep default
      }

      return { ...profileData, role } as UserProfile;
    } catch (err) {
      console.error("fetchProfile crashed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety net: if auth never resolves, force loading off after 8s
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading timeout — forcing loading off");
        setLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);

      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (mounted) setProfile(prof);
      }

      if (mounted) setLoading(false);
    }).catch((err) => {
      console.error("getSession failed:", err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          setSession(session);

          if (session?.user) {
            const prof = await fetchProfile(session.user.id);
            if (mounted) setProfile(prof);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("onAuthStateChange handler failed:", err);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    setProfile(null);
    await supabase.auth.signOut();
  };

  const role = profile?.role ?? 'client';
  const isTeamOrAdmin = role === 'admin' || role === 'user';

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: role === 'admin',
        isTeam: role === 'user' || role === 'admin',
        isClient: role === 'client',
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
