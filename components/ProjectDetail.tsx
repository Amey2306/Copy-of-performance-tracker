
import React, { useState } from 'react';
import { Project, TabView, CalculatedMetrics, PlanningData, WeeklyData, WeeklyActuals, ViewMode, MediaChannel, ChannelPerformance, User, UserRole, TimeGranularity } from '../types';
import { PlanningSection } from './PlanningSection';
import { WowTable } from './WowTable';
import { PerformanceTracker } from './PerformanceTracker';
import { MediaMixSimulator } from './MediaMixSimulator';
import { ChannelPerformanceTracker } from './ChannelPerformanceTracker';
import { Target, LayoutList, TrendingUp, Lock, Unlock, ArrowLeft, PieChart, BarChart2, Download, History, Clock, Calendar } from 'lucide-react';
import { exportBusinessPlan, exportMediaMix, exportWoWPlan, exportPerformance, exportChannelTracker } from '../utils/exportUtils';

interface OngoingStatus {
    weekId: number;
    month: string;
    quarter: string;
    half: string;
}

interface Props {
  project: Project;
  metrics: CalculatedMetrics;
  viewMode: ViewMode;
  granularity: TimeGranularity;
  ongoingStatus: OngoingStatus;
  currentUser: User;
  onBack: () => void;
  onUpdatePlan: (id: string, key: keyof PlanningData, value: number | string) => void;
  onUpdateWeek: (projectId: string, weekId: number, field: keyof WeeklyData, value: number) => void;
  onUpdateActual: (projectId: string, weekId: number, field: keyof WeeklyActuals, value: number) => void;
  onUpdateChannel: (projectId: string, channelId: string, field: keyof MediaChannel, value: number | string) => void;
  onAddChannel: (projectId: string, presetName?: string) => void;
  onDeleteChannel: (projectId: string, channelId: string) => void;
  onUpdateManualBudget: (projectId: string, value: number) => void;
  onToggleLock: (id: string) => void;
  onUpdateChannelPerformance: (projectId: string, channelId: string, field: keyof ChannelPerformance, value: number) => void;
}

export const ProjectDetail: React.FC<Props> = ({ 
  project, metrics, viewMode, granularity, ongoingStatus, currentUser, onBack, onUpdatePlan, onUpdateWeek, onUpdateActual, 
  onUpdateChannel, onAddChannel, onDeleteChannel, onUpdateManualBudget, onToggleLock, onUpdateChannelPerformance 
}) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.PLANNING);

  const handleDownload = () => {
    switch(activeTab) {
        case TabView.PLANNING: exportBusinessPlan(project, metrics); break;
        case TabView.MEDIA_MIX: exportMediaMix(project); break;
        case TabView.WOW_PLAN: exportWoWPlan(project, viewMode); break;
        case TabView.PERFORMANCE: exportPerformance(project, viewMode); break;
        case TabView.CHANNEL_TRACKER: exportChannelTracker(project, viewMode); break;
    }
  };

  const isManager = currentUser.role === UserRole.MANAGER;
  const isSM = currentUser.role === UserRole.SM;
  const isPlanReadOnly = isManager || isSM || project.isLocked;
  const isMediaReadOnly = isManager; 
  const isWoWReadOnly = isManager || project.isLocked; 

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-slate-400 hover:text-white" /></button>
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">{project.name}</h2>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-medium">{project.location} • {project.status}</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-950/40 border border-brand-900/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">{ongoingStatus.quarter} Ongoing</span>
                </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto overflow-x-auto pb-1 custom-scrollbar">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-sm min-w-max">
            <button onClick={() => setActiveTab(TabView.PLANNING)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.PLANNING ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Target className="w-4 h-4" />Business Plan</button>
            <button onClick={() => setActiveTab(TabView.MEDIA_MIX)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.MEDIA_MIX ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><PieChart className="w-4 h-4" />Media Mix</button>
            <button onClick={() => setActiveTab(TabView.WOW_PLAN)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.WOW_PLAN ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutList className="w-4 h-4" />WoW Plan</button>
            <button onClick={() => setActiveTab(TabView.PERFORMANCE)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.PERFORMANCE ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><TrendingUp className="w-4 h-4" />Performance</button>
            <button onClick={() => setActiveTab(TabView.CHANNEL_TRACKER)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.CHANNEL_TRACKER ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BarChart2 className="w-4 h-4" />Channel Tracker</button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={() => setActiveTab(TabView.HISTORY)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.HISTORY ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><History className="w-4 h-4" />History</button>
          </div>
        </div>
      </div>
      <div className="transition-all duration-300">
        <div className="flex justify-end mb-4 gap-2">
            <button onClick={handleDownload} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white shadow-sm"><Download className="w-3.5 h-3.5" /> Download</button>
            {(activeTab === TabView.PLANNING || activeTab === TabView.WOW_PLAN) && (<button onClick={() => currentUser.role === UserRole.GM && onToggleLock(project.id)} disabled={currentUser.role !== UserRole.GM} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded border shadow-sm ${project.isLocked ? 'bg-amber-950/40 border-amber-900 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>{project.isLocked ? 'Locked' : 'Lock Plan'}</button>)}
        </div>
        {activeTab === TabView.PLANNING && (<PlanningSection data={project.plan} metrics={metrics} onChange={(k, v) => onUpdatePlan(project.id, k, v)} viewMode={viewMode} readOnly={isPlanReadOnly} />)}
        {activeTab === TabView.MEDIA_MIX && (<MediaMixSimulator channels={project.mediaPlan} metrics={metrics} viewMode={viewMode} taxPercent={project.plan.taxPercent} manualBudget={project.manualMediaBudget} onUpdateChannel={(cid, f, v) => onUpdateChannel(project.id, cid, f, v)} onUpdateManualBudget={(val) => onUpdateManualBudget(project.id, val)} onAddChannel={(preset) => onAddChannel(project.id, preset)} onDeleteChannel={(cid) => onDeleteChannel(project.id, cid)} />)}
        {activeTab === TabView.WOW_PLAN && (<WowTable weeks={project.weeks} metrics={metrics} onUpdateWeek={(wid, k, v) => onUpdateWeek(project.id, wid, k, v)} viewMode={viewMode} readOnly={isWoWReadOnly} granularity={granularity} ongoingStatus={ongoingStatus} />)}
        {activeTab === TabView.PERFORMANCE && (<PerformanceTracker weeks={project.weeks} actuals={project.actuals} plan={project.plan} onUpdateActual={(wid, k, v) => onUpdateActual(project.id, wid, k, v)} viewMode={viewMode} granularity={granularity} ongoingStatus={ongoingStatus} />)}
        {activeTab === TabView.CHANNEL_TRACKER && (<ChannelPerformanceTracker channels={project.mediaPlan} performance={project.channelPerformance || []} viewMode={viewMode} taxPercent={project.plan.taxPercent} onUpdate={(cid, f, v) => onUpdateChannelPerformance(project.id, cid, f, v)} />)}
        {activeTab === TabView.HISTORY && (
            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                <div className="bg-slate-950 p-4 border-b border-slate-800"><div><h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" /> Audit Log</h2></div></div>
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800"><tr><th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Action</th></tr></thead>
                        <tbody className="divide-y divide-slate-800">{project.logs && project.logs.length > 0 ? (project.logs.map(log => (<tr key={log.id} className="hover:bg-slate-800/30 transition-colors"><td className="px-6 py-3 text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-3 font-medium text-white">{log.user}</td><td className="px-6 py-3 text-slate-300 text-xs">{log.message}</td></tr>))) : (<tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No history.</td></tr>)}</tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
