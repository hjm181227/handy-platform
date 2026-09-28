import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import {
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
  AnalyticsEventDeduper,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@handy-platform/shared';
import { getAppEnvironment } from '../config/environment';

const CONSENT_KEY = '@handy_platform:analyticsConsent';

class AnalyticsService {
  private enabled = false;
  private initialized = false;
  private readonly eventDeduper = new AnalyticsEventDeduper();

  async initialize() {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    await this.setConsent(stored === 'granted', false);
    this.initialized = true;
  }

  async setConsent(enabled: boolean, persist = true) {
    this.enabled = enabled;
    this.eventDeduper.reset();
    if (persist) await AsyncStorage.setItem(CONSENT_KEY, enabled ? 'granted' : 'denied');
    await analytics().setConsent({
      analytics_storage: enabled,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
    await analytics().setAnalyticsCollectionEnabled(enabled);
    if (!enabled) await analytics().setUserId(null);
  }

  async track(event: AnalyticsEventName, properties?: AnalyticsProperties) {
    if (!this.initialized) await this.initialize();
    if (!this.enabled || !isAnalyticsEventName(event)) return;
    const safe = sanitizeAnalyticsProperties({
      app_id: 'handy',
      environment: getAppEnvironment(),
      ...properties,
    });
    // Firebase automatically supplies platform, app version/build and locale.
    delete safe.platform;
    delete safe.app_version;
    delete safe.build_number;
    delete safe.locale;
    if (!this.eventDeduper.shouldTrack(event, safe)) return;
    await analytics().logEvent(event, safe);
  }

  async setUser(opaqueUserId: unknown) {
    if (!this.enabled) return;
    const value = typeof opaqueUserId === 'string' && /^[0-9a-f-]{36}$/i.test(opaqueUserId)
      ? opaqueUserId
      : null;
    await analytics().setUserId(value);
  }

  async reset() {
    this.eventDeduper.reset();
    await analytics().setUserId(null);
    if (this.enabled) await analytics().resetAnalyticsData();
  }
}

export const analyticsService = new AnalyticsService();
