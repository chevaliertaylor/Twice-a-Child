import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  addEntitlementListener,
  configurePurchases,
  getCustomerInfoSafe,
  identifyUser,
  isEntitled,
  resetUser,
} from '../lib/purchases';
import type { Role } from '../types';

const DEVICE_ROLE_KEY = 'tac.deviceRole';

interface SessionContextValue {
  session: Session | null;
  /** Role chosen on THIS device (PRD §4 — role is per device). */
  deviceRole: Role | null;
  /** Whether the account has an active subscription (true when billing is off). */
  entitled: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setDeviceRole: (role: Role) => Promise<void>;
  refreshEntitlement: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [deviceRole, setDeviceRoleState] = useState<Role | null>(null);
  const [entitled, setEntitled] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshEntitlement = useCallback(async () => {
    const info = await getCustomerInfoSafe();
    setEntitled(isEntitled(info));
  }, []);

  useEffect(() => {
    let active = true;
    configurePurchases();

    (async () => {
      const [{ data }, storedRole] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(DEVICE_ROLE_KEY),
      ]);
      if (!active) return;
      setSession(data.session);
      if (storedRole === 'parent' || storedRole === 'child') setDeviceRoleState(storedRole);
      if (data.session) await identifyUser(data.session.user.id);
      await refreshEntitlement();
      if (active) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void (async () => {
        if (next) await identifyUser(next.user.id);
        await refreshEntitlement();
      })();
    });

    const removeEntitlementListener = addEntitlementListener((info) =>
      setEntitled(isEntitled(info)),
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      removeEntitlementListener();
    };
  }, [refreshEntitlement]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      deviceRole,
      entitled,
      loading,
      refreshEntitlement,
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
        await resetUser();
        await supabase.auth.signOut();
      },
      setDeviceRole: async (role) => {
        await AsyncStorage.setItem(DEVICE_ROLE_KEY, role);
        setDeviceRoleState(role);
      },
    }),
    [session, deviceRole, entitled, loading, refreshEntitlement],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
