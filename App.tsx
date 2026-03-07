
import React, { useState, useMemo } from 'react';
import { Project, PlanningData, CalculatedMetrics, WeeklyData, WeeklyActuals, ViewMode, MediaChannel, Poc, ChannelPerformance, User, UserRole, LogEntry, TimeGranularity } from './types';
import { ProjectDetail } from './components/ProjectDetail';
import { DashboardOverview } from './components/DashboardOverview';
import { VisualDashboard } from './components/VisualDashboard';
import { LoginScreen } from './components/LoginScreen';
import { LayoutDashboard, Briefcase, Plus, PieChart, Table, UserPlus, X, Calendar, Check, LogOut, DollarSign, CalendarRange, Clock } from 'lucide-react';

const INITIAL_PLAN: PlanningData = {
  overallBV: 350,
  ats: 7,
  digitalContributionPercent: 12.5,
  presalesContributionPercent: 2.5,
  brandContributionPercent: 5.0,
  referralContributionPercent: 5.0,
  cpContributionPercent: 75.0,
  ltwPercent: 3.0,
  wtbPercent: 6.0,
  cpl: 4819,
  taxPercent: 18,
  receivedBudget: 0,
  calculationMode: 'revenue',
  budgetInput: 0,
};

const INITIAL_MEDIA_PLAN: MediaChannel[] = [
  { id: 'fb', name: 'Meta (FB/Insta)', allocationPercent: 40, estimatedCpl: 4200, capiPercent: 35, capiToApPercent: 30, apToAdPercent: 50 },
  { id: 'google', name: 'Google Search', allocationPercent: 30, estimatedCpl: 3800, capiPercent: 40, capiToApPercent: 35, apToAdPercent: 55 },
  { id: 'display', name: 'Google Display', allocationPercent: 10, estimatedCpl: 2500, capiPercent: 20, capiToApPercent: 15, apToAdPercent: 30 },
  { id: 'portals', name: 'Property Portals', allocationPercent: 15, estimatedCpl: 3200, capiPercent: 45, capiToApPercent: 40, apToAdPercent: 60 },
  { id: 'native', name: 'Native / Others', allocationPercent: 5, estimatedCpl: 5500, capiPercent: 25, capiToApPercent: 20, apToAdPercent: 40 },
];

const FY_START_DATE = new Date('2025-04-01');

const generateWeeks = (): WeeklyData[] => {
  const weeks: WeeklyData[] = [];
  const defaultDist = 100 / 52; 

  for (let i = 0; i < 52; i++) {
    const start = new Date(FY_START_DATE);
    start.setDate(FY_START_DATE.getDate() + (i * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const month = start.getMonth(); 
    const monthLabel = start.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    let quarterLabel = "";
    if (month >= 3 && month <= 5) quarterLabel = "Q1 (Apr-Jun)";
    else if (month >= 6 && month <= 8) quarterLabel = "Q2 (Jul-Sep)";
    else if (month >= 9 && month <= 11) quarterLabel = "Q3 (Oct-Dec)";
    else quarterLabel = "Q4 (Jan-Mar)";

    const halfYearLabel = (month >= 3 && month <= 8) ? "H1 (Apr-Sep)" : "H2 (Oct-Mar)";

    weeks.push({
      id: i,
      weekLabel: `W${i + 1}`,
      dateRange: `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`,
      startDate: start.toISOString(),
      monthLabel,
      quarterLabel,
      halfYearLabel,
      spendDistribution: defaultDist,
      leadDistribution: defaultDist,
      adConversion: 2.5,
      leads: 0,
      cumulativeLeads: 0,
      ap: 0,
      cumulativeAp: 0,
      ad: 0,
      cumulativeAd: 0,
      spendsBase: 0,
      spendsAllIn: 0,
    });
  }
  return weeks;
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Godrej Horizon',
    location: 'Wadala, Mumbai',
    poc: 'Amey',
    status: 'Active',
    plan: { ...INITIAL_PLAN, overallBV: 350, receivedBudget: 2936003 },
    otherSpends: 50000,
    mediaPlan: [...INITIAL_MEDIA_PLAN],
    channelPerformance: [],
    weeks: generateWeeks(),
    actuals: {
      0: { weekId: 0, leads: 38, ap: 3, ad: 2, spends: 137143, bookings: 0, presalesBookings: 0, brandBookings: 0, referralBookings: 0, cpBookings: 0 },
      1: { weekId: 1, leads: 76, ap: 8, ad: 4, spends: 274286, bookings: 1, presalesBookings: 0, brandBookings: 0, referralBookings: 0, cpBookings: 0 },
    },
    logs: [],
    isLocked: true,
  }
];

const INITIAL_POCS: Poc[] = [
  { id: '1', name: 'Amey' },
  { id: '2', name: 'Rohan' },
  { id: '3', name: 'Pratham' },
];

const calculateMetrics = (plan: PlanningData): CalculatedMetrics => {
  let digitalBV = 0;
  let overallBV = 0;
  let baseBudget = 0;

  if (plan.calculationMode === 'budget') {
     baseBudget = plan.budgetInput;
     const targetLeads = plan.cpl > 0 ? baseBudget / plan.cpl : 0;
     const targetWalkins = targetLeads * (plan.ltwPercent / 100);
     const digitalUnits = targetWalkins * (plan.wtbPercent / 100);
     digitalBV = digitalUnits * plan.ats;
     overallBV = plan.digitalContributionPercent > 0 ? digitalBV / (plan.digitalContributionPercent / 100) : 0;
  } else {
     overallBV = plan.overallBV;
     digitalBV = overallBV * (plan.digitalContributionPercent / 100);
     const digitalUnits = plan.ats > 0 ? digitalBV / plan.ats : 0;
     const targetWalkins = plan.wtbPercent > 0 ? digitalUnits / (plan.wtbPercent / 100) : 0;
     const targetLeads = plan.ltwPercent > 0 ? targetWalkins / (plan.ltwPercent / 100) : 0;
     baseBudget = targetLeads * plan.cpl;
  }

  const presalesBV = overallBV * (plan.presalesContributionPercent / 100);
  const totalUnits = plan.ats > 0 ? overallBV / plan.ats : 0;
  const digitalUnits = plan.ats > 0 ? digitalBV / plan.ats : 0;
  const presalesUnits = plan.ats > 0 ? presalesBV / plan.ats : 0;
  
  const targetWalkins = plan.wtbPercent > 0 ? digitalUnits / (plan.wtbPercent / 100) : 0;
  const targetLeads = plan.ltwPercent > 0 ? targetWalkins / (plan.ltwPercent / 100) : 0;

  const taxAmount = baseBudget * (plan.taxPercent / 100);
  const allInBudget = baseBudget + taxAmount;

  const cpw = targetWalkins > 0 ? baseBudget / targetWalkins : 0;
  const cpb = digitalUnits > 0 ? baseBudget / digitalUnits : 0;
  const revenue = overallBV * 10000000;
  const targetCOM = (digitalBV > 0) ? (allInBudget / (digitalBV * 10000000)) * 100 : 0;

  return { 
    totalUnits, digitalUnits, presalesUnits, digitalBV, presalesBV, 
    targetWalkins, targetLeads, baseBudget, taxAmount, allInBudget, 
    cpw, cpb, revenue, targetCOM 
  };
};

const recalculateWeeks = (weeks: WeeklyData[], metrics: CalculatedMetrics): WeeklyData[] => {
  let cumLeads = 0;
  let cumAp = 0;
  let cumAd = 0;

  return weeks.map(week => {
    const leads = metrics.targetLeads * (week.leadDistribution / 100);
    cumLeads += leads;
    const ad = leads * (week.adConversion / 100); 
    const ap = ad * 2; 

    cumAp += ap;
    cumAd += ad;

    const spendsBase = metrics.baseBudget * (week.spendDistribution / 100);
    const spendsAllIn = metrics.allInBudget * (week.spendDistribution / 100);

    return {
      ...week,
      leads, cumulativeLeads: cumLeads,
      ap, cumulativeAp: cumAp,
      ad, cumulativeAd: cumAd,
      spendsBase, spendsAllIn
    };
  });
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BRAND);
  const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.WEEKLY);
  const [isVisualMode, setIsVisualMode] = useState(false);
  
  const [reportStartDate, setReportStartDate] = useState<string>('2025-04-01');
  const [reportEndDate, setReportEndDate] = useState<string>('2026-03-31');
  
  const [pocs, setPocs] = useState<Poc[]>(INITIAL_POCS);
  const [selectedPocFilter, setSelectedPocFilter] = useState<string>('All');
  const [newPocName, setNewPocName] = useState('');
  const [isAddingPoc, setIsAddingPoc] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPoc, setNewProjectPoc] = useState(INITIAL_POCS[0]?.name || '');

  // Helper to get ongoing period indices
  const currentStatus = useMemo(() => {
    const now = new Date();
    const start = new Date(FY_START_DATE);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekIdx = Math.floor(diffDays / 7);
    
    // Find matching metadata from generated weeks
    const tempWeeks = generateWeeks();
    const currentWeek = tempWeeks[Math.min(Math.max(0, weekIdx), 51)];
    
    return {
        weekId: weekIdx,
        month: currentWeek.monthLabel,
        quarter: currentWeek.quarterLabel,
        half: currentWeek.halfYearLabel
    };
  }, []);

  const createLog = (user: string, section: string, message: string): LogEntry => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    user,
    section,
    message
  });

  const addLogToProject = (project: Project, section: string, message: string) => {
    if (!currentUser) return project;
    return {
      ...project,
      logs: [createLog(currentUser.name, section, message), ...(project.logs || [])]
    };
  };

  const calculatedProjects = useMemo(() => {
    return projects.map(p => {
      const metrics = calculateMetrics(p.plan);
      const weeks = recalculateWeeks(p.weeks, metrics);
      return { ...p, weeks };
    });
  }, [projects]);

  const hierarchyFilteredProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.GM || currentUser.role === UserRole.SM) {
      return calculatedProjects;
    } else {
      const simpleName = currentUser.name.split(' ')[0];
      return calculatedProjects.filter(p => p.poc.includes(simpleName) || p.poc === currentUser.name);
    }
  }, [calculatedProjects, currentUser]);

  const filteredProjects = selectedPocFilter === 'All' 
    ? hierarchyFilteredProjects 
    : hierarchyFilteredProjects.filter(p => p.poc === selectedPocFilter);

  const activeProject = hierarchyFilteredProjects.find(p => p.id === selectedProjectId);

  const getProjectMetrics = (id: string) => {
    const p = calculatedProjects.find(proj => proj.id === id);
    return p ? calculateMetrics(p.plan) : calculateMetrics(INITIAL_PLAN);
  };

  const getWeekIndexFromDate = (dateStr: string): number => {
    const target = new Date(dateStr);
    const start = new Date(FY_START_DATE);
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    let weekIdx = Math.floor(diffDays / 7);
    if (target.getTime() < start.getTime()) weekIdx = -1;
    if (weekIdx > 51) weekIdx = 51;
    return weekIdx;
  };

  const startWeekIndex = getWeekIndexFromDate(reportStartDate);
  const endWeekIndex = getWeekIndexFromDate(reportEndDate);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const updateProjectPlan = (id: string, key: keyof PlanningData, value: number | string) => {
    if (currentUser.role === UserRole.MANAGER) return;
    setProjects(prev => prev.map(p => {
        if (p.id !== id) return p;
        const updatedPlan = { ...p.plan, [key]: value } as PlanningData;
        if (key === 'calculationMode') {
            const currentMetrics = calculateMetrics(p.plan);
            if (value === 'budget') updatedPlan.budgetInput = currentMetrics.baseBudget;
            else updatedPlan.overallBV = currentMetrics.revenue / 10000000;
        }
        const updatedProject = { ...p, plan: updatedPlan };
        return addLogToProject(updatedProject, 'Business Plan', `Updated ${key} to ${value}`);
    }));
  };

  const updateProjectField = (id: string, field: 'receivedBudget' | 'otherSpends', value: number) => {
     if (currentUser.role === UserRole.MANAGER && field === 'receivedBudget') return;
     setProjects(prev => prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value, plan: field === 'receivedBudget' ? { ...p.plan, receivedBudget: value } : p.plan };
        return addLogToProject(updated, 'Financials', `Updated ${field} to ${value}`);
     }));
  }
  
  const updateProjectManualBudget = (id: string, value: number) => {
    if (currentUser.role === UserRole.MANAGER) return;
    setProjects(prev => prev.map(p => p.id === id ? addLogToProject({ ...p, manualMediaBudget: value }, 'Media Mix', `Updated Manual Simulation Budget to ${value}`) : p));
  };

  const updateProjectWeek = (id: string, weekId: number, field: keyof WeeklyData, value: number) => {
    if (currentUser.role === UserRole.MANAGER) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updatedWeeks = p.weeks.map(w => w.id === weekId ? { ...w, [field]: value } : w);
      return addLogToProject({ ...p, weeks: updatedWeeks }, 'WoW Plan', `Updated Week ${weekId + 1} ${field} to ${value}`);
    }));
  };

  const updateProjectActual = (id: string, weekId: number, field: keyof WeeklyActuals, value: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const currentActual = p.actuals[weekId] || { weekId };
      const updated = {
        ...p,
        actuals: {
          ...p.actuals,
          [weekId]: { ...currentActual, [field]: value }
        }
      };
      return addLogToProject(updated, 'Performance', `Updated Week ${weekId + 1} Actual ${field} to ${value}`);
    }));
  };

  const updateProjectActualRevenue = (id: string, vertical: 'digital' | 'presales' | 'brand' | 'referral' | 'cp', newRevenue: number) => {
    setProjects(prev => prev.map(p => {
        if (p.id !== id) return p;
        const ats = p.plan.ats > 0 ? p.plan.ats : 1;
        const overallBV = p.plan.overallBV > 0 ? p.plan.overallBV : 1;
        const targetTotalUnits = newRevenue / ats;
        const fieldMap: Record<string, keyof WeeklyActuals> = { 'digital': 'bookings', 'presales': 'presalesBookings', 'brand': 'brandBookings', 'referral': 'referralBookings', 'cp': 'cpBookings' };
        const field = fieldMap[vertical];
        let currentTotalUnits = 0;
        Object.values(p.actuals).forEach(a => currentTotalUnits += (a[field] || 0));
        const diffUnits = targetTotalUnits - currentTotalUnits;
        const week0 = p.actuals[0] || { weekId: 0 };
        const newWeek0Val = (week0[field] || 0) + diffUnits;
        const planKeyMap: Record<string, keyof PlanningData> = { 'digital': 'digitalContributionPercent', 'presales': 'presalesContributionPercent', 'brand': 'brandContributionPercent', 'referral': 'referralContributionPercent', 'cp': 'cpContributionPercent' };
        const planKey = planKeyMap[vertical];
        const newContributionPercent = (newRevenue / overallBV) * 100;
        const updated = {
            ...p,
            plan: { ...p.plan, [planKey]: parseFloat(newContributionPercent.toFixed(2)) },
            actuals: { ...p.actuals, 0: { ...week0, [field]: newWeek0Val } }
        };
        return addLogToProject(updated, 'Performance', `Updated LTD Revenue for ${vertical} to ${newRevenue} Cr`);
    }));
  };

  const updateChannelPerformance = (projectId: string, channelId: string, field: keyof ChannelPerformance, value: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const currentPerf = p.channelPerformance?.find(cp => cp.channelId === channelId) || { channelId, spends: 0, leads: 0, openAttempted: 0, contacted: 0, assignedToSales: 0, ap: 0, ad: 0, bookings: 0, lost: 0 };
      const newPerf = { ...currentPerf, [field]: value };
      const otherPerfs = p.channelPerformance?.filter(cp => cp.channelId !== channelId) || [];
      const updated = { ...p, channelPerformance: [...otherPerfs, newPerf] };
      return addLogToProject(updated, 'Channel Tracker', `Updated Channel Performance: ${field} to ${value}`);
    }));
  };

  const updateMediaChannel = (projectId: string, channelId: string, field: keyof MediaChannel, value: number | string) => {
    if (currentUser.role === UserRole.MANAGER) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updated = { ...p, mediaPlan: p.mediaPlan.map(ch => ch.id === channelId ? { ...ch, [field]: value } : ch) };
      return addLogToProject(updated, 'Media Mix', `Updated Channel ${channelId}: ${field} to ${value}`);
    }));
  };

  const addMediaChannel = (projectId: string, presetName?: string) => {
    if (currentUser.role === UserRole.MANAGER) return;
    const newChannel: MediaChannel = { id: Date.now().toString(), name: presetName || 'New Channel', allocationPercent: 0, estimatedCpl: 2500, capiPercent: 30, capiToApPercent: 30, apToAdPercent: 50, isCustom: true };
    setProjects(prev => prev.map(p => p.id === projectId ? addLogToProject({ ...p, mediaPlan: [...p.mediaPlan, newChannel] }, 'Media Mix', `Added Channel: ${newChannel.name}`) : p));
  };

  const deleteMediaChannel = (projectId: string, channelId: string) => {
    if (currentUser.role === UserRole.MANAGER) return;
    setProjects(prev => prev.map(p => p.id === projectId ? addLogToProject({ ...p, mediaPlan: p.mediaPlan.filter(c => c.id !== channelId) }, 'Media Mix', `Deleted Channel ${channelId}`) : p));
  };

  const toggleProjectLock = (id: string) => {
    if (currentUser.role !== UserRole.GM) return;
    setProjects(prev => prev.map(p => p.id === id ? addLogToProject({ ...p, isLocked: !p.isLocked }, 'Admin', `Project ${p.isLocked ? 'Unlocked' : 'Locked'}`) : p));
  };

  const updateProjectPoc = (id: string, newPocName: string) => {
    setProjects(prev => prev.map(p => p.id === id ? addLogToProject({ ...p, poc: newPocName }, 'Admin', `Changed SPOC to ${newPocName}`) : p));
  };

  const handleDeleteProject = (id: string) => {
    if (currentUser.role !== UserRole.GM) return;
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = { id: Date.now().toString(), name: newProjectName, location: 'New Location', poc: newProjectPoc, status: 'Planning', plan: { ...INITIAL_PLAN }, otherSpends: 0, mediaPlan: [...INITIAL_MEDIA_PLAN], channelPerformance: [], weeks: generateWeeks(), actuals: {}, logs: [createLog(currentUser.name, 'Admin', 'Project Created')], isLocked: false };
    setProjects(prev => [...prev, newProject]);
    setIsProjectModalOpen(false);
    setNewProjectName('');
  };

  const handleAddPoc = () => {
    if (newPocName.trim()) {
      setPocs([...pocs, { id: Date.now().toString(), name: newPocName }]);
      setNewPocName('');
      setIsAddingPoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl">
              <LayoutDashboard className="w-6 h-6 text-brand-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">GPL Performance Tracker</h1>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">FY 2025-26</span>
                 <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 animate-pulse flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Ongoing: {currentStatus.quarter}
                 </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
             
             <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-full px-2">
                <CalendarRange className="w-3.5 h-3.5 text-slate-500 ml-1" />
                {[TimeGranularity.WEEKLY, TimeGranularity.MONTHLY, TimeGranularity.QUARTERLY, TimeGranularity.HALF_YEARLY].map(tg => (
                  <button key={tg} onClick={() => setGranularity(tg)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all ${granularity === tg ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>{tg}</button>
                ))}
             </div>

             <div className="flex items-center bg-slate-950 border border-slate-800 rounded-full p-1 shadow-sm mr-2">
                <button onClick={() => setViewMode(ViewMode.BRAND)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${viewMode === ViewMode.BRAND ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><DollarSign className="w-3 h-3" /> Brand (Net)</button>
                <button onClick={() => setViewMode(ViewMode.AGENCY)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${viewMode === ViewMode.AGENCY ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Briefcase className="w-3 h-3" /> Agency (Gross)</button>
             </div>
             <div className="group flex items-center bg-slate-950 border border-slate-800 rounded-full px-1 py-1 shadow-sm hover:border-slate-700 transition-colors">
               <div className="px-3 py-1.5 flex items-center gap-2 border-r border-slate-800"><Calendar className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" /><div className="flex flex-col"><span className="text-[9px] font-bold text-slate-600 uppercase leading-none mb-0.5">FY Start</span><input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-transparent text-xs font-bold text-slate-200 outline-none w-24 uppercase p-0 border-none cursor-pointer" /></div></div>
               <div className="px-3 py-1.5 flex items-center gap-2"><div className="flex flex-col"><span className="text-[9px] font-bold text-slate-600 uppercase leading-none mb-0.5 text-right">FY End</span><input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-transparent text-xs font-bold text-slate-200 outline-none w-24 uppercase p-0 border-none cursor-pointer text-right" /></div></div>
            </div>
            {(currentUser.role === UserRole.GM || currentUser.role === UserRole.SM) && (
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-full px-1 py-1 shadow-sm hover:border-slate-700 transition-colors relative">
                  <div className="flex items-center px-4 py-1.5 gap-2 border-r border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">{selectedPocFilter === 'All' ? 'A' : selectedPocFilter.charAt(0)}</div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-600 uppercase leading-none mb-0.5">Filter SPOC</span><select value={selectedPocFilter} onChange={(e) => setSelectedPocFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer min-w-[80px] appearance-none hover:text-white transition-colors"><option value="All">All Projects</option>{pocs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                  </div>
                  {isAddingPoc ? (
                    <div className="flex items-center px-2 animate-in slide-in-from-left-2 duration-200"><input type="text" value={newPocName} onChange={(e) => setNewPocName(e.target.value)} placeholder="Name" className="w-16 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-white focus:outline-none focus:border-brand-500 mr-1" autoFocus /><button onClick={handleAddPoc} className="text-emerald-500 hover:text-emerald-400 p-1"><Check className="w-3.5 h-3.5" /></button><button onClick={() => setIsAddingPoc(false)} className="text-rose-500 hover:text-rose-400 p-1"><X className="w-3.5 h-3.5" /></button></div>
                  ) : (<button onClick={() => setIsAddingPoc(true)} className="px-3 hover:text-brand-400 text-slate-500 transition-colors" title="Add New SPOC"><UserPlus className="w-4 h-4" /></button>)}
              </div>
            )}
             <div className="flex items-center gap-2 pl-2"><div className="text-right hidden sm:block leading-tight"><div className="text-xs font-bold text-white">{currentUser.name}</div><div className="text-[10px] text-slate-500 uppercase font-medium">{currentUser.role}</div></div><div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">{currentUser.name.charAt(0)}</div><button onClick={() => setCurrentUser(null)} className="ml-2 p-2 bg-slate-900 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded-full transition-colors border border-slate-800 hover:border-rose-900/50 group" title="Logout"><LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></button></div>
          </div>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {selectedProjectId && activeProject ? (
          <ProjectDetail 
            project={activeProject} metrics={getProjectMetrics(activeProject.id)} viewMode={viewMode} granularity={granularity} ongoingStatus={currentStatus} currentUser={currentUser} onBack={() => setSelectedProjectId(null)} onUpdatePlan={updateProjectPlan} onUpdateWeek={updateProjectWeek} onUpdateActual={updateProjectActual} onUpdateChannel={updateMediaChannel} onAddChannel={addMediaChannel} onDeleteChannel={(cid) => deleteMediaChannel(activeProject.id, cid)} onUpdateManualBudget={(val) => updateProjectManualBudget(activeProject.id, val)} onToggleLock={toggleProjectLock} onUpdateChannelPerformance={updateChannelPerformance}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
              <div><h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Project Portfolio</h2><p className="text-slate-400 mt-1 font-medium flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> Indian FY Period: <span className="text-white">{reportStartDate}</span> to <span className="text-white">{reportEndDate}</span></p></div>
              <div className="flex gap-2 w-full md:w-auto">
                 <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700"><button onClick={() => setIsVisualMode(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Table className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Report</span></button><button onClick={() => setIsVisualMode(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}><PieChart className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Analytics</span></button></div>
                 {currentUser.role === UserRole.GM && (<button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all transform hover:scale-105 ml-auto"><Plus className="w-5 h-5" /> New Project</button>)}
              </div>
            </div>
            {isVisualMode ? (<VisualDashboard projects={filteredProjects} viewMode={viewMode} granularity={granularity} />) : (<DashboardOverview projects={filteredProjects} viewMode={viewMode} granularity={granularity} ongoingStatus={currentStatus} currentUser={currentUser} onSelectProject={setSelectedProjectId} onUpdateProjectField={updateProjectField} onUpdatePlan={updateProjectPlan} startWeekIndex={Math.max(0, startWeekIndex)} endWeekIndex={endWeekIndex === -1 ? 51 : endWeekIndex} pocs={pocs} onUpdateProjectPoc={updateProjectPoc} onDeleteProject={handleDeleteProject} onUpdateProjectActualRevenue={updateProjectActualRevenue} />)}
          </>
        )}
      </main>
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div className="p-6 border-b border-slate-800 flex justify-between items-center"><h3 className="text-xl font-bold text-white">Create New Project</h3><button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button></div><div className="p-6 space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project Name</label><input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Godrej Park World" autoFocus /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign SPOC</label><select value={newProjectPoc} onChange={(e) => setNewProjectPoc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer">{pocs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div></div><div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900"><button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button><button onClick={handleAddProject} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold shadow-lg">Create Project</button></div></div>
        </div>
      )}
    </div>
  );
};

export default App;
