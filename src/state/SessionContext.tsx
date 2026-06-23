import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Role } from '../types';

const DEVICE_ROLE_KEY = 'tac.deviceRole';

interface SessionContextValue {
  session: Session | null;
  /** Role chosen on THIS device (PRD §4 — role is per device). */
  deviceRole: Role | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setDeviceRole: (role: Role) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [deviceRole, setDeviceRoleState] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const [{ data }, storedRole] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(DEVICE_ROLE_KEY),
      ]);
      if (!active) return;
      setSession(data.session);
      if (storedRole === 'parent' || storedRole === 'child') setDeviceRoleState(storedRole);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      deviceRole,
      loading,
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await AsyncStorage.removeItem(DEVICE_ROLE_KEY);
        setDeviceRoleState(null);
        await supabase.auth.signOut();
      },
      setDeviceRole: async (role) => {
        await AsyncStorage.setItem(DEVICE_ROLE_KEY, role);
        setDeviceRoleState(role);
      },
    }),
    [session, deviceRole, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
