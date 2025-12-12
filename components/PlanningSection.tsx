
import React from 'react';
import { PlanningData, CalculatedMetrics, ViewMode } from '../types';
import { Calculator, Target, Info, ArrowLeftRight } from 'lucide-react';

interface Props {
  data: PlanningData;
  metrics: CalculatedMetrics;
  onChange: (key: keyof PlanningData, value: any) => void;
  viewMode: ViewMode;
  readOnly?: boolean;
}

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}

// Moved outside to prevent re-mounting issues
const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, disabled, suffix, prefix, className }) => {
  // Generate a unique ID for accessibility linkage
  const inputId = React.useId();

  return (
    <div className={`relative group ${className || ''}`}>
       <label 
         htmlFor={inputId}
         className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 group-focus-within:text-brand-400 transition-colors cursor-pointer"
       >
         {label}
       </label>
       <div className="relative">
         {prefix && (
           <span 
             className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm pointer-events-none"
             aria-hidden="true"
           >
             {prefix}
           </span>
         )}
         <input
            id={inputId}
            type="number"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            aria-disabled={disabled}
            className={`
              w-full bg-slate-950 border border-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2.5 shadow-sm 
              focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-slate-900
              hover:border-slate-700
              transition-all duration-200 outline-none 
              disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed disabled:border-slate-800
              ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}
              ${disabled ? 'opacity-80' : ''}
            `}
          />
         {suffix && (
           <span 
             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none"
             aria-hidden="true"
           >
             {suffix}
           </span>
         )}
       </div>
    </div>
  );
};

export const PlanningSection: React.FC<Props> = ({ data, metrics, onChange, viewMode, readOnly = false }) => {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const taxMult = viewMode === ViewMode.AGENCY ? (1 + data.taxPercent / 100) : 1;

  // Logic for display values based on Calculation Mode
  const isBudgetMode = data.calculationMode === 'budget';
  
  // Overall BV Display: If in Budget Mode, it's calculated from Revenue. If in Revenue Mode, it's the Input.
  const displayOverallBV = isBudgetMode ? (metrics.revenue / 10000000) : data.overallBV;
  
  // Budget Display: If in Budget Mode, it's the Input. If in Revenue Mode, it's Calculated.
  const rawBudgetVal = isBudgetMode ? data.budgetInput : metrics.baseBudget;
  const displayBudget = Math.round(rawBudgetVal * taxMult);

  const handleModeToggle = () => {
    if (readOnly) return;
    const newMode = isBudgetMode ? 'revenue' : 'budget';
    onChange('calculationMode', newMode);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mb-8 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-b border-slate-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-500" />
            Business Plan & Parameters
          </h2>
          <p className="text-sm text-slate-500 mt-1">Define the anchors for your funnel calculation.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Calculation Mode Toggle */}
            <div className={`flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
                <button
                    onClick={() => !isBudgetMode && handleModeToggle()}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${!isBudgetMode ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Target Revenue
                </button>
                <div className="px-1 text-slate-600"><ArrowLeftRight className="w-3 h-3" /></div>
                <button
                    onClick={() => isBudgetMode && handleModeToggle()}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${isBudgetMode ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Spending Budget
                </button>
            </div>

            {readOnly && (
            <div className="bg-amber-950/40 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Plan Locked
            </div>
            )}
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
        {/* Input Group 1: Business Targets */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Revenue Targets</h3>
          
          <InputField 
            label={isBudgetMode ? "Calculated BV (Cr)" : "Overall BV Target (Cr)"}
            value={parseFloat(displayOverallBV.toFixed(2))}
            onChange={(val: number) => onChange('overallBV', val)}
            disabled={readOnly || isBudgetMode}
            className={isBudgetMode ? "opacity-75" : ""}
          />
          <InputField 
            label="Avg Ticket Size (Cr)"
            value={data.ats}
            onChange={(val: number) => onChange('ats', val)}
            disabled={readOnly}
          />
          <div className="grid grid-cols-2 gap-4">
             <InputField 
              label="Digital Contrib."
              value={data.digitalContributionPercent}
              onChange={(val: number) => onChange('digitalContributionPercent', val)}
              disabled={readOnly}
              suffix="%"
            />
             <InputField 
              label="Presales Contrib."
              value={data.presalesContributionPercent}
              onChange={(val: number) => onChange('presalesContributionPercent', val)}
              disabled={readOnly}
              suffix="%"
            />
          </div>
        </div>

        {/* Input Group 2: Funnel Efficiency */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Funnel Efficiency</h3>
          
          <InputField 
            label="Lead to Walkin (LTW)"
            value={data.ltwPercent}
            onChange={(val: number) => onChange('ltwPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
          <InputField 
            label="Walkin to Booking (WTB)"
            value={data.wtbPercent}
            onChange={(val: number) => onChange('wtbPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
        </div>

        {/* Input Group 3: Costs */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Cost Planning</h3>
          
          <InputField 
            label={`Planned CPL ${viewMode === ViewMode.AGENCY ? '(Gross)' : '(Net)'}`}
            value={Math.round(data.cpl * taxMult)}
            onChange={(val: number) => onChange('cpl', val / taxMult)}
            disabled={readOnly}
            prefix="₹"
          />
           <InputField 
            label="Tax / Agency Fee"
            value={data.taxPercent}
            onChange={(val: number) => onChange('taxPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
          <InputField 
            label={`Planned Budget ${viewMode === ViewMode.AGENCY ? '(Gross)' : '(Net)'}`}
            value={displayBudget}
            onChange={(val: number) => onChange('budgetInput', val / taxMult)}
            disabled={readOnly || !isBudgetMode}
            prefix="₹"
            className={!isBudgetMode ? "opacity-75" : "ring-1 ring-brand-500/50 rounded-lg"}
          />
        </div>

        {/* Output Group: Derived Targets */}
        <div className="bg-emerald-950/20 rounded-xl p-6 border border-emerald-900/40 flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full pointer-events-none"></div>
           <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
             <Calculator className="w-4 h-4" />
             Derived Annual Targets
           </h3>
           
           <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Units</span>
                <span className="text-lg font-bold text-white">{metrics.totalUnits.toFixed(1)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Digital Units</span>
                <span className="text-lg font-bold text-white">{metrics.digitalUnits.toFixed(1)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Target Walkins</span>
                <span className="text-lg font-bold text-white">{Math.ceil(metrics.targetWalkins)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Target Leads</span>
                <span className="text-xl font-black text-brand-400">{Math.ceil(metrics.targetLeads).toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`px-6 md:px-8 py-5 border-t border-slate-800 flex flex-col md:flex-row flex-wrap gap-6 md:gap-12 items-start md:items-center ${viewMode === ViewMode.AGENCY ? 'bg-amber-950/20' : 'bg-emerald-950/20'}`}>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Plan Spend ({viewMode === ViewMode.BRAND ? 'Base' : 'All-in'})</span>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(viewMode === ViewMode.BRAND ? metrics.baseBudget : metrics.allInBudget)}
          </div>
        </div>
        
        <div className="hidden md:block h-10 w-px bg-slate-800"></div>
        
        {/* New Metrics Display for Dashboard (Digital BV / Presales BV) */}
        <div className="flex gap-8 flex-wrap">
            <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Digital BV</span>
            <div className="text-lg font-bold text-white">₹{metrics.digitalBV.toFixed(2)} Cr</div>
            </div>
            <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target COM %</span>
            <div className="text-lg font-bold text-white">{metrics.targetCOM.toFixed(2)}%</div>
            </div>

            <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target CPW ({viewMode === ViewMode.AGENCY ? 'Gr' : 'Nt'})</span>
            <div className="text-lg font-bold text-slate-300">{formatCurrency(metrics.cpw * taxMult)}</div>
            </div>

            <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target CPB ({viewMode === ViewMode.AGENCY ? 'Gr' : 'Nt'})</span>
            <div className="text-lg font-bold text-slate-300">{formatCurrency(metrics.cpb * taxMult)}</div>
            </div>
        </div>

        <div className="md:ml-auto w-full md:w-auto">
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 md:text-right">Proj. Revenue</span>
           <div className="text-xl font-bold text-brand-400 md:text-right">₹{(metrics.revenue / 10000000).toFixed(2)} Cr</div>
        </div>
      </div>
    </div>
  );
};
