import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { setUserContext, clearUserContext } from '@/lib/monitoring';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Safety timeout: if Supabase hasn't resolved in 5 s (e.g. network issue),
    // treat the user as unauthenticated so auth guards can redirect.
    const fallback = setTimeout(() => {
      setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev);
    }, 5_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        clearTimeout(fallback);
        setState({
          user: session?.user ?? null,
          session,
          isAuthenticated: !!session?.user,
          isLoading: false,
        });
        if (session?.user) {
          setUserContext(session.user.id, session.user.email);
        } else {
          clearUserContext();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(fallback);
      setState({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session?.user,
        isLoading: false,
      });
      if (session?.user) {
        setUserContext(session.user.id, session.user.email);
      }
    });

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}
