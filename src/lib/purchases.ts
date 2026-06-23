import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

// Configure these RevenueCat public SDK keys in .env (per platform).
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

// Entitlement identifier configured in the RevenueCat dashboard.
const ENTITLEMENT_ID = 'premium';

const apiKey = Platform.OS === 'android' ? ANDROID_KEY : IOS_KEY;

/** When false (no key / web / Expo Go), billing is not enforced. */
export const purchasesConfigured = Boolean(apiKey);

export function configurePurchases(): void {
  if (!purchasesConfigured) return;
  try {
    Purchases.configure({ apiKey: apiKey as string });
  } catch {
    // no-op (unsupported environment)
  }
}

/** Tie purchases to the shared account so both devices share entitlement. */
export async function identifyUser(userId: string): Promise<void> {
  if (!purchasesConfigured) return;
  try {
    await Purchases.logIn(userId);
  } catch {
    // no-op
  }
}

export async function resetUser(): Promise<void> {
  if (!purchasesConfigured) return;
  try {
    await Purchases.logOut();
  } catch {
    // no-op
  }
}

export function isEntitled(info: CustomerInfo | null): boolean {
  if (!purchasesConfigured) return true; // billing not enforced
  if (!info) return false;
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  if (!purchasesConfigured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

/** The subscription package the paywall should sell (first of the current offering). */
export async function getCurrentPackage(): Promise<PurchasesPackage | null> {
  if (!purchasesConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch {
    return null; // includes user cancellation
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

export function addEntitlementListener(cb: (info: CustomerInfo) => void): () => void {
  if (!purchasesConfigured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}
