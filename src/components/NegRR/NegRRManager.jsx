import { useState } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { usePlans } from '../../context/PlanContext';
import { TrendingUp, TrendingDown, Save, Plus, DollarSign, Activity } from 'lucide-react';
import NegRRPlanCard from './NegRRPlanCard';

export default function NegRRManager() {
    const { instruments } = useInstruments();
    const { dailySettings, updateDailySettings, plans, addPlan, deletePlan, updatePlan } = usePlans();

    // Local State for Form
    const [riskCapitalInput, setRiskCapitalInput] = useState(dailySettings?.riskCapital || '');
    const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
    const [position, setPosition] = useState('Long'); // 'Long' or 'Short'
    const [stopPrice, setStopPrice] = useState('');
    const [profitPrice, setProfitPrice] = useState('');
    const [planEntryPrice, setPlanEntryPrice] = useState('');
    const [actualEntryPrice, setActualEntryPrice] = useState(''); // Optional

    // Derived
    const selectedInstrument = instruments.find(i => i.id === selectedInstrumentId);

    // Filter for NegRR plans
    const negrrPlans = plans.filter(p => p.type === 'negrr');

    const handleSaveSettings = () => {
        if (!riskCapitalInput) return;
        updateDailySettings({ riskCapital: parseFloat(riskCapitalInput) });
        alert('Settings Saved!');
    };

    const handleGeneratePlan = () => {
        if (!selectedInstrument || !stopPrice || !profitPrice || !planEntryPrice) {
            alert("Please fill in all required fields (Instrument, Stop, Profit, Plan Entry).");
            return;
        }

        const newPlan = {
            type: 'negrr',
            instrumentId: selectedInstrument.id,
            instrumentSymbol: selectedInstrument.symbol,
            pointValue: selectedInstrument.pointValue,

            // Inputs
            position,
            stopPrice: parseFloat(stopPrice),
            profitPrice: parseFloat(profitPrice),
            planEntryPrice: parseFloat(planEntryPrice),
            actualEntryPrice: actualEntryPrice ? parseFloat(actualEntryPrice) : null,

            // Default contracts to 1 initially, user can change later on card
            contracts: 1,
        };

        addPlan(newPlan);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Input Form */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">

                {/* 1. Daily Plan Settings */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm shadow-xl">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-400" />
                        Daily Plan Settings
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Total Risk Capital ($)</label>
                            <input
                                type="number"
                                value={riskCapitalInput}
                                onChange={(e) => setRiskCapitalInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="e.g. 1000"
                            />
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Save Settings
                        </button>
                    </div>
                </div>

                {/* New Trading Plan Form */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm shadow-xl space-y-4">
                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                        <Plus size={18} className="text-blue-400" />
                        New Trading Plan
                    </h3>

                    {/* 1. Instrument */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">1. Instrument</label>
                        <select
                            value={selectedInstrumentId}
                            onChange={(e) => setSelectedInstrumentId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="">-- Select Instrument --</option>
                            {instruments.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.symbol}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Trade Position */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">2. Trade Position</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPosition('Long')}
                                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${position === 'Long'
                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <TrendingUp size={16} /> Long
                            </button>
                            <button
                                onClick={() => setPosition('Short')}
                                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${position === 'Short'
                                        ? 'bg-red-600/20 border-red-500 text-red-400'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <TrendingDown size={16} /> Short
                            </button>
                        </div>
                    </div>

                    {/* 3. Stop Level */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">3. Stop Price</label>
                        <input
                            type="number"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            placeholder="Stop Loss Level"
                        />
                    </div>

                    {/* 4. Profit Level */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">4. Profit Price</label>
                        <input
                            type="number"
                            value={profitPrice}
                            onChange={(e) => setProfitPrice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="Target Profit Level"
                        />
                    </div>

                    {/* 5. Plan Entry Level */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">5. Plan Entry Price</label>
                        <input
                            type="number"
                            value={planEntryPrice}
                            onChange={(e) => setPlanEntryPrice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Planned Entry"
                        />
                    </div>

                    {/* 6. Actual Entry Level (Optional) */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">6. Actual Entry Price (Optional)</label>
                        <input
                            type="number"
                            value={actualEntryPrice}
                            onChange={(e) => setActualEntryPrice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            placeholder="Filled Price (if active)"
                        />
                    </div>

                    <button
                        onClick={handleGeneratePlan}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-4"
                    >
                        Generate Plan
                    </button>
                </div>
            </div>

            {/* Right Column: Active Plans */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Activity className="text-slate-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-white">Active Trading Plans</h2>
                            <p className="text-slate-400 text-sm">Real-time NegRR Monitoring</p>
                        </div>
                    </div>
                    <div className="text-slate-500 font-mono text-sm px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
                        {negrrPlans.length} Active
                    </div>
                </div>

                {negrrPlans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
                        <h3 className="text-lg font-semibold mb-2">No Active NegRR Plans</h3>
                        <p>Fill out the form on the left to generate a new plan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {negrrPlans.map(plan => (
                            <NegRRPlanCard
                                key={plan.id}
                                plan={plan}
                                onDelete={deletePlan}
                                onUpdate={updatePlan}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
