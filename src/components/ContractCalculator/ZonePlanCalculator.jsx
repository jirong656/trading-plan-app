import { useState, useMemo } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { usePlans } from '../../context/PlanContext';
import { BoxSelect, AlertCircle, Plus, ClipboardList } from 'lucide-react';
import PlanCard from '../TradingDashboard/PlanCard';

export default function ZonePlanCalculator() {
    const { instruments } = useInstruments();
    const { dailySettings, plans, addPlan, deletePlan } = usePlans();

    // State
    const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
    const [zoneTop, setZoneTop] = useState('');
    const [zoneBottom, setZoneBottom] = useState('');
    const [riskMultiplier, setRiskMultiplier] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [targetRewardMultiple, setTargetRewardMultiple] = useState('');

    // Derived Logic
    const riskCapital = dailySettings?.riskCapital || 0;
    const globalRR = dailySettings?.riskRewardRatio || 3;
    const selectedInstrument = instruments.find(i => i.id === selectedInstrumentId);

    const calculation = useMemo(() => {
        if (!selectedInstrument || !zoneTop || !zoneBottom || !riskMultiplier || riskCapital <= 0) return null;

        const top = parseFloat(zoneTop);
        const bottom = parseFloat(zoneBottom);
        const mult = parseFloat(riskMultiplier);

        if (isNaN(top) || isNaN(bottom) || isNaN(mult) || top <= bottom) return null;

        const zoneHeight = top - bottom;
        const riskInPoints = zoneHeight * mult;

        if (riskInPoints <= 0) return null;

        const riskPerContract = riskInPoints * selectedInstrument.pointValue;
        const maxContracts = riskCapital / riskPerContract;

        return {
            zoneHeight,
            riskInPoints,
            riskPerContract,
            maxContracts: maxContracts
        };
    }, [selectedInstrument, zoneTop, zoneBottom, riskMultiplier, riskCapital]);

    const handleGeneratePlan = () => {
        if (!selectedInstrument || !calculation) return; // Entry is technically optional based on prompt description, but usually needed for a plan. 
        // Prompt says: "if this field is filled, then the new card will refer to the result of "Risk Pts", output the "Long Plan" and "ShortPlan""
        // So I will make it optional, but if empty, maybe I only store the sizing metrics? 
        // Actually, PlanCard needs specific entry/stops. The prompt implies generating a plan IS dependent on Entry.
        // "if this field [Entry] is filled... output the "Long Plan" and "ShortPlan""
        if (!entryPrice) return;

        const price = parseFloat(entryPrice);
        const rewardMult = targetRewardMultiple ? parseFloat(targetRewardMultiple) : globalRR;
        const riskPts = calculation.riskInPoints;

        const newPlan = {
            instrumentId: selectedInstrument.id,
            instrumentSymbol: selectedInstrument.symbol,
            riskCapital: riskCapital,
            riskRewardRatio: rewardMult,

            // Store Zone for reference
            siZoneTop: parseFloat(zoneTop),
            siZoneBottom: parseFloat(zoneBottom),

            calculations: {
                contracts: calculation.maxContracts,
                riskInPoints: riskPts,
                targetProfitPoints: riskPts * rewardMult,

                // Long Scenario
                longEntry: price,
                longStop: price - riskPts,
                targetLong: price + (riskPts * rewardMult),

                // Short Scenario
                shortEntry: price,
                shortStop: price + riskPts,
                targetShort: price - (riskPts * rewardMult)
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
                        <BoxSelect className="text-cyan-400" size={32} />
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                Zone Plan
                            </h2>
                            <p className="text-slate-400 text-xs">Size by Zone Height</p>
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
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                            >
                                <option value="">-- Choose Future --</option>
                                {instruments.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.symbol} (Pt Value: ${inst.pointValue})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Zone Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Zone Top</label>
                                <input
                                    type="number"
                                    value={zoneTop}
                                    onChange={(e) => setZoneTop(e.target.value)}
                                    placeholder="High"
                                    disabled={!selectedInstrument}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Zone Bottom</label>
                                <input
                                    type="number"
                                    value={zoneBottom}
                                    onChange={(e) => setZoneBottom(e.target.value)}
                                    placeholder="Low"
                                    disabled={!selectedInstrument}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Risk Multiplier */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Risk Multiple <span className="text-slate-500">(Zone Height x this)</span>
                            </label>
                            <input
                                type="number"
                                value={riskMultiplier}
                                onChange={(e) => setRiskMultiplier(e.target.value)}
                                placeholder="e.g. 1.0, 1.5, 0.5"
                                step="0.1"
                                disabled={!selectedInstrument}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                        </div>

                        <div className="h-px bg-slate-700/50 my-2"></div>

                        {/* Optional Plan Inputs */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Entry Price (Optional)</label>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                placeholder="To Generate Plan"
                                disabled={!selectedInstrument}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Reward (Optional R)</label>
                            <input
                                type="number"
                                value={targetRewardMultiple}
                                onChange={(e) => setTargetRewardMultiple(e.target.value)}
                                placeholder={`Default: ${globalRR}`}
                                disabled={!selectedInstrument}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
                        {!calculation ? (
                            <div className="text-center text-slate-500 py-4">
                                <p className="text-sm">Enter Zone & Multiplier...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative z-10">
                                {/* Contract Result */}
                                <div className="text-center">
                                    <span className="text-sm text-cyan-400 font-medium tracking-wide uppercase">Max Position Size</span>
                                    <div className="text-4xl font-bold text-white mt-2 font-mono tracking-tight drop-shadow-lg">
                                        {calculation.maxContracts.toFixed(2)}
                                        <span className="text-lg text-slate-500 ml-2 font-sans font-normal">Conts</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-slate-950/30 rounded p-2">
                                        <div className="text-[10px] text-slate-500 uppercase">Zone Height</div>
                                        <div className="text-lg font-mono text-slate-300">{calculation.zoneHeight.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-slate-950/30 rounded p-2">
                                        <div className="text-[10px] text-slate-500 uppercase">Risk Pts</div>
                                        <div className="text-lg font-mono text-amber-400">{calculation.riskInPoints.toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={!entryPrice}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={20} />
                                    Generate Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Active Plans (Shared list) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-slate-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-white">Active Trading Plans</h2>
                            <p className="text-slate-400 text-sm">Zone & Calculator Generated</p>
                        </div>
                    </div>
                    <div className="text-slate-500 font-mono text-sm px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
                        {plans.length} Active
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
                        <h3 className="text-lg font-semibold mb-2">No Active Plans</h3>
                        <p>Generate a plan to see it here.</p>
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
