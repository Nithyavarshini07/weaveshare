export type EcoStats = {
  yarnReusedKg: number;
  wasteDivertedKg: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  treesEquivalent: number;
  energySavedKwh: number;
  ordersCompleted: number;
  listingsResold: number;
  sellersContributing: number;
};

export type MonthlyImpact = {
  month: string;
  yarnReusedKg: number;
  co2SavedKg: number;
};

export function computePlatformEcoStats(
  listings: any[],
  orders: any[]
): EcoStats {
  const delivered = orders.filter(
    (order) => (order.orderStatus || order.status) === 'DELIVERED'
  );

  let yarnReusedKg = 0;
  delivered.forEach((order) => {
    (order.items || []).forEach((item: any) => {
      const yarnId = String(item.yarnId || item.yarn?._id || '');
      const yarn = listings.find((listing) => String(listing._id || listing.id) === yarnId);
      const rawWeight = Number(item.weight ?? yarn?.weight ?? 0);
      const unit = String(item.weightUnit ?? yarn?.weightUnit ?? 'kg').toLowerCase();
      const weightKg = unit === 'g' ? rawWeight / 1000 : rawWeight;
      const quantity = Number(item.quantity || 1);
      yarnReusedKg += weightKg * quantity;
    });
  });

  const round = (value: number) => Number(value.toFixed(1));

  return {
    yarnReusedKg: round(yarnReusedKg),
    wasteDivertedKg: round(yarnReusedKg),
    co2SavedKg: round(yarnReusedKg * 2.5),
    waterSavedLiters: round(yarnReusedKg * 500),
    treesEquivalent: round(yarnReusedKg * 2.5 / 21),
    energySavedKwh: round(yarnReusedKg * 8),
    ordersCompleted: delivered.length,
    listingsResold: listings.filter((listing) => listing.status === 'SOLD').length,
    sellersContributing: new Set(
      delivered.map((order) => String(order.sellerId)).filter(Boolean)
    ).size,
  };
}

export function getPlatformMonthlyImpact(): MonthlyImpact[] {
  return [
    { month: 'Aug', yarnReusedKg: 85, co2SavedKg: 212 },
    { month: 'Sep', yarnReusedKg: 122, co2SavedKg: 305 },
    { month: 'Oct', yarnReusedKg: 168, co2SavedKg: 420 },
    { month: 'Nov', yarnReusedKg: 210, co2SavedKg: 525 },
    { month: 'Dec', yarnReusedKg: 254, co2SavedKg: 635 },
    { month: 'Jan', yarnReusedKg: 312, co2SavedKg: 780 },
  ];
}
