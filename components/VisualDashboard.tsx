
import React, { useState, useMemo } from 'react';
import { Project, ViewMode, TimeGranularity } from '../types';
import { TrendingUp, Users, Footprints, IndianRupee, ArrowUpRight, ArrowDownRight, Target, Activity, Info, Filter, PieChart, BarChart3, AlertCircle, Download, Layers } from 'lucide-react';
import { exportAnalytics } from '../utils/exportUtils';

interface Props {
  projects: Project[];
  viewMode: ViewMode;
  granularity: TimeGranularity;
}

const Card = ({ title, value, subValue, icon: Icon, trend, colorClass, gradient, tooltip }: any) => (
  <div className={`rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden group bg-gradient-to-br ${gradient}`}>
    <div className={`absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rotate-12 ${colorClass}`}>
      <Icon className="w-24 h-24" />
    </div>
    <div className="flex items-center gap-3 mb-3 relative z-10">
      <div className={`p-2.5 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-white/10 ${colorClass} text-white shadow-inner`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-2">
        <h3 className="text-slate-200 text-xs font-bold uppercase tracking-widest">{title}</h3>
        {tooltip && (
          <div className="group/tooltip relative">
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white cursor-help transition-colors" />
            <div className="absolute left-0 top-full mt-2 w-48 p-3 bg-slate-800 border border-slate-600 rounded-lg text-[10px] text-slate-200 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none leading-relaxed">
              {tooltip}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="text-3xl font-black text-white mb-1 relative z-10 tracking-tight">{value}</div>
    <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5 relative z-10">
      <span className={`flex items-center ${trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-rose-300' : 'text-slate-400'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
      </span>
      {subValue}
    </div>
  </div>
);

export const VisualDashboard: React.FC<Props> = ({ projects, viewMode, granularity }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  
  const eligibleProjects = projects.filter(p => p.status !== 'Completed');
  const filteredProjects = useMemo(() => {
    return selectedProjectId === 'all' ? eligibleProjects : eligibleProjects.filter(p => p.id === selectedProjectId);
  }, [selectedProjectId, eligibleProjects]);

  let totalPlannedBudget = 0;
  let totalActualSpend = 0;
  let totalTargetLeads = 0;
  let totalActualLeads = 0;
  let totalTargetWalkins = 0;
  let totalActualWalkins = 0;
  let totalActualBookings = 0;

  let revDigital = 0;
  let revPresales = 0;
  let revBrand = 0;
  let revReferral = 0;
  let revCP = 0;

  const trendBuckets: Record<string, any> = {};
  const mediaMixMap = new Map<string, { name: string, allocation: number }>();

  filteredProjects.forEach(p => {
    const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
    const ats = p.plan.ats;

    p.weeks.forEach(w => {
      const wPlanSpend = (viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase);
      totalPlannedBudget += wPlanSpend;
      totalTargetLeads += w.leads;
      totalTargetWalkins += w.ad;

      const act = p.actuals[w.id] || { leads: 0, ad: 0, spends: 0, bookings: 0, presalesBookings: 0, brandBookings: 0, referralBookings: 0, cpBookings: 0 };
      const wActSpend = (act.spends || 0) * taxMult;
      
      totalActualSpend += wActSpend;
      totalActualLeads += (act.leads || 0);
      totalActualWalkins += (act.ad || 0);
      totalActualBookings += (act.bookings || 0);

      revDigital += (act.bookings || 0) * ats;
      revPresales += (act.presalesBookings || 0) * ats;
      revBrand += (act.brandBookings || 0) * ats;
      revReferral += (act.referralBookings || 0) * ats;
      revCP += (act.cpBookings || 0) * ats;

      let key = "";
      if (granularity === TimeGranularity.WEEKLY) key = w.weekLabel;
      else if (granularity === TimeGranularity.MONTHLY) key = w.monthLabel;
      else if (granularity === TimeGranularity.QUARTERLY) key = w.quarterLabel;
      else key = w.halfYearLabel;

      if (!trendBuckets[key]) {
          trendBuckets[key] = { label: key, plannedSpend: 0, actualSpend: 0, actualLeads: 0 };
      }
      trendBuckets[key].plannedSpend += wPlanSpend;
      trendBuckets[key].actualSpend += wActSpend;
      trendBuckets[key].actualLeads += (act.leads || 0);
    });

    p.mediaPlan.forEach(ch => {
       if (!mediaMixMap.has(ch.id)) mediaMixMap.set(ch.id, { name: ch.name, allocation: 0 });
       mediaMixMap.get(ch.id)!.allocation += ch.allocationPercent;
    });
  });

  const trends = Object.values(trendBuckets).map(t => ({
      ...t,
      cpl: t.actualLeads > 0 ? t.actualSpend / t.actualLeads : 0
  }));

  const mediaMix = Array.from(mediaMixMap.values());
  const totalMixAlloc = mediaMix.reduce((sum, m) => sum + m.allocation, 0);

  const revDirect = revDigital + revPresales + revBrand + revReferral;
  const revTotal = revDirect + revCP;
  const currentDigitalContribPercent = revTotal > 0 ? (revDigital / revTotal) * 100 : 0;

  const width = 800;
  const height = 250;
  const padding = 40;
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatCompact = (val: number) => Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(val);
  const formatRev = (val: number) => `₹${val.toFixed(1)} Cr`;

  let accumulatedAngle = 0;
  const pieColors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const pieData = mediaMix.map(m => {
      const percentage = totalMixAlloc > 0 ? m.allocation / totalMixAlloc : 0;
      const angle = percentage * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return { ...m, percentage, startAngle, endAngle: accumulatedAngle }; 
  });

  const maxBarVal = Math.max(...trends.map(t => Math.max(t.plannedSpend, t.actualSpend)), 1000);
  const barScaleY = (val: number) => height - padding - ((val / maxBarVal) * (height - (padding * 2)));
  const barWidth = (width - (padding * 2)) / Math.max(trends.length, 1) / 3;

  const maxCPLVal = Math.max(...trends.map(t => t.cpl), 5000);
  const cplScaleY = (val: number) => height - padding - ((val / maxCPLVal) * (height - (padding * 2)));
  const lineScaleX = (idx: number) => padding + (idx * ((width - (padding * 2)) / (trends.length - 1 || 1)));
  const createLinePath = (data: any[]) => data.length === 0 ? '' : data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${lineScaleX(i)} ${cplScaleY(d.cpl)}`).join(' ');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
         <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-brand-500" />Portfolio Analytics ({granularity})</h2><p className="text-slate-400 text-xs mt-1">{selectedProjectId === 'all' ? `Aggregated view of projects.` : `Detailed breakdown for project.`}</p></div>
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto"><div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 shadow-sm w-full md:w-auto"><Filter className="w-4 h-4 text-slate-400 mr-3" /><div className="flex flex-col w-full"><span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Slicer</span><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer min-w-[150px] w-full"><option value="all">All Active Projects</option><optgroup label="Projects">{eligibleProjects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</optgroup></select></div></div><button onClick={() => exportAnalytics(projects, viewMode, selectedProjectId)} className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"><Download className="w-5 h-5" /></button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Spend" value={formatCurrency(totalActualSpend)} subValue={`${totalPlannedBudget > 0 ? ((totalActualSpend/totalPlannedBudget)*100).toFixed(1) : 0}% of Plan`} icon={IndianRupee} colorClass="text-blue-400" gradient="from-slate-800 to-slate-900" trend={totalActualSpend > totalPlannedBudget ? 'up' : 'down'} />
        <Card title="Leads" value={totalActualLeads.toLocaleString()} subValue={`vs ${formatCompact(totalTargetLeads)} Tgt`} icon={Users} colorClass="text-cyan-400" gradient="from-slate-800 to-cyan-950/30" />
        <Card title="Walkins" value={totalActualWalkins.toLocaleString()} subValue={`Conv: ${totalActualLeads > 0 ? ((totalActualWalkins/totalActualLeads)*100).toFixed(1) : 0}%`} icon={Footprints} colorClass="text-violet-400" gradient="from-slate-800 to-violet-950/30" />
        <Card title="Bookings" value={totalActualBookings} subValue={`LTD Actual`} icon={Target} colorClass="text-emerald-400" gradient="from-slate-800 to-emerald-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-6"><div><h3 className="text-white font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" />Spend Distribution ({granularity})</h3></div><div className="flex gap-4 text-xs font-medium"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-600"></div><span className="text-slate-300">Plan</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500"></div><span className="text-blue-100">Actual</span></div></div></div>
           <div className="w-full h-64">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 {[0, 0.5, 1].map(pct => {
                   const y = height - padding - (pct * (height - padding * 2));
                   return (<g key={pct}><line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" /><text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-sans">{formatCompact(maxBarVal * pct)}</text></g>);
                 })}
                 {trends.map((t, i) => {
                    const x = padding + (i * ((width - padding * 2) / Math.max(trends.length, 1))) + (barWidth / 2);
                    const hPlan = (height - padding) - barScaleY(t.plannedSpend);
                    const hAct = (height - padding) - barScaleY(t.actualSpend);
                    return (<g key={i}><rect x={x} y={barScaleY(t.plannedSpend)} width={barWidth} height={hPlan} fill="#475569" rx="2" /><rect x={x + barWidth + 2} y={barScaleY(t.actualSpend)} width={barWidth} height={hAct} fill="#3b82f6" rx="2" /><text x={x + barWidth} y={height - 15} textAnchor="middle" className="fill-slate-500 text-[9px] font-sans truncate" style={{maxWidth: barWidth*2}}>{t.label.split(' ')[0]}</text></g>)
                 })}
              </svg>
           </div>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col items-center justify-center">
          <h3 className="text-white font-bold text-sm uppercase mb-8 w-full">Media Allocation</h3>
           <div className="flex-1 flex flex-col items-center justify-center min-h-[180px] relative">
              <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
                 {pieData.map((d, i) => {
                    const x1 = 50 + 40 * Math.cos(Math.PI * d.startAngle / 180);
                    const y1 = 50 + 40 * Math.sin(Math.PI * d.startAngle / 180);
                    const x2 = 50 + 40 * Math.cos(Math.PI * d.endAngle / 180);
                    const y2 = 50 + 40 * Math.sin(Math.PI * d.endAngle / 180);
                    const largeArcFlag = d.endAngle - d.startAngle > 180 ? 1 : 0;
                    return <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={pieColors[i % pieColors.length]} stroke="#0f172a" strokeWidth="1" />;
                 })}
                 <circle cx="50" cy="50" r="25" fill="#0f172a" />
              </svg>
           </div>
           <div className="mt-4 space-y-1 w-full max-h-32 overflow-y-auto custom-scrollbar">
              {pieData.map((d, i) => (<div key={i} className="flex items-center justify-between text-[10px]"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }}></div><span className="text-slate-300 truncate max-w-[100px]">{d.name}</span></div><span className="font-bold text-white">{Math.round(d.percentage * 100)}%</span></div>))}
           </div>
        </div>
      </div>
    </div>
  );
};
