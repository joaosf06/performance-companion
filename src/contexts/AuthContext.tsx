import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserProfile = { full_name: string; avatar_url: string | null; short_id: string | null } | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: UserProfile;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
      supabase.from("profiles").select("full_name, avatar_url, short_id").eq("user_id", userId).limit(1).maybeSingle(),
    ]);

    if (roleRes.error) console.error("Error loading role", roleRes.error);
    if (profileRes.error) console.error("Error loading profile", profileRes.error);

    return {
      role: roleRes.data?.role ?? null,
      profile: profileRes.data
        ? {
            full_name: profileRes.data.full_name,
            avatar_url: profileRes.data.avatar_url,
            short_id: profileRes.data.short_id,
          }
        : null,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const userData = await fetchUserData(session.user.id);
      if (!mounted) return;

      setRole(userData.role);
      setProfile(userData.profile);
      setLoading(false);
    };

    void loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(true);

      if (!session?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      void fetchUserData(session.user.id)
        .then((userData) => {
          if (!mounted) return;
          setRole(userData.role);
          setProfile(userData.profile);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
