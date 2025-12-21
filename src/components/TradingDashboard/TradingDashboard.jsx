import { usePlans } from '../../context/PlanContext';
import PlanCalculator from './PlanCalculator';
import PlanCard from './PlanCard';
import DailySettings from './DailySettings';
import { Trash2 } from 'lucide-react';

export default function TradingDashboard() {
    const { plans, deletePlan } = usePlans();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Calculator */}
            <div className="lg:col-span-4 xl:col-span-3">
                <div className="sticky top-24 space-y-6">
                    <DailySettings />
                    <PlanCalculator />
                </div>
            </div>

            {/* Right Column: Active Plans */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Active Trading Plans</h2>
                        <p className="text-slate-400 text-sm">Real-time risk and execution parameters</p>
                    </div>
                    <div className="text-slate-500 font-mono text-sm px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
                        {plans.length} Active Plan{plans.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
                        <h3 className="text-lg font-semibold mb-2">No Active Plans</h3>
                        <p>Use the calculator on the left to generate new trade plans.</p>
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
