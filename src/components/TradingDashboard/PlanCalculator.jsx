import { useState, useEffect } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { usePlans } from '../../context/PlanContext';
import { Calculator, AlertCircle } from 'lucide-react';

export default function PlanCalculator() {
    const { instruments } = useInstruments();
    const { addPlan, dailySettings } = usePlans();

    const [formData, setFormData] = useState({
        instrumentId: '',
        siZoneTop: '',
        siZoneBottom: ''
    });

    const [selectedInstrument, setSelectedInstrument] = useState(null);

    // Check if settings are valid
    const isSettingsValid = dailySettings?.riskCapital > 0 && dailySettings?.riskRewardRatio > 0;

    useEffect(() => {
        if (formData.instrumentId) {
            const inst = instruments.find(i => i.id === formData.instrumentId);
            setSelectedInstrument(inst || null);
        }
    }, [formData.instrumentId, instruments]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedInstrument || !isSettingsValid) return;

        const riskCapital = parseFloat(dailySettings.riskCapital);
        const rrRatio = parseFloat(dailySettings.riskRewardRatio);
        const zoneTop = parseFloat(formData.siZoneTop);
        const zoneBottom = parseFloat(formData.siZoneBottom);
        const tickSize = selectedInstrument.tickSize;
        const pointValue = selectedInstrument.pointValue;

        if (!riskCapital || !rrRatio || !zoneTop || !zoneBottom || !tickSize) return;

        // Calculation Logic
        const longEntry = zoneTop + tickSize;
        const longStop = zoneBottom - tickSize;

        const shortEntry = zoneBottom - tickSize;
        const shortStop = zoneTop + tickSize;

        const riskInPoints = longEntry - longStop;

        const contracts = riskCapital / (pointValue * riskInPoints);

        const targetProfitPoints = riskInPoints * rrRatio;

        const targetLong = longEntry + targetProfitPoints;
        const targetShort = shortEntry - targetProfitPoints;

        const newPlan = {
            instrumentSymbol: selectedInstrument.symbol,
            ...formData,
            riskCapital, // Save snapshot of risk used
            riskRewardRatio: rrRatio,
            calculations: {
                longEntry,
                longStop,
                shortEntry,
                shortStop,
                riskInPoints,
                contracts,
                targetProfitPoints,
                targetLong,
                targetShort
            }
        };

        addPlan(newPlan);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isSettingsValid) {
        return (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl h-fit">
                <div className="flex flex-col items-center text-center text-slate-400 gap-3 py-4">
                    <AlertCircle size={32} className="text-amber-500" />
                    <p>Please configure your <strong>Daily Plan Settings</strong> (Risk & R:R) above to start generating trades.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-6 text-cyan-400">
                <Calculator size={24} />
                <h3 className="text-xl font-bold">New Trading Plan</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400">
                    Using Daily Settings: <span className="text-emerald-400 font-mono">${parseFloat(dailySettings.riskCapital).toFixed(2)}</span> Risk, <span className="text-emerald-400 font-mono">{dailySettings.riskRewardRatio}R</span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Instrument</label>
                    <select
                        name="instrumentId"
                        value={formData.instrumentId}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="">Select Instrument...</option>
                        {instruments.map(inst => (
                            <option key={inst.id} value={inst.id}>
                                {inst.symbol} (Tick: {inst.tickSize})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">SI Zone Top Price</label>
                        <input
                            name="siZoneTop"
                            type="number"
                            step="0.000001"
                            value={formData.siZoneTop}
                            onChange={handleChange}
                            placeholder="e.g. 150123.234512"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">SI Zone Bottom Price</label>
                        <input
                            name="siZoneBottom"
                            type="number"
                            step="0.000001"
                            value={formData.siZoneBottom}
                            onChange={handleChange}
                            placeholder="e.g. 150123.000000"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <Calculator size={20} />
                    Generate Plan
                </button>
            </form>
        </div>
    );
}
