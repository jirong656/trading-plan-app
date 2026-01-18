import { useState, useMemo } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { usePlans } from '../../context/PlanContext';
import { Calculator, AlertCircle, ArrowRight } from 'lucide-react';

export default function ContractCalculator() {
    const { instruments } = useInstruments();
    const { dailySettings } = usePlans();

    // State
    const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
    const [stopLossPoints, setStopLossPoints] = useState('');

    // Derived Logic
    const riskCapital = dailySettings?.riskCapital || 0;
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

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Calculator className="text-purple-400" size={32} />
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Contract Calculator
                    </h2>
                    <p className="text-slate-400 text-sm">Rapid position sizing based on your Global Risk (${riskCapital.toFixed(2)}).</p>
                </div>
            </div>

            {/* Risk Warning if 0 */}
            {riskCapital <= 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-amber-500 font-semibold text-sm">Global Risk Not Set</h3>
                        <p className="text-amber-400/80 text-xs mt-1">
                            Please go to the <b>Trading Plans</b> tab and set your Daily Risk Capital first.
                            The calculator needs this to determine your position size.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm shadow-xl h-full">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Parameters</h3>

                    <div className="space-y-4">
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
                </div>

                {/* Results Section */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    {!calculation ? (
                        <div className="text-center text-slate-500 py-8">
                            <Calculator size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Enter parameters to allow calculation...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {/* Contract Result */}
                            <div className="text-center">
                                <span className="text-sm text-purple-400 font-medium tracking-wide uppercase">Max Position Size</span>
                                <div className="text-5xl font-bold text-white mt-2 font-mono tracking-tight drop-shadow-lg">
                                    {calculation.maxContracts.toFixed(2)}
                                    <span className="text-lg text-slate-500 ml-2 font-sans font-normal">Conts</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-700/50 w-full"></div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-500 block mb-1">Risk per Contract</span>
                                    <span className="text-xl font-mono text-slate-200">
                                        ${calculation.riskPerContract.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 block mb-1">Total Risk Used</span>
                                    <span className="text-xl font-mono text-emerald-400">
                                        ${riskCapital.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
