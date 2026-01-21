import { useState, useMemo } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { usePlans } from '../../context/PlanContext';
import { Calculator, AlertCircle, Plus, ClipboardList } from 'lucide-react';
import PlanCard from '../TradingDashboard/PlanCard';

export default function ContractCalculator() {
    const { instruments } = useInstruments();
    const { dailySettings, plans, addPlan, deletePlan } = usePlans();

    // State
    const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLossPoints, setStopLossPoints] = useState('');

    // Derived Logic
    const riskCapital = dailySettings?.riskCapital || 0;
    const riskRewardRatio = dailySettings?.riskRewardRatio || 3;
    const selectedInstrument = instruments.find(i => i.id === selectedInstrumentId);

    const calculation = useMemo(() => {
        if (!selectedInstrument || !stopLossPoints || riskCapital <= 0) return null;

        const stopPoints = parseFloat(stopLossPoints);
        if (isNaN(stopPoints) || stopPoints <= 0) return null;

        const riskPerContract = stopPoints * selectedInstrument.pointValue;
        const maxContracts = riskCapital / riskPerContract;

        return {
            riskPerContract,
            maxContracts: maxContracts
        };
    }, [selectedInstrument, stopLossPoints, riskCapital]);

    const handleGeneratePlan = () => {
        if (!selectedInstrument || !calculation || !entryPrice) return;

        const price = parseFloat(entryPrice);
        const stopPts = parseFloat(stopLossPoints);

        // Construct Plan Object (Simulating Zone of 0 Height at Entry Price)
        const newPlan = {
            instrumentId: selectedInstrument.id,
            instrumentSymbol: selectedInstrument.symbol,
            riskCapital: riskCapital,
            riskRewardRatio: riskRewardRatio,

            // "Pseudo-Zone" for reference, though not strictly used
            siZoneTop: price,
            siZoneBottom: price,

            calculations: {
                // Shared
                contracts: calculation.maxContracts,
                riskInPoints: stopPts,
                targetProfitPoints: stopPts * riskRewardRatio,

                // Long Scenario
                longEntry: price,
                longStop: price - stopPts,
                targetLong: price + (stopPts * riskRewardRatio),

                // Short Scenario
                shortEntry: price,
                shortStop: price + stopPts,
                targetShort: price - (stopPts * riskRewardRatio)
            }
        };

        addPlan(newPlan);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Box: Calculator */}
            <div className="lg:col-span-4 xl:col-span-3">
                <div className="sticky top-24 space-y-6">
                    <div className="flex items-center gap-3">
                        <Calculator className="text-purple-400" size={32} />
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Calculator
                            </h2>
                            <p className="text-slate-400 text-xs">Rapid Position Sizing</p>
                        </div>
                    </div>

                    {/* Risk Warning if 0 */}
                    {riskCapital <= 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-amber-500 font-semibold text-sm">Global Risk Not Set</h3>
                                <p className="text-amber-400/80 text-xs mt-1">
                                    Set Daily Risk in <b>Trading Plans</b> first.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Input Section */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm shadow-xl space-y-4">
                        {/* Instrument Selector */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Instrument</label>
                            <select
                                value={selectedInstrumentId}
                                onChange={(e) => setSelectedInstrumentId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                            >
                                <option value="">-- Choose Future --</option>
                                {instruments.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.symbol} (Pt Value: ${inst.pointValue})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Entry Price Input (New) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Entry Price (For Plan)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={entryPrice}
                                    onChange={(e) => setEntryPrice(e.target.value)}
                                    placeholder="e.g. 15250.50"
                                    step="0.01"
                                    disabled={!selectedInstrument || riskCapital <= 0}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Stop Loss Input */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Stop Loss (Points)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={stopLossPoints}
                                    onChange={(e) => setStopLossPoints(e.target.value)}
                                    placeholder="e.g. 10.5"
                                    step="0.01"
                                    disabled={!selectedInstrument || riskCapital <= 0}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                                />
                                <span className="absolute right-3 top-3.5 text-slate-500 text-sm">pts</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
                        {!calculation ? (
                            <div className="text-center text-slate-500 py-4">
                                <p className="text-sm">Enter parameters to allow calculation...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative z-10">
                                {/* Contract Result */}
                                <div className="text-center">
                                    <span className="text-sm text-purple-400 font-medium tracking-wide uppercase">Max Position Size</span>
                                    <div className="text-4xl font-bold text-white mt-2 font-mono tracking-tight drop-shadow-lg">
                                        {calculation.maxContracts.toFixed(2)}
                                        <span className="text-lg text-slate-500 ml-2 font-sans font-normal">Conts</span>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={!entryPrice}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={20} />
                                    Generate Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Active Plans (Mirrored from Dashboard) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-slate-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-white">Active Trading Plans</h2>
                            <p className="text-slate-400 text-sm">Generated from Calculator & Dashboard</p>
                        </div>
                    </div>
                    <div className="text-slate-500 font-mono text-sm px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
                        {plans.length} Active
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
                        <h3 className="text-lg font-semibold mb-2">No Active Plans</h3>
                        <p>Generate a plan from the calculator to see it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <PlanCard key={plan.id} plan={plan} onDelete={deletePlan} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
