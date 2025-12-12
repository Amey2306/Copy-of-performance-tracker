
import React, { useState } from 'react';
import { Project, ViewMode, Poc, User, UserRole, PlanningData } from '../types';
import { ArrowRight, AlertTriangle, Trash2, Download, LayoutGrid, List, ChevronDown, ChevronUp, ExternalLink, Target, IndianRupee, PieChart, Layers, TrendingUp, AlertCircle, Lock, X, Wallet } from 'lucide-react';
import { exportMasterReport } from '../utils/exportUtils';

interface Props {
  projects: Project[];
  viewMode: ViewMode;
  currentUser: User;
  onSelectProject: (id: string) => void;
  onUpdateProjectField: (id: string, field: 'receivedBudget' | 'otherSpends', value: number) => void;
  onUpdatePlan: (id: string, key: keyof PlanningData, value: number) => void;
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

// --- REDESIGNED COMPONENT: BUSINESS OVERVIEW SECTION ---
const BusinessOverview = ({ projects }: { projects: Project[] }) => {
  // 1. Calculate Aggregates (Life-To-Date)
  let totalPlanBV = 0;
  
  // Targets
  let totalDigitalTarget = 0;
  let totalPresalesTarget = 0;
  let totalBrandTarget = 0;
  let totalReferralTarget = 0;
  let totalCPTarget = 0;
  
  // Achieved
  let totalAchievedBV = 0;
  let totalDigitalAchieved = 0;
  let totalPresalesAchieved = 0;
  let totalBrandAchieved = 0;
  let totalReferralAchieved = 0;
  let totalCPAchieved = 0;

  projects.forEach(p => {
    // Plan Targets
    totalPlanBV += p.plan.overallBV;
    totalDigitalTarget += p.plan.overallBV * (p.plan.digitalContributionPercent / 100);
    totalPresalesTarget += p.plan.overallBV * (p.plan.presalesContributionPercent / 100);
    totalBrandTarget += p.plan.overallBV * ((p.plan.brandContributionPercent || 0) / 100);
    totalReferralTarget += p.plan.overallBV * ((p.plan.referralContributionPercent || 0) / 100);
    totalCPTarget += p.plan.overallBV * ((p.plan.cpContributionPercent || 0) / 100);

    // Actuals (LTD - Summing all recorded weeks)
    const ats = p.plan.ats;
    Object.values(p.actuals).forEach(act => {
       totalDigitalAchieved += (act.bookings || 0) * ats;
       totalPresalesAchieved += (act.presalesBookings || 0) * ats;
       totalBrandAchieved += (act.brandBookings || 0) * ats;
       totalReferralAchieved += (act.referralBookings || 0) * ats;
       totalCPAchieved += (act.cpBookings || 0) * ats;
    });
  });

  totalAchievedBV = totalDigitalAchieved + totalPresalesAchieved + totalBrandAchieved + totalReferralAchieved + totalCPAchieved;
  
  // 3. Digital Deficit (Against PLAN Target)
  const digitalDeficit = totalDigitalTarget - totalDigitalAchieved;
  const digitalAchievementPct = totalDigitalTarget > 0 ? (totalDigitalAchieved / totalDigitalTarget) * 100 : 0;
  
  const digitalContribActual = totalAchievedBV > 0 ? (totalDigitalAchieved / totalAchievedBV) * 100 : 0;

  const renderVerticalRow = (label: string, target: number, achieved: number, colorClass: string, barColor: string) => {
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    const isDeficit = achieved < target;
    
    return (
        <div className="group flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 px-2 rounded transition-colors">
            <div className="w-24">
                <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{label}</span>
            </div>
            <div className="flex-1 px-4">
                <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-400">
                    <span>{pct.toFixed(1)}%</span>
                    <span>Tgt: ₹{target.toFixed(1)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                </div>
            </div>
            <div className="text-right w-20">
                <div className="text-sm font-black text-white">₹{achieved.toFixed(1)}</div>
                <div className={`text-[9px] font-bold ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isDeficit ? '-' : '+'}{Math.abs(achieved - target).toFixed(1)} Cr
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl mb-8 relative overflow-hidden group">
       {/* Ambient Background Effects */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>
       <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>

       <div className="flex flex-col md:flex-row justify-between items-start mb-8 relative z-10 gap-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                <Layers className="w-8 h-8 text-indigo-400" /> 
             </div>
             <div>
                <h3 className="text-xl font-black text-white tracking-tight">Business Vertical & Deficit Overview</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl font-medium">
                  Tracking overall business deficit against targets, with a specific focus on the 10% Digital contribution mandate.
                </p>
             </div>
          </div>
          <div className="flex gap-8 bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-xl">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Plan BV</div>
                <div className="text-3xl font-black text-slate-300">₹{totalPlanBV.toFixed(0)} Cr</div>
              </div>
              <div className="h-full w-px bg-slate-800"></div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Achieved</div>
                <div className="text-3xl font-black text-white">₹{totalAchievedBV.toFixed(1)} Cr</div>
              </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* LEFT PANEL: DIGITAL TARGET & DEFICIT (HIGHLIGHT) */}
          <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none"></div>
             
             <div>
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                     <Target className="w-4 h-4 text-brand-400" /> Digital Mandate
                   </h4>
                   <span className="text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full shadow-sm">10% Contrib.</span>
                </div>
                
                <div className="flex items-end gap-3 mb-3">
                   <span className="text-5xl font-black text-white tracking-tighter">₹{totalDigitalAchieved.toFixed(1)} Cr</span>
                   <span className="text-sm text-slate-500 font-bold mb-2">/ ₹{totalDigitalTarget.toFixed(1)} Cr</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-900 border border-slate-800 h-3 rounded-full mt-4 overflow-hidden relative">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${digitalDeficit > 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                     style={{ width: `${Math.min(digitalAchievementPct, 100)}%` }}
                   ></div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-900 flex items-center justify-between">
                {digitalDeficit > 0 ? (
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-base font-bold text-red-400">Deficit: ₹{digitalDeficit.toFixed(1)} Cr</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-base font-bold text-emerald-400">Surplus: ₹{Math.abs(digitalDeficit).toFixed(1)} Cr</span>
                  </div>
                )}
                <span className="text-xs text-slate-500 font-medium">Curr. Mix {digitalContribActual.toFixed(1)}%</span>
             </div>
          </div>

          {/* RIGHT PANEL: VERTICAL PERFORMANCE MATRIX */}
          <div className="lg:col-span-7 bg-slate-950/50 rounded-2xl border border-slate-800 p-6 flex flex-col shadow-inner">
             <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <PieChart className="w-3.5 h-3.5" /> Vertical Performance (Actuals vs Target)
               </span>
             </div>

             <div className="flex flex-col space-y-1">
                {renderVerticalRow("Digital", totalDigitalTarget, totalDigitalAchieved, "text-indigo-400", "bg-indigo-500")}
                {renderVerticalRow("Presales", totalPresalesTarget, totalPresalesAchieved, "text-blue-400", "bg-blue-500")}
                {renderVerticalRow("Brand", totalBrandTarget, totalBrandAchieved, "text-cyan-400", "bg-cyan-500")}
                {renderVerticalRow("Referral", totalReferralTarget, totalReferralAchieved, "text-emerald-400", "bg-emerald-500")}
                {renderVerticalRow("Chan. Partner", totalCPTarget, totalCPAchieved, "text-purple-400", "bg-purple-500")}
             </div>
          </div>

       </div>
    </div>
  );
};

interface ProjectBoxProps {
  p: Project;
  viewMode: ViewMode;
  startWeekIndex: number;
  endWeekIndex: number;
  currentUser: User;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectBox: React.FC<ProjectBoxProps> = ({ p, viewMode, startWeekIndex, endWeekIndex, currentUser, onSelectProject, onDeleteProject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Calculations ---
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
  const taxDivisor = (1 + p.plan.taxPercent/100);

  // Financials - Display Logic
  const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
  const planBase = p.weeks.reduce((sum, w) => sum + w.spendsBase, 0);
  const displayPlan = viewMode === ViewMode.AGENCY ? planAllIn : planBase;

  // Received Budget (Stored as Gross)
  const displayReceived = viewMode === ViewMode.AGENCY ? p.plan.receivedBudget : (p.plan.receivedBudget / taxDivisor);
  
  // Spends
  const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
  const displayPerfSpends = perfSpendsRaw * taxMult;
  
  const displayOtherSpends = viewMode === ViewMode.AGENCY ? p.otherSpends : (p.otherSpends / taxDivisor);
  const totalSpends = displayPerfSpends + displayOtherSpends;
  
  const pending = displayReceived - totalSpends;
  const pendingPct = displayReceived > 0 ? (pending / displayReceived) * 100 : 0;

  // Period Calculations
  const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
  
  // Funnel
  const tgtLeadsPeriod = weeksInPeriod.reduce((s, w) => s + w.leads, 0);
  const achLeads = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
  const delLeads = tgtLeadsPeriod > 0 ? (achLeads / tgtLeadsPeriod) * 100 : 0;

  const tgtAPPeriod = weeksInPeriod.reduce((s, w) => s + w.ap, 0);
  const achAP = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ap || 0), 0);
  const delAP = tgtAPPeriod > 0 ? (achAP / tgtAPPeriod) * 100 : 0;

  const tgtADPeriod = weeksInPeriod.reduce((s, w) => s + w.ad, 0);
  const achAD = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);
  const delAD = tgtADPeriod > 0 ? (achAD / tgtADPeriod) * 100 : 0;

  // Period Financials for Efficiency
  const perfSpendsPeriod = weeksInPeriod.reduce((s, w) => {
      const raw = (p.actuals[w.id]?.spends || 0);
      return s + (raw * taxMult);
  }, 0);

  const tgtCPL = p.plan.cpl;
  const achCPL = achLeads > 0 ? perfSpendsPeriod / achLeads : 0;
  
  const tgtCPW = p.plan.baseBudget / (p.weeks.reduce((s,w) => s+w.ad,0) || 1); 
  const achCPW = achAD > 0 ? perfSpendsPeriod / achAD : 0;

  // Revenue
  const achDigBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.bookings || 0), 0);
  const achPresalesBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.presalesBookings || 0), 0);
  const achBrandBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.brandBookings || 0), 0);
  const achReferralBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.referralBookings || 0), 0);
  const achCPBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.cpBookings || 0), 0);

  const totalDirectUnits = achDigBookings + achPresalesBookings + achBrandBookings + achReferralBookings;
  const totalUnitsAch = totalDirectUnits + achCPBookings;
  
  const achCPB = achDigBookings > 0 ? perfSpendsPeriod / achDigBookings : 0; 
  
  const totalBVAch = totalUnitsAch * p.plan.ats;

  const getDeliveryColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative group transition-all flex flex-col justify-between ${isExpanded ? 'row-span-2' : ''}`}>
       
       <div className="p-6">
         {/* Top Section: Name & Delete */}
         <div className="flex justify-between items-start mb-2">
            <h3 
              onClick={() => onSelectProject(p.id)}
              className="text-2xl font-bold text-white tracking-tight leading-tight cursor-pointer hover:text-brand-400 transition-colors flex items-center gap-2 group/title"
            >
              {p.name} <ArrowRight className="w-5 h-5 opacity-0 -ml-2 group-hover/title:opacity-100 group-hover/title:ml-0 transition-all" />
            </h3>
            
            {currentUser.role === UserRole.GM && (
              <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm(`Delete ${p.name}?`)) onDeleteProject(p.id); }}
                className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                title="Delete Project (GM Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
         </div>

         {/* Status Badge */}
         <div className="mb-6">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${p.status === 'Active' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'}`}>
              {p.status}
            </span>
         </div>

         {/* Summary Metrics 2x2 Grid */}
         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Planned Budget ({viewMode === ViewMode.AGENCY ? 'Inc. Tax' : 'Net'})</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(displayPlan)}</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">WO Received ({viewMode === ViewMode.AGENCY ? 'Inc. Tax' : 'Net'})</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(displayReceived)}</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pending</div>
               <div className={`text-xl font-medium ${pending < 0 ? 'text-red-400' : 'text-amber-400'}`}>{formatCurrency(pending)}</div>
               <div className="text-[10px] font-bold text-slate-600 mt-1">({pendingPct.toFixed(1)}%)</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Est. Raised ({viewMode === ViewMode.AGENCY ? 'Inc. Tax' : 'Net'})</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(totalSpends)}</div>
            </div>
         </div>

         {/* --- EXPANDED DETAILS SECTION --- */}
         {isExpanded && (
           <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
              
              {/* 1. Funnel Performance */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-brand-400" /> Funnel Performance (Period)
                </h4>
                <div className="bg-slate-950/50 rounded-lg p-4 grid grid-cols-3 gap-4 border border-slate-800/50">
                  {/* Leads */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-amber-500 font-bold uppercase">Leads</div>
                    <div className="text-lg font-bold text-white">{achLeads}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtLeadsPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delLeads)}`}>{formatPercent(delLeads)}</div>
                  </div>
                  {/* AP */}
                  <div className="space-y-1 border-l border-slate-800 pl-4">
                    <div className="text-[10px] text-purple-400 font-bold uppercase">AP (Site Visits)</div>
                    <div className="text-lg font-bold text-white">{achAP}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtAPPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delAP)}`}>{formatPercent(delAP)}</div>
                  </div>
                  {/* AD */}
                  <div className="space-y-1 border-l border-slate-800 pl-4">
                    <div className="text-[10px] text-pink-400 font-bold uppercase">AD (Walkins)</div>
                    <div className="text-lg font-bold text-white">{achAD}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtADPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delAD)}`}>{formatPercent(delAD)}</div>
                  </div>
                </div>
              </div>

              {/* 2. Financial Efficiency */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-400" /> Financial Efficiency ({viewMode === ViewMode.AGENCY ? 'Inc. Tax' : 'Net'})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                   {/* CPL */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">CPL</span>
                         <span className={`text-[10px] font-bold ${achCPL <= tgtCPL ? 'text-emerald-400' : 'text-red-400'}`}>
                           {achCPL > 0 && tgtCPL > 0 ? (achCPL <= tgtCPL ? '✔' : '▲') : ''}
                         </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPL)}</div>
                      <div className="text-[10px] text-slate-500">Tgt: {formatCurrency(tgtCPL)}</div>
                   </div>
                   
                   {/* CPW */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">CPW</span>
                         <span className={`text-[10px] font-bold ${achCPW <= tgtCPW ? 'text-emerald-400' : 'text-red-400'}`}>
                            {achCPW > 0 && tgtCPW > 0 ? (achCPW <= tgtCPW ? '✔' : '▲') : ''}
                         </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPW)}</div>
                      <div className="text-[10px] text-slate-500">Tgt: {formatCurrency(tgtCPW)}</div>
                   </div>

                   {/* CPB */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">CPB (Dig)</div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPB)}</div>
                      <div className="text-[10px] text-slate-500">Cost/Booking</div>
                   </div>
                </div>
              </div>

              {/* 3. Revenue & Bookings */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-emerald-400" /> Revenue & Bookings
                </h4>
                <div className="bg-emerald-950/20 rounded-lg p-4 border border-emerald-900/30 flex justify-between items-center">
                   <div>
                      <div className="text-xs text-emerald-400 font-bold mb-1">Total Revenue</div>
                      <div className="text-xl font-black text-white">₹{formatDecimal(totalBVAch)} Cr</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Direct: {totalDirectUnits} Units | CP: {achCPBookings} Units
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-emerald-400 font-bold mb-1">Total Units</div>
                      <div className="text-2xl font-black text-white">{totalUnitsAch}</div>
                   </div>
                </div>
              </div>

              {/* Deep Dive Action */}
              <button 
                onClick={() => onSelectProject(p.id)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
              >
                Open Project Dashboard <ExternalLink className="w-4 h-4" />
              </button>

           </div>
         )}
       </div>

       {/* Footer Expansion Button */}
       <button 
         onClick={() => setIsExpanded(!isExpanded)}
         className={`w-full py-4 border-t border-slate-800 rounded-b-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all group/btn ${isExpanded ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-950/50 text-blue-400 hover:text-blue-300 hover:bg-slate-900'}`}
       >
         {isExpanded ? (
            <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
         ) : (
            <>View Details <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-y-0.5" /></>
         )}
       </button>
    </div>
  );
};

export const DashboardOverview: React.FC<Props> = ({ 
  projects, viewMode, currentUser, onSelectProject, onUpdateProjectField, onUpdatePlan, startWeekIndex, endWeekIndex, pocs, onUpdateProjectPoc, onDeleteProject, onUpdateProjectActualRevenue 
}) => {
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'table' | 'grid'>('grid');

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatDecimal = (val: number) => val.toFixed(1);

  const getDeliveryColor = (pct: number) => {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const isManager = currentUser.role === UserRole.MANAGER;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mb-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Performance Report</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive tracking of Budget, Funnel Efficiency, and Revenue.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-1.5 rounded transition-all ${viewType === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Summary Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewType('table')}
                className={`p-1.5 rounded transition-all ${viewType === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Detailed List"
              >
                <List className="w-4 h-4" />
              </button>
           </div>
           
           <div className="h-6 w-px bg-slate-800 mx-1"></div>

           <button 
            onClick={() => exportMasterReport(projects, viewMode)}
            className="flex items-center gap-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-900/50 px-3 py-2 rounded-lg text-xs font-bold transition-all"
           >
            <Download className="w-3.5 h-3.5" /> Export
           </button>
        </div>
      </div>

      {/* Insert Business Overview Here */}
      <div className="px-6 pt-6">
        <BusinessOverview projects={projects} />
      </div>
      
      {viewType === 'grid' ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-950/30 min-h-[400px]">
           {projects.map(p => (
             <ProjectBox 
               key={p.id} 
               p={p} 
               viewMode={viewMode}
               startWeekIndex={startWeekIndex}
               endWeekIndex={endWeekIndex}
               currentUser={currentUser}
               onSelectProject={onSelectProject}
               onDeleteProject={onDeleteProject}
             />
           ))}
           {projects.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-12">
               <List className="w-12 h-12 mb-4 opacity-20" />
               <p>No projects found. Add a new project to get started.</p>
             </div>
           )}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar pb-4 bg-obsidian-900">
          <table className="min-w-max text-xs text-left border-collapse">
            <thead>
              {/* --- TOP HEADER ROW (GROUPINGS) --- */}
              <tr className="bg-slate-950 border-b border-slate-800 uppercase tracking-wider font-bold text-slate-400">
                <th className="px-4 py-3 sticky left-0 bg-slate-950 z-20 border-r border-slate-800 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Project Details</th>
                
                {/* RESTORED BUDGET SECTION */}
                <th colSpan={8} className="px-2 py-2 border-r border-slate-800 bg-blue-950/20 text-center text-blue-400">Budget & Financials ({viewMode === ViewMode.AGENCY ? 'Gross' : 'Net'})</th>
                
                <th colSpan={3} className="px-2 py-2 border-r border-slate-800 bg-amber-950/20 text-center text-amber-500">Leads Funnel</th>
                <th colSpan={3} className="px-2 py-2 border-r border-slate-800 bg-purple-950/20 text-center text-purple-400">AP Funnel</th>
                <th colSpan={3} className="px-2 py-2 border-r border-slate-800 bg-pink-950/20 text-center text-pink-400">AD Funnel</th>
                
                <th colSpan={8} className="px-2 py-2 border-r border-slate-800 bg-slate-800/50 text-center text-slate-300">Efficiency ({viewMode === ViewMode.AGENCY ? 'Gross' : 'Net'})</th>
                
                {/* NEW REVENUE SECTION */}
                <th colSpan={3} className="px-2 py-2 bg-emerald-950/30 text-center text-emerald-400 border-r border-slate-800">Business Params</th>
                <th colSpan={3} className="px-2 py-2 bg-indigo-950/30 text-center text-indigo-400 border-r border-slate-800">Digital Performance</th>
                <th colSpan={3} className="px-2 py-2 bg-purple-950/30 text-center text-purple-400 border-r border-slate-800">CP Performance</th>
                <th colSpan={6} className="px-2 py-2 bg-cyan-950/30 text-center text-cyan-400 border-r border-slate-800">Other Verticals (LTD)</th>

                <th className="px-4 py-3 bg-slate-950 text-center">Actions</th>
              </tr>

              {/* --- SECOND HEADER ROW (COLUMNS) --- */}
              <tr className="bg-slate-900 border-b border-slate-700 text-[10px] font-semibold text-slate-400">
                <th className="px-4 py-3 sticky left-0 bg-slate-900 z-20 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Name & SPOC (Edit)</th>
                
                {/* Budget Columns */}
                <th className="px-2 py-2 text-right text-blue-200">Planned</th>
                <th className="px-2 py-2 text-right bg-blue-900/10 text-white font-bold">Received (Edit)</th>
                <th className="px-2 py-2 text-right text-slate-500 border-r border-slate-800">Buffer</th>
                <th className="px-2 py-2 text-right text-blue-300">Perf Spends</th>
                <th className="px-2 py-2 text-right bg-blue-900/10 text-white font-bold">Other (Edit)</th>
                <th className="px-2 py-2 text-right text-white font-bold">Total Spends</th>
                <th className="px-2 py-2 text-right text-emerald-400 border-r border-slate-800">Pending</th>
                <th className="px-2 py-2 text-right text-slate-500 border-r border-slate-800">% Spent</th>

                {/* Leads */}
                <th className="px-2 py-2 text-right text-amber-200">Target (Period)</th>
                <th className="px-2 py-2 text-right font-bold text-white">Achieved</th>
                <th className="px-2 py-2 text-right border-r border-slate-800">% Del</th>

                {/* AP Funnel */}
                <th className="px-2 py-2 text-right text-purple-200 min-w-[60px]">Tgt (P)</th>
                <th className="px-2 py-2 text-right font-bold text-white">Ach</th>
                <th className="px-2 py-2 text-right border-r border-slate-800">% Del</th>

                {/* AD Funnel */}
                <th className="px-2 py-2 text-right text-pink-200 min-w-[60px]">Tgt (P)</th>
                <th className="px-2 py-2 text-right font-bold text-white">Ach</th>
                <th className="px-2 py-2 text-right border-r border-slate-800">% Del</th>

                {/* Efficiency - Rectified Nomenclature */}
                <th className="px-2 py-2 text-right text-slate-500 border-l border-slate-800">Tgt CPL</th>
                <th className="px-2 py-2 text-right text-white font-bold border-r border-slate-800">Ach CPL</th>
                
                <th className="px-2 py-2 text-right text-purple-300/60">Tgt CPAP</th>
                <th className="px-2 py-2 text-right text-purple-300 font-bold border-r border-slate-800">Ach CPAP</th>
                
                <th className="px-2 py-2 text-right text-slate-500">Tgt CPW</th>
                <th className="px-2 py-2 text-right text-white font-bold border-r border-slate-800">Ach CPW</th>
                
                <th className="px-2 py-2 text-right text-slate-500">Tgt CPB</th>
                <th className="px-2 py-2 text-right text-white font-bold border-r border-slate-800">Dig CPB</th>

                {/* Business Params */}
                <th className="px-2 py-2 text-center bg-emerald-950/20 text-emerald-300 min-w-[70px]">ATS (Cr)</th>
                <th className="px-2 py-2 text-center bg-emerald-950/20 text-emerald-300 min-w-[80px]">Total BV</th>
                <th className="px-2 py-2 text-center bg-emerald-950/20 text-emerald-200 border-r border-slate-800">Tgt Units</th>

                {/* Digital Performance */}
                <th className="px-2 py-2 text-right bg-indigo-950/20 text-indigo-300">Tgt (Cr)</th>
                <th className="px-2 py-2 text-center bg-indigo-950/10 text-white font-bold min-w-[70px]">Ach (Cr)</th>
                <th className="px-2 py-2 text-center bg-indigo-950/20 text-indigo-200 border-r border-slate-800">Units</th>

                {/* CP Performance */}
                <th className="px-2 py-2 text-right bg-purple-950/20 text-purple-300">Tgt (Cr)</th>
                <th className="px-2 py-2 text-center bg-purple-950/10 text-white font-bold min-w-[70px]">Ach (Cr)</th>
                <th className="px-2 py-2 text-center bg-purple-950/20 text-purple-200 border-r border-slate-800">Units</th>

                {/* Other Verticals (Compact) */}
                <th className="px-2 py-2 text-center bg-blue-950/10 text-blue-300 min-w-[60px]">Pre (Cr)</th>
                <th className="px-2 py-2 text-center bg-blue-950/20 text-blue-200 border-r border-slate-800">Units</th>
                
                <th className="px-2 py-2 text-center bg-cyan-950/10 text-cyan-300 min-w-[60px]">Brnd (Cr)</th>
                <th className="px-2 py-2 text-center bg-cyan-950/20 text-cyan-200 border-r border-slate-800">Units</th>

                <th className="px-2 py-2 text-center bg-emerald-950/10 text-emerald-300 min-w-[60px]">Ref (Cr)</th>
                <th className="px-2 py-2 text-center bg-emerald-950/20 text-emerald-200 border-r border-slate-800">Units</th>

                <th className="px-4 py-3 text-center">Delete</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800">
              {projects.map((p) => {
                const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
                const taxDivisor = (1 + p.plan.taxPercent/100);
                
                // Budget Calculations
                const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
                const planBase = p.weeks.reduce((sum, w) => sum + w.spendsBase, 0);
                const displayPlan = viewMode === ViewMode.AGENCY ? planAllIn : planBase;
                
                // Received Budget (Stored as Gross)
                const displayReceived = viewMode === ViewMode.AGENCY ? p.plan.receivedBudget : (p.plan.receivedBudget / taxDivisor);
                
                const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
                const displayPerfSpends = perfSpendsRaw * taxMult;
                
                // Other Spends (Stored as Gross for consistency)
                const displayOther = viewMode === ViewMode.AGENCY ? p.otherSpends : (p.otherSpends / taxDivisor);
                
                const totalSpendsDisplay = displayPerfSpends + displayOther;
                
                const pending = displayReceived - totalSpendsDisplay;
                const buffer = displayReceived - displayPlan;
                const percentSpent = displayReceived > 0 ? (totalSpendsDisplay / displayReceived) * 100 : 0;

                const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
                
                // Funnel Calculations
                const tgtLeadsPeriod = weeksInPeriod.reduce((s, w) => s + w.leads, 0);
                const achLeads = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
                const delLeads = tgtLeadsPeriod > 0 ? (achLeads / tgtLeadsPeriod) * 100 : 0;

                const tgtAPPeriod = weeksInPeriod.reduce((s, w) => s + w.ap, 0);
                const achAP = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ap || 0), 0);
                const delAP = tgtAPPeriod > 0 ? (achAP / tgtAPPeriod) * 100 : 0;

                const tgtADPeriod = weeksInPeriod.reduce((s, w) => s + w.ad, 0);
                const achAD = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);
                const delAD = tgtADPeriod > 0 ? (achAD / tgtADPeriod) * 100 : 0;

                // Spend Calculations for Efficiency
                const planSpendsPeriod = weeksInPeriod.reduce((s, w) => s + (viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase), 0);
                const perfSpendsPeriod = weeksInPeriod.reduce((s, w) => {
                    const raw = (p.actuals[w.id]?.spends || 0);
                    return s + (raw * taxMult);
                }, 0);

                // Efficiency Targets (Derived from Period Plan)
                const tgtCPL = tgtLeadsPeriod > 0 ? planSpendsPeriod / tgtLeadsPeriod : p.plan.cpl;
                const tgtCPAP = tgtAPPeriod > 0 ? planSpendsPeriod / tgtAPPeriod : 0;
                const tgtCPW = tgtADPeriod > 0 ? planSpendsPeriod / tgtADPeriod : 0;
                
                const tgtDigBookings = tgtADPeriod * (p.plan.wtbPercent / 100);
                const tgtCPB = tgtDigBookings > 0 ? planSpendsPeriod / tgtDigBookings : 0;

                // Efficiency Actuals
                const achCPL = achLeads > 0 ? perfSpendsPeriod / achLeads : 0;
                const achCPAP = achAP > 0 ? perfSpendsPeriod / achAP : 0;
                const achCPW = achAD > 0 ? perfSpendsPeriod / achAD : 0;

                // Units Breakdown (LTD) for Revenue
                const achDigBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.bookings || 0), 0);
                const achPresalesBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.presalesBookings || 0), 0);
                const achBrandBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.brandBookings || 0), 0);
                const achReferralBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.referralBookings || 0), 0);
                const achCPBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.cpBookings || 0), 0);

                // Revenue Calc (LTD)
                const ats = p.plan.ats;
                const revDig = achDigBookings * ats;
                const revPre = achPresalesBookings * ats;
                const revBrnd = achBrandBookings * ats;
                const revRef = achReferralBookings * ats;
                const revCP = achCPBookings * ats;

                const achCPB = achDigBookings > 0 ? perfSpendsPeriod / achDigBookings : 0;

                // Business Targets
                const totalUnitsTarget = p.plan.ats > 0 ? p.plan.overallBV / p.plan.ats : 0;
                const digRevTarget = p.plan.overallBV * (p.plan.digitalContributionPercent / 100);
                const cpRevTarget = p.plan.overallBV * (p.plan.cpContributionPercent / 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group h-16">
                    {/* Project & SPOC */}
                    <td className="px-4 py-3 sticky left-0 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between cursor-pointer group/name" onClick={() => onSelectProject(p.id)}>
                          <div className="font-bold text-white text-sm group-hover/name:text-brand-400 transition-colors">{p.name}</div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover/name:text-white" />
                        </div>
                        <select 
                          value={p.poc}
                          onChange={(e) => onUpdateProjectPoc(p.id, e.target.value)}
                          className="text-[10px] bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer py-0.5 px-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                          disabled={isManager} // Managers cannot reassign SPOC
                        >
                          {pocs.map(poc => (
                            <option key={poc.id} value={poc.name}>{poc.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* BUDGET COLUMNS */}
                    <td className="px-2 py-3 text-right text-blue-200/70 text-[10px]">{formatCurrency(displayPlan)}</td>
                    <td className="px-1 py-1 bg-blue-900/10">
                      <input 
                        type="number" 
                        value={Math.round(displayReceived)}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            // Convert back to Gross for storage if in Brand View
                            const storeVal = viewMode === ViewMode.AGENCY ? val : val * taxDivisor;
                            onUpdateProjectField(p.id, 'receivedBudget', storeVal);
                        }}
                        disabled={isManager} 
                        className={`w-24 text-right bg-transparent border-b border-blue-500/30 text-white font-bold text-xs focus:outline-none focus:border-blue-500 ${isManager ? 'text-slate-500 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 text-[10px] font-medium ${buffer < 0 ? 'text-red-400' : 'text-slate-500'}`}>{formatCurrency(buffer)}</td>
                    <td className="px-2 py-3 text-right text-blue-300 font-medium text-[10px]">{formatCurrency(displayPerfSpends)}</td>
                    <td className="px-1 py-1 bg-blue-900/10">
                      <input 
                        type="number" 
                        value={Math.round(displayOther)}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const storeVal = viewMode === ViewMode.AGENCY ? val : val * taxDivisor;
                            onUpdateProjectField(p.id, 'otherSpends', storeVal);
                        }}
                        className="w-20 text-right bg-transparent border-b border-blue-500/30 text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-2 py-3 text-right font-bold text-white text-[10px]">{formatCurrency(totalSpendsDisplay)}</td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 font-bold text-[10px] ${pending < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(pending)}</td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 font-bold text-[10px] ${percentSpent > 90 ? 'text-red-400' : 'text-slate-400'}`}>{percentSpent.toFixed(1)}%</td>

                    {/* Leads */}
                    <td className="px-2 py-3 text-right text-amber-200/50 text-[10px]">{Math.round(tgtLeadsPeriod).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-black text-lg text-white">{Math.round(achLeads).toLocaleString()}</td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delLeads)}`}>{formatPercent(delLeads)}</td>

                    {/* AP Funnel */}
                    <td className="px-2 py-3 text-right text-purple-300/50 text-[10px]">{Math.round(tgtAPPeriod).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-black text-lg text-white">{Math.round(achAP).toLocaleString()}</td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAP)}`}>{formatPercent(delAP)}</td>

                    {/* AD Funnel */}
                    <td className="px-2 py-3 text-right text-pink-300/50 text-[10px]">{Math.round(tgtADPeriod).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-black text-lg text-white">{Math.round(achAD).toLocaleString()}</td>
                    <td className={`px-2 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAD)}`}>{formatPercent(delAD)}</td>

                    {/* Efficiency: CPL */}
                    <td className="px-2 py-3 text-right text-slate-500 text-[10px] border-l border-slate-800">{Math.round(tgtCPL).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-bold text-slate-200 border-r border-slate-800">{Math.round(achCPL).toLocaleString()}</td>

                    {/* Efficiency: CPAP */}
                    <td className="px-2 py-3 text-right text-purple-300/50 text-[10px]">{Math.round(tgtCPAP).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-bold text-purple-300 border-r border-slate-800">{Math.round(achCPAP).toLocaleString()}</td>

                    {/* Efficiency: CPW */}
                    <td className="px-2 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtCPW).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right font-bold text-slate-200 border-r border-slate-800">{Math.round(achCPW).toLocaleString()}</td>

                    {/* Efficiency: CPB */}
                    <td className="px-2 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtCPB).toLocaleString()}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-800 text-slate-200 font-bold">{Math.round(achCPB).toLocaleString()}</td>

                    {/* BUSINESS PARAMS EDITABLE */}
                    <td className="px-1 py-1 bg-emerald-900/10">
                      <input 
                        type="number" 
                        value={p.plan.ats}
                        onChange={(e) => onUpdatePlan(p.id, 'ats', parseFloat(e.target.value))}
                        disabled={isManager}
                        className={`w-full text-center bg-transparent border-b border-emerald-500/30 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500`}
                      />
                    </td>
                    <td className="px-1 py-1 bg-emerald-900/10">
                      <input 
                        type="number" 
                        value={p.plan.overallBV}
                        onChange={(e) => onUpdatePlan(p.id, 'overallBV', parseFloat(e.target.value))}
                        disabled={isManager}
                        className={`w-full text-center bg-transparent border-b border-emerald-500/30 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500`}
                      />
                    </td>
                    <td className="px-2 py-3 text-center text-emerald-200 border-r border-slate-800 text-[10px] font-bold">{Math.round(totalUnitsTarget)}</td>

                    {/* DIGITAL PERFORMANCE */}
                    <td className="px-2 py-3 text-right text-indigo-300/60 text-[10px]">{formatDecimal(digRevTarget)}</td>
                    <td className="px-1 py-1 bg-indigo-900/10">
                        <input type="number" value={formatDecimal(revDig)} onChange={(e) => onUpdateProjectActualRevenue(p.id, 'digital', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-indigo-500/30 text-white font-bold text-xs focus:outline-none focus:border-indigo-500" />
                    </td>
                    <td className="px-2 py-3 text-center text-indigo-200 border-r border-slate-800 text-[10px] font-bold">{formatDecimal(achDigBookings)}</td>

                    {/* CP PERFORMANCE */}
                    <td className="px-2 py-3 text-right bg-purple-950/20 text-purple-300">Tgt (Cr)</td>
                    <td className="px-1 py-1 bg-purple-900/10">
                        <input type="number" value={formatDecimal(revCP)} onChange={(e) => onUpdateProjectActualRevenue(p.id, 'cp', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-purple-500/30 text-white font-bold text-xs focus:outline-none focus:border-purple-500" />
                    </td>
                    <td className="px-2 py-3 text-center text-purple-200 border-r border-slate-800 text-[10px] font-bold">{formatDecimal(achCPBookings)}</td>

                    {/* PRESALES */}
                    <td className="px-1 py-1 bg-blue-900/10">
                        <input type="number" value={formatDecimal(revPre)} onChange={(e) => onUpdateProjectActualRevenue(p.id, 'presales', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-blue-500/30 text-white font-bold text-xs focus:outline-none focus:border-blue-500" />
                    </td>
                    <td className="px-2 py-3 text-center text-blue-200 border-r border-slate-800 text-[10px] font-bold">{formatDecimal(achPresalesBookings)}</td>

                    {/* BRAND */}
                    <td className="px-1 py-1 bg-cyan-900/10">
                        <input type="number" value={formatDecimal(revBrnd)} onChange={(e) => onUpdateProjectActualRevenue(p.id, 'brand', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-cyan-500/30 text-white font-bold text-xs focus:outline-none focus:border-cyan-500" />
                    </td>
                    <td className="px-2 py-3 text-center text-cyan-200 border-r border-slate-800 text-[10px] font-bold">{formatDecimal(achBrandBookings)}</td>

                    {/* REFERRAL */}
                    <td className="px-1 py-1 bg-emerald-900/10">
                        <input type="number" value={formatDecimal(revRef)} onChange={(e) => onUpdateProjectActualRevenue(p.id, 'referral', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-emerald-500/30 text-white font-bold text-xs focus:outline-none focus:border-emerald-500" />
                    </td>
                    <td className="px-2 py-3 text-center text-emerald-200 border-r border-slate-800 text-[10px] font-bold">{formatDecimal(achReferralBookings)}</td>

                    {/* Delete Action (Restricted) */}
                    <td className="px-4 py-3 text-center sticky right-0 bg-slate-900 z-10">
                      {currentUser.role === UserRole.GM ? (
                          deleteConfirmId === p.id ? (
                              <div className="flex items-center gap-1 justify-center animate-in fade-in zoom-in duration-200">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); setDeleteConfirmId(null); }}
                                  className="p-1 bg-red-600 text-white rounded hover:bg-red-500 text-[10px] px-2 font-bold shadow-lg shadow-red-900/50"
                                >
                                  YES
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id); }}
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                      ) : (
                          <div className="text-slate-700"><Lock className="w-3 h-3 mx-auto" /></div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
         <AlertTriangle className="w-3 h-3 text-amber-500" />
         <span>Values in <span className="text-amber-300 font-bold">Gold</span> and <span className="text-blue-300 font-bold">Blue</span> fields are editable directly in the report table (Permissions Applying).</span>
      </div>
    </div>
  );
};
