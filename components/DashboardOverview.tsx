
import React, { useState } from 'react';
import { Project, ViewMode, Poc, User, UserRole, PlanningData, TimeGranularity, WeeklyActuals } from '../types';
import { ArrowRight, AlertTriangle, Trash2, Download, LayoutGrid, List, ChevronDown, ChevronUp, ExternalLink, Target, IndianRupee, PieChart, Layers, TrendingUp, AlertCircle, Lock, X, Clock } from 'lucide-react';
import { exportMasterReport } from '../utils/exportUtils';

interface OngoingStatus {
    weekId: number;
    month: string;
    quarter: string;
    half: string;
}

interface Props {
  projects: Project[];
  viewMode: ViewMode;
  granularity: TimeGranularity;
  ongoingStatus: OngoingStatus;
  currentUser: User;
  onSelectProject: (id: string) => void;
  onUpdateProjectField: (id: string, field: 'receivedBudget' | 'otherSpends', value: number) => void;
  onUpdatePlan: (id: string, key: keyof PlanningData, value: number | string) => void;
  startWeekIndex: number;
  endWeekIndex: number;
  pocs: Poc[];
  onUpdateProjectPoc: (id: string, newPoc: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProjectActualRevenue: (id: string, vertical: 'digital' | 'presales' | 'brand' | 'referral' | 'cp', value: number) => void;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDecimal = (val: number) => val.toFixed(1);
const formatPercent = (val: number) => `${val.toFixed(1)}%`;

const BusinessOverview = ({ projects, ongoingStatus }: { projects: Project[], ongoingStatus: OngoingStatus }) => {
  let totalPlanBV = 0;
  let totalDigitalTarget = 0;
  let totalPresalesTarget = 0;
  let totalCPTarget = 0;
  
  let totalDigitalAchieved = 0;
  let totalPresalesAchieved = 0;
  let totalCPAchieved = 0;

  projects.forEach(p => {
    totalPlanBV += p.plan.overallBV;
    totalDigitalTarget += p.plan.overallBV * (p.plan.digitalContributionPercent / 100);
    totalPresalesTarget += p.plan.overallBV * (p.plan.presalesContributionPercent / 100);
    totalCPTarget += p.plan.overallBV * ((p.plan.cpContributionPercent || 0) / 100);

    const ats = p.plan.ats;
    Object.values(p.actuals).forEach((act: WeeklyActuals) => {
       totalDigitalAchieved += (act.bookings || 0) * ats;
       totalPresalesAchieved += (act.presalesBookings || 0) * ats;
       totalCPAchieved += (act.cpBookings || 0) * ats;
    });
  });

  const totalAchievedBV = totalDigitalAchieved + totalPresalesAchieved + totalCPAchieved;
  const digitalDeficit = totalDigitalTarget - totalDigitalAchieved;
  const digitalAchievementPct = totalDigitalTarget > 0 ? (totalDigitalAchieved / totalDigitalTarget) * 100 : 0;
  
  const renderVerticalRow = (label: string, target: number, achieved: number, colorClass: string, barColor: string) => {
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    const isDeficit = achieved < target;
    return (
        <div className="group flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 px-2 rounded transition-colors">
            <div className="w-24"><span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{label}</span></div>
            <div className="flex-1 px-4">
                <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-400"><span>{pct.toFixed(1)}%</span><span>Tgt: ₹{target.toFixed(1)}</span></div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div>
            </div>
            <div className="text-right w-20"><div className="text-sm font-black text-white">₹{achieved.toFixed(1)}</div><div className={`text-[9px] font-bold ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>{isDeficit ? '-' : '+'}{Math.abs(achieved - target).toFixed(1)} Cr</div></div>
        </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl mb-8 relative overflow-hidden group">
       <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner"><Layers className="w-8 h-8 text-indigo-400" /></div>
             <div>
                <h3 className="text-lg font-black text-white tracking-tight">Portfolio Financial Status</h3>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400 font-medium tracking-wide">Aggregated targets for the {ongoingStatus.quarter} cycle.</p>
                    <span className="text-[10px] font-black text-brand-400 bg-brand-950/40 border border-brand-900/50 px-2 py-0.5 rounded uppercase animate-pulse">Live Tracking</span>
                </div>
             </div>
          </div>
          <div className="flex gap-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800 shadow-xl">
              <div className="text-right"><div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Target BV</div><div className="text-2xl font-black text-slate-300">₹{totalPlanBV.toFixed(0)} Cr</div></div>
              <div className="text-right"><div className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Achieved</div><div className="text-2xl font-black text-white">₹{totalAchievedBV.toFixed(1)} Cr</div></div>
          </div>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-center shadow-inner relative overflow-hidden">
             <div className="flex justify-between items-center mb-4"><h4 className="text-xs font-bold text-white uppercase flex items-center gap-2"><Target className="w-4 h-4 text-brand-400" /> Digital Mandate</h4></div>
             <div className="flex items-end gap-3 mb-2"><span className="text-4xl font-black text-white">₹{totalDigitalAchieved.toFixed(1)} Cr</span><span className="text-xs text-slate-500 font-bold mb-1">/ ₹{totalDigitalTarget.toFixed(1)}</span></div>
             <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-4"><div className={`h-full rounded-full transition-all duration-1000 ${digitalDeficit > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(digitalAchievementPct, 100)}%` }}></div></div>
             <div className="flex items-center justify-between">{digitalDeficit > 0 ? (<div className="flex items-center gap-2 text-red-400 text-xs font-bold"><AlertCircle className="w-4 h-4" /> Deficit: ₹{digitalDeficit.toFixed(1)} Cr</div>) : (<div className="flex items-center gap-2 text-emerald-400 text-xs font-bold"><TrendingUp className="w-4 h-4" /> Surplus: ₹{Math.abs(digitalDeficit).toFixed(1)} Cr</div>)}</div>
          </div>
          <div className="lg:col-span-7 bg-slate-950/50 rounded-2xl border border-slate-800 p-5 flex flex-col shadow-inner">
             <span className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><PieChart className="w-3.5 h-3.5" /> Vertical Performance Matrix</span>
             <div className="flex flex-col space-y-1">
                {renderVerticalRow("Digital", totalDigitalTarget, totalDigitalAchieved, "text-indigo-400", "bg-indigo-500")}
                {renderVerticalRow("Presales", totalPresalesTarget, totalPresalesAchieved, "text-blue-400", "bg-blue-500")}
                {renderVerticalRow("CP", totalCPTarget, totalCPAchieved, "text-purple-400", "bg-purple-500")}
             </div>
          </div>
       </div>
    </div>
  );
};

export const DashboardOverview: React.FC<Props> = ({ 
  projects, viewMode, granularity, ongoingStatus, currentUser, onSelectProject, onUpdateProjectField, onUpdatePlan, startWeekIndex, endWeekIndex, pocs, onUpdateProjectPoc, onDeleteProject, onUpdateProjectActualRevenue 
}) => {
  const [viewType, setViewType] = useState<'table' | 'grid'>('grid');

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mb-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <div><h2 className="text-xl font-bold text-white tracking-tight">Portfolio Tracker</h2><p className="text-sm text-slate-500 mt-0.5">FY Period Comparison Mode: <span className="text-brand-400 font-bold uppercase">{granularity}</span></p></div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button onClick={() => setViewType('grid')} className={`p-1.5 rounded transition-all ${viewType === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewType('table')} className={`p-1.5 rounded transition-all ${viewType === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><List className="w-4 h-4" /></button>
           </div>
           <button onClick={() => exportMasterReport(projects, viewMode)} className="flex items-center gap-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-900/50 px-3 py-2 rounded-lg text-xs font-bold transition-all"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      <div className="px-6 pt-6">
        <BusinessOverview projects={projects} ongoingStatus={ongoingStatus} />
      </div>
      
      {viewType === 'grid' ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-950/30 min-h-[400px]">
           {projects.map(p => {
               const taxDivisor = (1 + p.plan.taxPercent/100);
               const displayPlan = viewMode === ViewMode.AGENCY ? p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0) : p.weeks.reduce((sum, w) => sum + w.spendsBase, 0);
               const displayReceived = viewMode === ViewMode.AGENCY ? p.plan.receivedBudget : (p.plan.receivedBudget / taxDivisor);
               const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
               const achLeads = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
               const achAD = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);

               return (
                <div key={p.id} className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 flex flex-col justify-between group hover:border-brand-500/30 transition-all hover:translate-y-[-2px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 onClick={() => onSelectProject(p.id)} className="text-xl font-bold text-white cursor-pointer hover:text-brand-400 transition-colors">{p.name}</h3>
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{p.poc}</span>
                            </div>
                            {currentUser.role === UserRole.GM && (<button onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${p.name}?`)) onDeleteProject(p.id); }} className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20 transition-all"><Trash2 className="w-4 h-4" /></button>)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div><div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Plan</div><div className="text-base font-medium text-slate-200">{formatCurrency(displayPlan)}</div></div>
                            <div><div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Received</div><div className="text-base font-medium text-slate-200">{formatCurrency(displayReceived)}</div></div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 grid grid-cols-2 gap-4 relative overflow-hidden">
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-500/30"></div>
                            <div><div className="text-[9px] text-indigo-400 font-bold uppercase">Leads (Period)</div><div className="text-lg font-bold text-white">{achLeads.toLocaleString()}</div></div>
                            <div><div className="text-[9px] text-pink-400 font-bold uppercase">Walkins (Period)</div><div className="text-lg font-bold text-white">{achAD.toLocaleString()}</div></div>
                        </div>
                    </div>
                    <button onClick={() => onSelectProject(p.id)} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">Deep Dive Dashboard <ExternalLink className="w-3.5 h-3.5" /></button>
                </div>
               );
           })}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar pb-4 bg-obsidian-900">
           <table className="min-w-max text-[10px] text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                 <tr>
                    <th className="px-4 py-3 sticky left-0 bg-slate-950 z-20 border-r border-slate-800">Project & SPOC</th>
                    <th className="px-3 py-3 text-right">Plan BV (Cr)</th>
                    <th className="px-3 py-3 text-right">Received Budget</th>
                    <th className="px-3 py-3 text-right">Leads (LTD)</th>
                    <th className="px-3 py-3 text-right">Walkins (LTD)</th>
                    <th className="px-3 py-3 text-right">Revenue (LTD)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {projects.map(p => {
                    // Added explicit number typing for accumulator to avoid TS errors
                    const achLeads = Object.values(p.actuals).reduce((s: number, a: WeeklyActuals) => s + (a.leads || 0), 0);
                    const achAD = Object.values(p.actuals).reduce((s: number, a: WeeklyActuals) => s + (a.ad || 0), 0);
                    const achUnits = Object.values(p.actuals).reduce((s: number, a: WeeklyActuals) => s + (a.bookings || 0) + (a.cpBookings || 0) + (a.presalesBookings || 0), 0);
                    return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 sticky left-0 bg-slate-900 border-r border-slate-800 font-bold text-white" onClick={() => onSelectProject(p.id)}>{p.name} <span className="block text-[9px] text-slate-500 font-medium">SPOC: {p.poc}</span></td>
                            <td className="px-3 py-3 text-right">{p.plan.overallBV} Cr</td>
                            <td className="px-3 py-3 text-right">{formatCurrency(p.plan.receivedBudget)}</td>
                            <td className="px-3 py-3 text-right text-indigo-400 font-bold">{achLeads.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right text-pink-400 font-bold">{achAD.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right text-emerald-400 font-black">{formatRev(achUnits * p.plan.ats)}</td>
                            <td className="px-4 py-3 text-center"><button onClick={() => onSelectProject(p.id)} className="text-brand-400 hover:text-brand-300 font-bold uppercase tracking-tight">Open</button></td>
                        </tr>
                    )
                })}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

const formatRev = (val: number) => `₹${val.toFixed(1)} Cr`;
