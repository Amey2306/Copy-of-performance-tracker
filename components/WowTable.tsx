
import React, { useMemo } from 'react';
import { WeeklyData, CalculatedMetrics, ViewMode, TimeGranularity } from '../types';

interface OngoingStatus {
    weekId: number;
    month: string;
    quarter: string;
    half: string;
}

interface Props {
  weeks: WeeklyData[];
  metrics: CalculatedMetrics;
  onUpdateWeek: (id: number, field: keyof WeeklyData, value: number) => void;
  viewMode: ViewMode;
  readOnly?: boolean;
  granularity: TimeGranularity;
  ongoingStatus: OngoingStatus;
}

const PercentInput = ({ value, onChange, readOnly }: { value: number, onChange: (val: number) => void, readOnly: boolean }) => (
  <div className="relative">
    <input
      type="number"
      disabled={readOnly}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full text-right border rounded px-1 py-1 text-xs font-bold ${readOnly ? 'bg-slate-900 border-transparent text-slate-500' : 'bg-amber-900/30 border-amber-800/50 text-amber-200 hover:bg-amber-900/50 focus:ring-1 focus:ring-amber-500 outline-none'}`}
    />
  </div>
);

export const WowTable: React.FC<Props> = ({ weeks, metrics, onUpdateWeek, viewMode, readOnly = false, granularity, ongoingStatus }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const aggregatedData = useMemo(() => {
    if (granularity === TimeGranularity.WEEKLY) return weeks.map(w => ({ ...w, isOngoing: w.id === ongoingStatus.weekId }));
    
    const buckets: Record<string, any> = {};
    weeks.forEach(w => {
        let key = "";
        let isMatch = false;
        if (granularity === TimeGranularity.MONTHLY) {
            key = w.monthLabel;
            isMatch = key === ongoingStatus.month;
        } else if (granularity === TimeGranularity.QUARTERLY) {
            key = w.quarterLabel;
            isMatch = key === ongoingStatus.quarter;
        } else {
            key = w.halfYearLabel;
            isMatch = key === ongoingStatus.half;
        }

        if (!buckets[key]) {
            buckets[key] = { label: key, isOngoing: isMatch, leads: 0, ap: 0, ad: 0, spendsBase: 0, spendsAllIn: 0, spendDistribution: 0, leadDistribution: 0, adConversionCount: 0, adConversionSum: 0 };
        }
        buckets[key].leads += w.leads;
        buckets[key].ap += w.ap;
        buckets[key].ad += w.ad;
        buckets[key].spendsBase += w.spendsBase;
        buckets[key].spendsAllIn += w.spendsAllIn;
        buckets[key].spendDistribution += w.spendDistribution;
        buckets[key].leadDistribution += w.leadDistribution;
        buckets[key].adConversionSum += w.adConversion;
        buckets[key].adConversionCount++;
    });

    return Object.values(buckets).map(b => ({
        ...b,
        weekLabel: b.label,
        dateRange: granularity === TimeGranularity.MONTHLY ? "Full Month" : granularity === TimeGranularity.QUARTERLY ? "Full Quarter" : "Half Year",
        adConversion: b.adConversionSum / b.adConversionCount
    }));
  }, [weeks, granularity, ongoingStatus]);

  const totalLeads = weeks.reduce((a, b) => a + b.leads, 0);
  const totalAp = weeks.reduce((a, b) => a + b.ap, 0);
  const totalAd = weeks.reduce((a, b) => a + b.ad, 0);
  const totalSpend = weeks.reduce((a, b) => a + (viewMode === ViewMode.AGENCY ? b.spendsAllIn : b.spendsBase), 0);

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col animate-in fade-in duration-300">
       <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">{granularity} Performance Plan</h2>
          <p className="text-sm text-slate-400">{readOnly ? "Locked View" : "Seasonality view for the Indian Financial Year."}</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="min-w-full text-xs text-right border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
              <th className="sticky left-0 bg-slate-950 px-4 py-3 text-left w-32 z-20 border-b border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Metric</th>
              {aggregatedData.map((d, i) => (
                <th key={i} className={`px-2 py-3 border-b border-slate-800 min-w-[130px] whitespace-nowrap relative ${d.isOngoing ? 'ring-2 ring-inset ring-brand-500 bg-brand-900/10' : ''}`}>
                  {d.isOngoing && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-brand-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-lg">ONGOING</div>
                  )}
                  <div className={`${d.isOngoing ? 'text-brand-400' : 'text-slate-200'} font-bold`}>{d.weekLabel}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{d.dateRange}</div>
                </th>
              ))}
              <th className="sticky right-0 bg-slate-950 px-4 py-3 border-b border-slate-800 z-20 w-24 text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">Leads (Tgt)</td>
              {aggregatedData.map((d, i) => <td key={i} className={`px-2 py-2 ${d.isOngoing ? 'bg-brand-900/5 font-black text-brand-300' : 'text-slate-200'}`}>{Math.round(d.leads).toLocaleString()}</td>)}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(totalLeads).toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">AD/Walkins (Tgt)</td>
              {aggregatedData.map((d, i) => <td key={i} className={`px-2 py-2 ${d.isOngoing ? 'bg-brand-900/5 font-black text-brand-300' : 'text-slate-200'}`}>{Math.round(d.ad).toLocaleString()}</td>)}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(totalAd).toLocaleString()}</td>
            </tr>
            <tr className={`hover:bg-slate-800/30 transition-colors font-medium ${viewMode === ViewMode.AGENCY ? 'text-amber-400' : 'text-emerald-400'}`}>
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold z-10 border-r border-slate-800">{viewMode === ViewMode.AGENCY ? 'All-in Budget' : 'Region Budget'}</td>
              {aggregatedData.map((d, i) => <td key={i} className={`px-2 py-2 ${d.isOngoing ? 'bg-brand-900/10 font-black' : ''}`}>{formatCurrency(viewMode === ViewMode.AGENCY ? d.spendsAllIn : d.spendsBase)}</td>)}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatCurrency(totalSpend)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
