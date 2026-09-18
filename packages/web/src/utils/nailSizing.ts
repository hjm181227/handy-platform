export const NAIL_FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'] as const;
export type FingerMeasurements = Record<typeof NAIL_FINGERS[number], number>;
export interface NailSizing {
  unit: 'mm';
  left: FingerMeasurements;
  right: FingerMeasurements;
  confirmedAt?: string;
}

/** Canonical order snapshot. Never read a mutable user profile during production. */
export function parseNailSizing(input: unknown): NailSizing | undefined {
  try {
    if (typeof input === 'string' && input.length > 2000) return undefined;
    const value = typeof input === 'string' ? JSON.parse(input) : input;
    if (!value || typeof value !== 'object' || value.unit !== 'mm') return undefined;
    const result: NailSizing = { unit: 'mm', left: {} as FingerMeasurements, right: {} as FingerMeasurements };
    for (const hand of ['left', 'right'] as const) {
      for (const finger of NAIL_FINGERS) {
        const width = value[hand]?.[finger];
        if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0 || width > 50) return undefined;
        result[hand][finger] = Math.round(width * 100) / 100;
        if (result[hand][finger] <= 0) return undefined;
      }
    }
    return result;
  } catch { return undefined; }
}
