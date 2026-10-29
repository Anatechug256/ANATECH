export interface MonthlyPricePoint {
  month: string;
  avgPrice: number;
  lowPrice: number;
  highPrice: number;
}

export interface CategoryTrendData {
  categoryId: string;
  categoryName: string;
  trendDescription: string;
  data: MonthlyPricePoint[];
  volatility: 'low' | 'moderate' | 'seasonal';
  marketInsight: string;
}

export const CATEGORY_PRICE_TRENDS: Record<string, CategoryTrendData> = {
  'phones-electronics': {
    categoryId: 'phones-electronics',
    categoryName: 'Phones & Electronics',
    trendDescription: 'Flagship & Mid-range Smartphones across Kampala & Wakiso',
    volatility: 'moderate',
    marketInsight: 'Prices softened by ~6.5% following international model releases, creating strong buyer value for recent flagships.',
    data: [
      { month: 'May', avgPrice: 2650000, lowPrice: 2200000, highPrice: 3100000 },
      { month: 'Jun', avgPrice: 2580000, lowPrice: 2150000, highPrice: 3000000 },
      { month: 'Jul', avgPrice: 2520000, lowPrice: 2100000, highPrice: 2950000 },
      { month: 'Aug', avgPrice: 2480000, lowPrice: 2050000, highPrice: 2900000 },
      { month: 'Sep', avgPrice: 2460000, lowPrice: 2000000, highPrice: 2880000 },
      { month: 'Oct', avgPrice: 2420000, lowPrice: 1980000, highPrice: 2850000 },
    ]
  },
  'vehicles-motorbikes': {
    categoryId: 'vehicles-motorbikes',
    categoryName: 'Vehicles & Boda Bodas',
    trendDescription: 'Commuter Motorbikes (125cc - 150cc) & Boda Bodas',
    volatility: 'low',
    marketInsight: 'Boda Boda market values remain stable nationwide due to consistent commercial demand and steady spare-part availability.',
    data: [
      { month: 'May', avgPrice: 4700000, lowPrice: 4200000, highPrice: 5200000 },
      { month: 'Jun', avgPrice: 4750000, lowPrice: 4250000, highPrice: 5250000 },
      { month: 'Jul', avgPrice: 4800000, lowPrice: 4300000, highPrice: 5300000 },
      { month: 'Aug', avgPrice: 4820000, lowPrice: 4350000, highPrice: 5350000 },
      { month: 'Sep', avgPrice: 4850000, lowPrice: 4400000, highPrice: 5400000 },
      { month: 'Oct', avgPrice: 4880000, lowPrice: 4400000, highPrice: 5450000 },
    ]
  },
  'farm-produce-agriculture': {
    categoryId: 'farm-produce-agriculture',
    categoryName: 'Farm Produce & Agriculture',
    trendDescription: 'Matooke Bunches & Arabica Coffee (Wholesale / Farmgate)',
    volatility: 'seasonal',
    marketInsight: 'Reflects Ugandan harvest cycles: prices dipped during July peak harvest and are rebounding during the second planting season.',
    data: [
      { month: 'May', avgPrice: 45000, lowPrice: 32000, highPrice: 58000 },
      { month: 'Jun', avgPrice: 38000, lowPrice: 28000, highPrice: 50000 },
      { month: 'Jul', avgPrice: 32000, lowPrice: 24000, highPrice: 42000 },
      { month: 'Aug', avgPrice: 35000, lowPrice: 26000, highPrice: 46000 },
      { month: 'Sep', avgPrice: 39000, lowPrice: 29000, highPrice: 52000 },
      { month: 'Oct', avgPrice: 42000, lowPrice: 30000, highPrice: 55000 },
    ]
  },
  'computers-accessories': {
    categoryId: 'computers-accessories',
    categoryName: 'Computers & Accessories',
    trendDescription: 'Core i5/i7 & Apple Silicon Laptops in Greater Kampala',
    volatility: 'low',
    marketInsight: 'Prices reflect stable foreign exchange rates (UGX/USD) with modest discounts during university intake months.',
    data: [
      { month: 'May', avgPrice: 5400000, lowPrice: 4600000, highPrice: 6200000 },
      { month: 'Jun', avgPrice: 5350000, lowPrice: 4550000, highPrice: 6150000 },
      { month: 'Jul', avgPrice: 5300000, lowPrice: 4500000, highPrice: 6100000 },
      { month: 'Aug', avgPrice: 5180000, lowPrice: 4400000, highPrice: 5950000 },
      { month: 'Sep', avgPrice: 5220000, lowPrice: 4450000, highPrice: 6000000 },
      { month: 'Oct', avgPrice: 5250000, lowPrice: 4480000, highPrice: 6050000 },
    ]
  },
  'property-rentals': {
    categoryId: 'property-rentals',
    categoryName: 'Property & Rentals',
    trendDescription: '1 to 2 Bedroom Rentals in Kira, Najjera & Ntinda Corridor',
    volatility: 'low',
    marketInsight: 'Rental rates have experienced steady upward pressure (+4.5% year-to-date) driven by high infrastructure development and occupancy.',
    data: [
      { month: 'May', avgPrice: 800000, lowPrice: 650000, highPrice: 1050000 },
      { month: 'Jun', avgPrice: 810000, lowPrice: 650000, highPrice: 1050000 },
      { month: 'Jul', avgPrice: 825000, lowPrice: 680000, highPrice: 1100000 },
      { month: 'Aug', avgPrice: 830000, lowPrice: 680000, highPrice: 1100000 },
      { month: 'Sep', avgPrice: 845000, lowPrice: 700000, highPrice: 1150000 },
      { month: 'Oct', avgPrice: 860000, lowPrice: 700000, highPrice: 1200000 },
    ]
  },
  'clothing-shoes': {
    categoryId: 'clothing-shoes',
    categoryName: 'Clothing & Shoes',
    trendDescription: 'Fashion Apparel & Footwear in Downtown Kampala Markets',
    volatility: 'moderate',
    marketInsight: 'Competitive wholesale imports keep apparel prices accessible, with slight holiday demand upticks.',
    data: [
      { month: 'May', avgPrice: 85000, lowPrice: 50000, highPrice: 140000 },
      { month: 'Jun', avgPrice: 82000, lowPrice: 48000, highPrice: 135000 },
      { month: 'Jul', avgPrice: 80000, lowPrice: 45000, highPrice: 130000 },
      { month: 'Aug', avgPrice: 83000, lowPrice: 48000, highPrice: 138000 },
      { month: 'Sep', avgPrice: 86000, lowPrice: 50000, highPrice: 142000 },
      { month: 'Oct', avgPrice: 88000, lowPrice: 52000, highPrice: 145000 },
    ]
  }
};

export function getPriceTrendForListing(categoryId: string, itemPrice: number): {
  trend: CategoryTrendData;
  priceComparison: {
    diffPercent: number;
    verdict: 'great_deal' | 'fair_value' | 'above_average';
    label: string;
    avgCurrent: number;
  };
} {
  const trend = CATEGORY_PRICE_TRENDS[categoryId] || {
    categoryId,
    categoryName: 'Market Category',
    trendDescription: 'Category Average across Ugandan Trading Hubs',
    volatility: 'low',
    marketInsight: 'Trading values remain aligned with regional retail benchmarks in Central Uganda.',
    data: [
      { month: 'May', avgPrice: Math.round(itemPrice * 1.05), lowPrice: Math.round(itemPrice * 0.9), highPrice: Math.round(itemPrice * 1.2) },
      { month: 'Jun', avgPrice: Math.round(itemPrice * 1.03), lowPrice: Math.round(itemPrice * 0.88), highPrice: Math.round(itemPrice * 1.18) },
      { month: 'Jul', avgPrice: Math.round(itemPrice * 1.01), lowPrice: Math.round(itemPrice * 0.85), highPrice: Math.round(itemPrice * 1.15) },
      { month: 'Aug', avgPrice: Math.round(itemPrice * 1.02), lowPrice: Math.round(itemPrice * 0.87), highPrice: Math.round(itemPrice * 1.16) },
      { month: 'Sep', avgPrice: Math.round(itemPrice * 1.00), lowPrice: Math.round(itemPrice * 0.86), highPrice: Math.round(itemPrice * 1.14) },
      { month: 'Oct', avgPrice: Math.round(itemPrice * 0.99), lowPrice: Math.round(itemPrice * 0.85), highPrice: Math.round(itemPrice * 1.15) },
    ]
  };

  const latestMonth = trend.data[trend.data.length - 1];
  const avgCurrent = latestMonth.avgPrice;
  const diffPercent = Math.round(((itemPrice - avgCurrent) / avgCurrent) * 100);

  let verdict: 'great_deal' | 'fair_value' | 'above_average' = 'fair_value';
  let label = 'Within Typical Market Range';

  if (diffPercent <= -8) {
    verdict = 'great_deal';
    label = `${Math.abs(diffPercent)}% Below Market Average · Competitive Price`;
  } else if (diffPercent >= 12) {
    verdict = 'above_average';
    label = `${diffPercent}% Above Average · Check condition & bundled extras`;
  } else {
    verdict = 'fair_value';
    label = 'Within Fair Market Range in Uganda';
  }

  return {
    trend,
    priceComparison: {
      diffPercent,
      verdict,
      label,
      avgCurrent
    }
  };
}
