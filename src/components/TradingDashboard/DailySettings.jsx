import { useState, useEffect } from 'react';
import { usePlans } from '../../context/PlanContext';
import { Settings, Save } from 'lucide-react';
import clsx from 'clsx';

export default function DailySettings() {
    const { dailySettings, updateDailySettings } = usePlans();
    const [formData, setFormData] = useState({
        riskCapital: '',
        riskRewardRatio: ''
    });
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (dailySettings) {
            setFormData({
                riskCapital: dailySettings.riskCapital || '',
                riskRewardRatio: dailySettings.riskRewardRatio || ''
            });
        }
    }, [dailySettings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateDailySettings({
            riskCapital: parseFloat(formData.riskCapital),
            riskRewardRatio: parseFloat(formData.riskRewardRatio)
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Settings size={20} />
                    <h3 className="text-lg font-bold">Daily Plan Settings</h3>
                </div>
                {isSaved && <span className="text-emerald-400 text-xs font-semibold animate-pulse">Saved</span>}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Risk Capital ($)</label>
                    <input
                        name="riskCapital"
                        type="number"
                        step="0.01"
                        value={formData.riskCapital}
                        onChange={handleChange}
                        placeholder="850.00"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Target Risk/Reward</label>
                    <input
                        name="riskRewardRatio"
                        type="number"
                        step="0.01"
                        value={formData.riskRewardRatio}
                        onChange={handleChange}
                        placeholder="3.0"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <button
                    type="submit"
                    className={clsx(
                        "h-[42px] px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2",
                        isSaved
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/50"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                    )}
                >
                    <Save size={18} />
                    {isSaved ? 'Saved' : 'Save Settings'}
                </button>
            </form>
        </div>
    );
}
