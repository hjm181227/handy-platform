import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setConsent as setFirebaseConsent,
  setUserId as setFirebaseUserId,
} from 'firebase/analytics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
  AnalyticsEventDeduper,
  type AnalyticsEventName,
  type AnalyticsProperties,
  type AnalyticsPropertyValue,
} from '@handy-platform/shared';

const CONSENT_KEY = 'handy.analytics.consent';
const env = String(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development');
const isProduction = env === 'production';
const isDebugFirebase = !isProduction && import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

type SafeProperties = Record<string, AnalyticsPropertyValue>;

export interface AnalyticsAdapter {
  track(event: AnalyticsEventName, properties: SafeProperties): Promise<void> | void;
  setUser(opaqueUserId: string | null): Promise<void> | void;
  setConsent(enabled: boolean): Promise<void> | void;
  reset(): Promise<void> | void;
}

class DebugAnalyticsAdapter implements AnalyticsAdapter {
  readonly events: Array<{ event: AnalyticsEventName; properties: SafeProperties }> = [];
  track(event: AnalyticsEventName, properties: SafeProperties) {
    this.events.push({ event, properties });
    console.debug('[analytics:test]', event, properties);
  }
  setUser(opaqueUserId: string | null) { console.debug('[analytics:test] user', opaqueUserId ? 'set' : 'cleared'); }
  setConsent(enabled: boolean) { console.debug('[analytics:test] consent', enabled); }
  reset() { this.events.length = 0; }
}

class FirebaseWebAnalyticsAdapter implements AnalyticsAdapter {
  constructor(private readonly analytics: Analytics) {}
  track(event: AnalyticsEventName, properties: SafeProperties) {
    logEvent(this.analytics, event, properties);
  }
  setUser(opaqueUserId: string | null) {
    setFirebaseUserId(this.analytics, opaqueUserId);
  }
  setConsent(enabled: boolean) {
    setFirebaseConsent({
      analytics_storage: enabled ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
  reset() { setFirebaseUserId(this.analytics, null); }
}

const debugAdapter = new DebugAnalyticsAdapter();
const eventDeduper = new AnalyticsEventDeduper();
let adapter: AnalyticsAdapter | null = null;
let adapterPromise: Promise<AnalyticsAdapter | null> | null = null;
let plan = 'free';

function isNativeWebView() {
  return !!(window as any).ReactNativeWebView?.postMessage;
}

function postNative(type: string, data: unknown) {
  if (!isNativeWebView()) return false;
  (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
  return true;
}

function hasFirebaseConfig() {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID &&
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  );
}

async function createAdapter(): Promise<AnalyticsAdapter | null> {
  if (!isProduction && !isDebugFirebase) return debugAdapter;
  if (!hasFirebaseConfig() || !(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  });
  return new FirebaseWebAnalyticsAdapter(getAnalytics(app));
}

async function getAdapter() {
  if (adapter) return adapter;
  adapterPromise ||= createAdapter();
  adapter = await adapterPromise;
  return adapter;
}

export function hasAnalyticsConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

function commonProperties(properties?: AnalyticsProperties) {
  return sanitizeAnalyticsProperties({
    app_id: 'handy',
    environment: env,
    // Firebase already records platform and locale. Web app version/build are
    // not automatic, so include them when supplied by the build.
    app_version: import.meta.env.VITE_APP_VERSION || undefined,
    build_number: import.meta.env.VITE_BUILD_NUMBER || undefined,
    plan,
    ...properties,
    ...(isDebugFirebase ? { debug_mode: 1 } : {}),
  });
}

export async function track(event: AnalyticsEventName, properties?: AnalyticsProperties) {
  if (!isAnalyticsEventName(event) || !hasAnalyticsConsent()) return;
  const safe = commonProperties(properties);
  if (!eventDeduper.shouldTrack(event, safe)) return;
  if (postNative('ANALYTICS_EVENT', { event, properties: safe })) return;
  await (await getAdapter())?.track(event, safe);
}

export async function setAnalyticsUser(opaqueUserId: string | null, userPlan = 'free') {
  plan = userPlan || 'free';
  if (!hasAnalyticsConsent()) return;
  if (postNative('ANALYTICS_USER', { opaqueUserId })) return;
  await (await getAdapter())?.setUser(opaqueUserId);
}

export async function setAnalyticsConsent(enabled: boolean) {
  localStorage.setItem(CONSENT_KEY, enabled ? 'granted' : 'denied');
  eventDeduper.reset();
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  if (measurementId) (window as any)[`ga-disable-${measurementId}`] = !enabled;
  if (postNative('ANALYTICS_CONSENT', { enabled })) return;
  const target = enabled ? await getAdapter() : adapter;
  await target?.setConsent(enabled);
  if (!enabled) await target?.reset();
}

export async function resetAnalytics() {
  plan = 'free';
  eventDeduper.reset();
  if (postNative('ANALYTICS_RESET', {})) return;
  await adapter?.reset();
}

export function getAnalyticsDebugEvents() {
  return [...debugAdapter.events];
}

export async function initializeAnalytics() {
  if (!hasAnalyticsConsent()) {
    await setAnalyticsConsent(false);
    return;
  }
  await setAnalyticsConsent(true);
}
