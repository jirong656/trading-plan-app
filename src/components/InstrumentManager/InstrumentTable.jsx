import { useInstruments } from '../../context/InstrumentContext';
import { Edit2, Trash2 } from 'lucide-react';

export default function InstrumentTable({ onEdit, isReadOnly }) {
    const { instruments, deleteInstrument } = useInstruments();

    if (instruments.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-500">No instruments found. {isReadOnly ? 'Sync from Google Sheets to get started.' : 'Add one to get started.'}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-xl bg-slate-800/30 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-900/80 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Symbol</th>
                        <th className="p-4 font-semibold">Tick Size</th>
                        <th className="p-4 font-semibold">Tick Value</th>
                        <th className="p-4 font-semibold">Tick/Point</th>
                        <th className="p-4 font-semibold">Point Value</th>
                        <th className="p-4 font-semibold">Iceberg</th>
                        <th className="p-4 font-semibold">Stop</th>
                        {!isReadOnly && <th className="p-4 font-semibold text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {instruments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="p-4 font-bold text-cyan-400">{inst.symbol}</td>
                            <td className="p-4 font-mono text-slate-300">{inst.tickSize?.toFixed(7)}</td>
                            <td className="p-4 font-mono text-slate-300">{inst.tickValue?.toFixed(7)}</td>
                            <td className="p-4 font-mono text-slate-300">{inst.tickPerPoint?.toFixed(7)}</td>
                            <td className="p-4 font-mono text-emerald-400 font-semibold">{inst.pointValue?.toFixed(7)}</td>
                            <td className="p-4 font-mono text-slate-300">{inst.icebergThreshold}</td>
                            <td className="p-4 font-mono text-slate-300">{inst.stopThreshold}</td>
                            {!isReadOnly && (
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(inst)}
                                            className="p-2 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete instrument?')) deleteInstrument(inst.id);
                                            }}
                                            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
