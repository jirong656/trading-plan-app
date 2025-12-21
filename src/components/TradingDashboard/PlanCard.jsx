import { Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function PlanCard({ plan, onDelete }) {
    const { calculations, instrumentSymbol, riskCapital, createdAt } = plan;

    const fmt = (num) => num?.toFixed(6);

    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:shadow-cyan-900/20 transition-all">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400">{instrumentSymbol}</span>
                        <span className="text-slate-500 text-sm font-normal">
                            Risk: ${parseFloat(riskCapital).toFixed(2)}
                        </span>
                    </h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {new Date(createdAt).toLocaleTimeString()}
                    </span>
                </div>
                <button onClick={() => onDelete(plan.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-xs uppercase mb-1">Contracts</div>
                        <div className="text-xl font-mono text-cyan-300 font-bold">{fmt(calculations.contracts)}</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-xs uppercase mb-1">Risk Points</div>
                        <div className="text-xl font-mono text-amber-500 font-bold">{fmt(calculations.riskInPoints)}</div>
                    </div>
                </div>

                {/* Long Plan */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                        <TrendingUp size={16} /> Long Plan
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                            <span className="block text-emerald-500/70">Entry</span>
                            <span className="font-mono text-emerald-200 text-sm">{fmt(calculations.longEntry)}</span>
                        </div>
                        <div className="bg-red-950/20 p-2 rounded border border-red-900/30">
                            <span className="block text-red-500/70">Stop</span>
                            <span className="font-mono text-red-300 text-sm">{fmt(calculations.longStop)}</span>
                        </div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 rounded border border-emerald-500/30 flex justify-between items-center px-3">
                        <span className="text-emerald-500 text-xs font-semibold uppercase">Target</span>
                        <span className="font-mono text-emerald-300 font-bold">{fmt(calculations.targetLong)}</span>
                    </div>
                </div>

                {/* Short Plan */}
                <div className="space-y-2 border-t border-slate-700/50 pt-3">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-sm uppercase tracking-wider">
                        <TrendingDown size={16} /> Short Plan
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-950/30 p-2 rounded border border-red-900/50">
                            <span className="block text-red-500/70">Entry</span>
                            <span className="font-mono text-red-200 text-sm">{fmt(calculations.shortEntry)}</span>
                        </div>
                        <div className="bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                            <span className="block text-emerald-500/70">Stop</span>
                            <span className="font-mono text-emerald-300 text-sm">{fmt(calculations.shortStop)}</span>
                        </div>
                    </div>
                    <div className="bg-red-900/20 p-2 rounded border border-red-500/30 flex justify-between items-center px-3">
                        <span className="text-red-500 text-xs font-semibold uppercase">Target</span>
                        <span className="font-mono text-red-300 font-bold">{fmt(calculations.targetShort)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
