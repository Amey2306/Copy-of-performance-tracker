
import React, { useMemo } from 'react';
import { WeeklyData, WeeklyActuals, ViewMode, PlanningData, TimeGranularity } from '../types';

interface OngoingStatus {
    weekId: number;
    month: string;
    quarter: string;
    half: string;
}

interface Props {
  weeks: WeeklyData[];
  actuals: Record<number, WeeklyActuals>;
  plan: PlanningData;
  onUpdateActual: (weekId: number, field: keyof WeeklyActuals, value: number) => void;
  viewMode: ViewMode;
  granularity: TimeGranularity;
  ongoingStatus: OngoingStatus;
}

const InputCell = ({ weekId, field, value, onUpdateActual, disabled, isOngoing }: { weekId: number, field: keyof WeeklyActuals, value: number | undefined, onUpdateActual: (id: number, f: keyof WeeklyActuals, v: number) => void, disabled: boolean, isOngoing: boolean }) => (
  <input
    type="number"
    value={value || ''}
    disabled={disabled}
    placeholder="-"
    onChange={(e) => onUpdateActual(weekId, field, parseFloat(e.target.value) || 0)}
    className={`w-full text-right ${isOngoing ? 'bg-brand-900/40 border-brand-500/50 text-brand-200' : 'bg-blue-900/30 border-transparent text-blue-200'} hover:bg-opacity-60 border rounded px-1 py-1 text-xs font-bold focus:ring-1 focus:ring-brand-500 outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  />
);

export const PerformanceTracker: React.FC<Props> = ({ weeks, actuals, plan, onUpdateActual, viewMode, granularity, ongoingStatus }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + plan.taxPercent/100) : 1;

  const aggregatedItems = useMemo(() => {
    const buckets: Record<string, any> = {};
    weeks.forEach(w => {
      let key = "";
      let isMatch = false;
      if (granularity === TimeGranularity.WEEKLY) {
          key = `W${w.id + 1}`;
          isMatch = w.id === ongoingStatus.weekId;
      }
      else if (granularity === TimeGranularity.MONTHLY) {
          key = w.monthLabel;
          isMatch = key === ongoingStatus.month;
      }
      else if (granularity === TimeGranularity.QUARTERLY) {
          key = w.quarterLabel;
          isMatch = key === ongoingStatus.quarter;
      }
      else {
          key = w.halfYearLabel;
          isMatch = key === ongoingStatus.half;
      }

      const act = actuals[w.id] || {};
      if (!buckets[key]) {
        buckets[key] = { 
          label: key, 
          isOngoing: isMatch, 
          dateRange: w.dateRange, 
          ids: [w.id],
          planLeads: 0, actLeads: 0, planAd: 0, actAd: 0, planSpend: 0, actSpend: 0, actBookings: 0 
        };
      } else {
          buckets[key].ids.push(w.id);
      }
      buckets[key].planLeads += w.leads;
      buckets[key].actLeads += (act.leads || 0);
      buckets[key].planAd += w.ad;
      buckets[key].actAd += (act.ad || 0);
      buckets[key].planSpend += (viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase);
      buckets[key].actSpend += (act.spends || 0) * taxMult;
      buckets[key].actBookings += (act.bookings || 0);
    });
    return Object.values(buckets);
  }, [weeks, actuals, granularity, viewMode, taxMult, ongoingStatus]);

  const totalActSpendRaw = weeks.reduce((a, b) => a + (actuals[b.id]?.spends || 0), 0);
  const totalActSpend = totalActSpendRaw * taxMult;
  const totalPlanLeads = weeks.reduce((a, b) => a + b.leads, 0);
  const totalActLeads = weeks.reduce((a, b) => a + (actuals[b.id]?.leads || 0), 0);

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col mt-4 animate-in fade-in duration-300">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div><h2 className="text-lg font-bold text-white">Performance Matrix ({granularity})</h2><p className="text-sm text-slate-400">Comparing Planned targets vs Actual execution.</p></div>
      </div>
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="min-w-full text-xs text-right border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="sticky left-0 bg-slate-950 px-4 py-3 text-left w-40 z-20 border-b border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Metric</th>
              {aggregatedItems.map((item, i) => (
                <th key={i} className={`px-2 py-3 border-b border-slate-800 min-w-[130px] whitespace-nowrap relative ${item.isOngoing ? 'ring-2 ring-inset ring-brand-500 bg-brand-900/10' : ''}`}>
                  {item.isOngoing && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-brand-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-lg">ONGOING</div>
                  )}
                  <div className={`${item.isOngoing ? 'text-brand-400' : 'text-slate-200'} font-black`}>{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{granularity === TimeGranularity.WEEKLY ? item.dateRange : 'Aggregate'}</div>
                </th>
              ))}
              <th className="sticky right-0 bg-slate-950 px-4 py-3 border-b border-slate-800 z-20 w-28 text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <tr>
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-400 z-10 border-r border-slate-800">Leads (Actual)</td>
               {aggregatedItems.map((item, i) => (
                 <td key={i} className={`px-1 py-1 ${item.isOngoing ? 'bg-brand-900/5' : ''}`}>
                   {granularity === TimeGranularity.WEEKLY ? (
                     <InputCell weekId={item.ids[0]} field="leads" value={actuals[item.ids[0]]?.leads} onUpdateActual={onUpdateActual} disabled={false} isOngoing={item.isOngoing} />
                   ) : <span className={`font-black px-2 ${item.isOngoing ? 'text-brand-400' : 'text-blue-200'}`}>{item.actLeads.toLocaleString()}</span>}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{totalActLeads.toLocaleString()}</td>
            </tr>
            <tr className="bg-slate-950/20">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-500 z-10 border-r border-slate-800 italic">Leads Delivery %</td>
               {aggregatedItems.map((item, i) => <td key={i} className={`px-2 py-2 font-bold ${item.actLeads >= item.planLeads ? 'text-emerald-400' : 'text-rose-400'} ${item.isOngoing ? 'bg-brand-900/5' : ''}`}>{item.planLeads > 0 ? formatPercent((item.actLeads / item.planLeads)*100) : '-'}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 text-slate-500 italic shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{totalPlanLeads > 0 ? formatPercent((totalActLeads/totalPlanLeads)*100) : '-'}</td>
            </tr>
            <tr>
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-400 z-10 border-r border-slate-800">Spends (Actual)</td>
               {aggregatedItems.map((item, i) => (
                 <td key={i} className={`px-1 py-1 ${item.isOngoing ? 'bg-brand-900/5' : ''}`}>
                   {granularity === TimeGranularity.WEEKLY ? (
                     <InputCell weekId={item.ids[0]} field="spends" value={actuals[item.ids[0]]?.spends ? Math.round(actuals[item.ids[0]]?.spends! * taxMult) : undefined} onUpdateActual={(wid, f, v) => onUpdateActual(wid, f, v / taxMult)} disabled={false} isOngoing={item.isOngoing} />
                   ) : <span className={`font-black px-2 ${item.isOngoing ? 'text-brand-400' : 'text-blue-200'}`}>{formatCurrency(item.actSpend)}</span>}
                 </td>
               ))}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatCurrency(totalActSpend)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
