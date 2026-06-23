import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { registerForPushNotificationsAsync } from '../lib/push';
import { saveDeviceToken } from '../api/db';
import type { Role } from '../types';

/**
 * Register this device for push notifications and store its Expo token once the
 * user is authenticated and a role is known. Failures are silent (simulator,
 * denied permission, Expo Go).
 */
export function usePushRegistration(session: Session | null, role: Role | null): void {
  useEffect(() => {
    if (!session || !role) return;
    let cancelled = false;

    registerForPushNotificationsAsync().then((reg) => {
      if (cancelled || !reg) return;
      void saveDeviceToken(session.user.id, role, reg.token, reg.platform);
    });

    return () => {
      cancelled = true;
    };
  }, [session, role]);
}
