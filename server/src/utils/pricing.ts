export type MaterialType = 'COTTON' | 'SILK' | 'WOOL' | 'LINEN' | 'POLYESTER' | 'MIXED' | 'OTHER';
export type YarnCondition = 'NEW_LEFTOVER' | 'GOOD' | 'USED' | 'MIXED';

const BASE_PRICES: Record<MaterialType, number> = {
  COTTON: 180,
  SILK: 450,
  WOOL: 300,
  LINEN: 350,
  POLYESTER: 150,
  MIXED: 200,
  OTHER: 180,
};

const QUALITY_MULTIPLIERS: Record<YarnCondition, number> = {
  NEW_LEFTOVER: 1.0,
  GOOD: 0.9,
  USED: 0.7,
  MIXED: 0.6,
};

export function calculateSuggestedPrice(weightInKg: number, materialType: MaterialType, condition: YarnCondition) {
  const base = BASE_PRICES[materialType] ?? BASE_PRICES.COTTON;
  const multiplier = QUALITY_MULTIPLIERS[condition] ?? QUALITY_MULTIPLIERS.GOOD;

  return Number((weightInKg * base * multiplier).toFixed(2));
}

export function getBasePrice(materialType: MaterialType) {
  return BASE_PRICES[materialType] ?? BASE_PRICES.COTTON;
}

export function normalizeWeight(weight: number, unit: string) {
  return unit.toLowerCase() === 'g' ? weight / 1000 : weight;
}

export function getQualityMultiplier(condition: YarnCondition) {
  return QUALITY_MULTIPLIERS[condition] ?? QUALITY_MULTIPLIERS.GOOD;
}
