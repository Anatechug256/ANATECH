import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPriceTrendForListing } from '../data/priceTrends';
import { store } from '../services/marketplaceStore';

interface PriceTrendChartProps {
  categoryId: string;
  itemPrice: number;
  itemTitle: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  categoryId,
  itemPrice,
  itemTitle
}) => {
  const { trend, priceComparison } = getPriceTrendForListing(categoryId, itemPrice);

  const formattedItemPrice = store.formatPrice(itemPrice);
  const formattedAvgPrice = store.formatPrice(priceComparison.avgCurrent);

  // Format Y-axis in compact notation (e.g. 2.4M, 50k)
  const formatYAxis = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`;
    }
    return String(val);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <div className="font-bold text-slate-300 pb-0.5 border-b border-slate-800">
            {label} 2026 Trend
          </div>
          <div className="flex items-center justify-between gap-3 text-cyan-400 font-mono font-semibold">
            <span>Category Avg:</span>
            <span>UGX {dataPoint.avgPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] tabular-nums">
            <span>Typical Range:</span>
            <span>UGX {dataPoint.lowPrice.toLocaleString()} - {dataPoint.highPrice.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Historical Price Trend</span>
              <span className="text-[10px] font-normal text-slate-500">(Past 6 Months)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {trend.trendDescription}
            </p>
          </div>
        </div>

        {/* Price Valuation Verdict */}
        <div className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto ${
          priceComparison.verdict === 'great_deal' 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' 
            : priceComparison.verdict === 'above_average'
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        }`}>
          {priceComparison.verdict === 'great_deal' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span>{priceComparison.label}</span>
        </div>
      </div>

      {/* Mini-Chart Container */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend.data}
            margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="anatechPriceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="month" 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            
            <YAxis 
              stroke="#94A3B8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatYAxis}
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line for the Current Listing Price */}
            <ReferenceLine 
              y={itemPrice} 
              stroke="#F59E0B" 
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ 
                value: `This: ${formatYAxis(itemPrice)}`, 
                fill: '#F59E0B', 
                fontSize: 10, 
                position: 'insideTopRight' 
              }}
            />

            <Area 
              type="monotone" 
              dataKey="avgPrice" 
              stroke="#06B6D4" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#anatechPriceGradient)" 
              dot={{ r: 3, fill: '#06B6D4', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: '#0891B2' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Market Insight & Statistics Row */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <p className="leading-snug flex-1">
          <strong className="text-slate-700 dark:text-slate-300">ANATECH Market Insight:</strong> {trend.marketInsight}
        </p>
        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          <span>Current Avg: <strong className="text-slate-700 dark:text-slate-300">{formattedAvgPrice}</strong></span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>Volatility: <strong className="capitalize text-slate-700 dark:text-slate-300">{trend.volatility}</strong></span>
        </div>
      </div>
    </div>
  );
};
