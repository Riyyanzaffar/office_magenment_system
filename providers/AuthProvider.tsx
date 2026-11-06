import { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { Profile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, email, display_name, role, account_status, rejection_reason')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

function describeProfileError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch|network/i.test(message)
    ? 'Check your internet connection and try again.'
    : 'The server could not return your account details. Please try again.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let profileRequest = Promise.resolve<Profile | null>(null);

    const loadProfile = async (userId: string): Promise<void> => {
      const currentRequest = fetchProfile(userId);
      profileRequest = currentRequest;
      setLoading(true);
      try {
        const result = await currentRequest;
        if (!mounted || profileRequest !== currentRequest) return;
        setProfile(result);
        setProfileError(null);
      } catch (error) {
        if (!mounted || profileRequest !== currentRequest) return;
        setProfile(null);
        setProfileError(describeProfileError(error));
      } finally {
        if (mounted && profileRequest === currentRequest) setLoading(false);
      }
    };

    const loadSession = async (): Promise<void> => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setProfileError('We could not restore your session. Please sign in again.');
        setLoading(false);
        return;
      }

      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || event === 'INITIAL_SESSION') return;
      setSession(nextSession);
      if (!nextSession) {
        profileRequest = Promise.resolve(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }
      void loadProfile(nextSession.user.id);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    loading,
    profileError,
    refreshProfile: async () => {
      if (!session) return;
      try {
        setProfile(await fetchProfile(session.user.id));
        setProfileError(null);
      } catch (error) {
        setProfileError(describeProfileError(error));
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [loading, profile, profileError, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
