export const ANALYTICS_EVENTS = {
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_LIKED: 'product_liked',
  CART_ITEM_ADDED: 'cart_item_added',
  CART_VIEWED: 'cart_viewed',
  CUSTOM_REQUEST_STARTED: 'custom_request_started',
  CUSTOM_REQUEST_SUBMITTED: 'custom_request_submitted',
  CHECKOUT_VIEWED: 'checkout_viewed',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  SELLER_SIGNUP_STARTED: 'seller_signup_started',
  SELLER_PROFILE_COMPLETED: 'seller_profile_completed',
  SELLER_PRODUCT_CREATED: 'seller_product_created',
  SELLER_ORDER_OPENED: 'seller_order_opened',
  SELLER_ORDER_FULFILLED: 'seller_order_fulfilled',
  DESIGN_TOOL_ENTERED: 'design_tool_entered',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
export type AnalyticsPropertyValue = string | number | boolean;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue | null | undefined>;

const EVENT_NAMES = new Set<string>(Object.values(ANALYTICS_EVENTS));
const DEDUPED_EVENT_NAMES = new Set<AnalyticsEventName>([
  ANALYTICS_EVENTS.PRODUCT_VIEWED,
  ANALYTICS_EVENTS.CART_VIEWED,
  ANALYTICS_EVENTS.CHECKOUT_VIEWED,
  ANALYTICS_EVENTS.PURCHASE_COMPLETED,
  ANALYTICS_EVENTS.SELLER_SIGNUP_STARTED,
  ANALYTICS_EVENTS.DESIGN_TOOL_ENTERED,
]);
const SAFE_PROPERTY_KEYS = new Set([
  'app_id',
  'app_version',
  'build_number',
  'platform',
  'environment',
  'locale',
  'plan',
  'feature',
  'entry_source',
  'item_type',
  'product_type',
  'fulfillment_mode',
  'checkout_mode',
  'seller_status',
  'order_status',
  'payment_provider',
  'currency',
  'value',
  'quantity',
  'item_count',
  'debug_mode',
]);

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === 'string' && EVENT_NAMES.has(value);
}

/**
 * Privacy boundary shared by web and native. Unknown keys, objects and long
 * strings are dropped so free text, addresses, images and raw order payloads
 * cannot accidentally reach an analytics SDK.
 */
export function sanitizeAnalyticsProperties(input?: AnalyticsProperties): Record<string, AnalyticsPropertyValue> {
  const safe: Record<string, AnalyticsPropertyValue> = {};
  if (!input) return safe;

  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_PROPERTY_KEYS.has(key) || value === null || value === undefined) continue;
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized || normalized.length > 100) continue;
      safe[key] = normalized;
      continue;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * Suppresses only naturally single-occurrence page/funnel events that can be
 * emitted twice by React Strict Mode or duplicate native bridge delivery.
 * Action events such as add-to-cart and purchase-started are never suppressed.
 */
export class AnalyticsEventDeduper {
  private readonly recent = new Map<string, number>();

  constructor(
    private readonly windowMs = 5_000,
    private readonly now: () => number = Date.now,
  ) {}

  shouldTrack(event: AnalyticsEventName, properties: Record<string, AnalyticsPropertyValue>) {
    if (!DEDUPED_EVENT_NAMES.has(event)) return true;

    const signature = `${event}:${JSON.stringify(
      Object.entries(properties).sort(([left], [right]) => left.localeCompare(right)),
    )}`;
    const currentTime = this.now();
    const previousTime = this.recent.get(signature);
    this.recent.set(signature, currentTime);

    for (const [key, timestamp] of this.recent) {
      if (currentTime - timestamp > this.windowMs) this.recent.delete(key);
    }

    return previousTime === undefined || currentTime - previousTime > this.windowMs;
  }

  reset() {
    this.recent.clear();
  }
}
