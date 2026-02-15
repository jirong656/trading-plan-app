import { useState, useEffect } from 'react';
import { Trash2, TrendingUp, TrendingDown, Edit3, DollarSign, Target } from 'lucide-react';

export default function NegRRPlanCard({ plan, onDelete, onUpdate }) {
    // Local state for editing to prevent excessive context updates on every keystroke
    const [contracts, setContracts] = useState(plan.contracts || 0);
    const [actualEntry, setActualEntry] = useState(plan.actualEntryPrice || '');

    // Update local state if prop changes
    useEffect(() => {
        setContracts(plan.contracts || 0);
        setActualEntry(plan.actualEntryPrice || '');
    }, [plan.contracts, plan.actualEntryPrice]);

    // Handle updates (debounce could be added, but onBlur/Enter is simpler for now)
    const handleUpdate = () => {
        onUpdate(plan.id, {
            contracts: parseFloat(contracts),
            actualEntryPrice: actualEntry ? parseFloat(actualEntry) : null
        });
    };

    const isLong = plan.position === 'Long';
    const pointValue = plan.pointValue || 20; // Default fallback if missing

    // Calculations
    const calculatePnL = (entry, exit) => {
        const diff = isLong ? (exit - entry) : (entry - exit);
        return diff * pointValue * (parseFloat(contracts) || 0);
    };

    const requiredRisk = Math.abs(calculatePnL(plan.planEntryPrice, plan.stopPrice));
    // Note: Risk is always positive loss magnitude

    const targetProfit = calculatePnL(plan.planEntryPrice, plan.profitPrice);

    // Actuals (only if actualEntry is valid)
    const hasActuals = actualEntry && !isNaN(parseFloat(actualEntry));
    const actualRisk = hasActuals ? Math.abs(calculatePnL(parseFloat(actualEntry), plan.stopPrice)) : null;
    const actualProfit = hasActuals ? calculatePnL(parseFloat(actualEntry), plan.profitPrice) : null;

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:shadow-cyan-900/20 transition-all group">

            {/* Header */}
            <div className={`p-4 border-b border-slate-700 flex justify-between items-start ${isLong ? 'bg-emerald-950/20' : 'bg-red-950/20'}`}>
                <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        {plan.instrumentSymbol}
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${isLong ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-red-500 text-red-400 bg-red-500/10'
                            }`}>
                            {plan.position}
                        </span>
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">ID: {plan.id.slice(0, 8)}</span>
                </div>
                <button
                    onClick={() => onDelete(plan.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">

                {/* 1. Prices Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                        <div className="text-slate-500 mb-1">Stop</div>
                        <div className="text-red-400 font-mono">{plan.stopPrice}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                        <div className="text-blue-400 mb-1 font-semibold">Plan Entry</div>
                        <div className="text-slate-200 font-mono">{plan.planEntryPrice}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                        <div className="text-emerald-500 mb-1">Target</div>
                        <div className="text-emerald-400 font-mono">{plan.profitPrice}</div>
                    </div>
                </div>

                {/* 2. Interactive Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Contracts
                        </label>
                        <input
                            type="number"
                            value={contracts}
                            onChange={(e) => setContracts(e.target.value)}
                            onBlur={handleUpdate}
                            className="w-full bg-slate-800 border-b border-slate-600 focus:border-cyan-500 text-white px-2 py-1 text-sm font-mono focus:outline-none transition-colors"
                            placeholder="Qty"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-amber-500/80 uppercase tracking-wider mb-1">
                            Actual Entry
                        </label>
                        <input
                            type="number"
                            value={actualEntry}
                            onChange={(e) => setActualEntry(e.target.value)}
                            onBlur={handleUpdate}
                            className="w-full bg-slate-800 border-b border-slate-600 focus:border-amber-500 text-amber-300 px-2 py-1 text-sm font-mono focus:outline-none transition-colors placeholder:text-slate-600"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* 3. Calculated Metrics */}
                <div className="space-y-2 pt-2 border-t border-slate-700/50">

                    {/* Planned Metrics */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Required Risk:</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 font-mono">
                                ({(Math.abs(plan.profitPrice - plan.planEntryPrice) / Math.abs(plan.planEntryPrice - plan.stopPrice)).toFixed(2)}R)
                            </span>
                            <span className="font-mono text-slate-200">${requiredRisk.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Target Profit:</span>
                        <span className="font-mono text-emerald-400">${targetProfit.toFixed(2)}</span>
                    </div>

                    {/* Actual Metrics (Conditional) */}
                    {hasActuals && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-700/50 bg-slate-950/30 -mx-4 px-4 pb-2">
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-amber-500/80">Actual Risk:</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-amber-500/60 font-mono">
                                        ({(Math.abs(plan.profitPrice - parseFloat(actualEntry)) / Math.abs(parseFloat(actualEntry) - plan.stopPrice)).toFixed(2)}R)
                                    </span>
                                    <span className="font-mono text-amber-300">${actualRisk.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-500/80">Actual Profit:</span>
                                <span className="font-mono text-emerald-300">${actualProfit.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
