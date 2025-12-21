import { useState, useEffect } from 'react';
import { useInstruments } from '../../context/InstrumentContext';
import { Plus, Save, X } from 'lucide-react';
import clsx from 'clsx';

export default function InstrumentForm({ onCancel, initialData = null }) {
    const { addInstrument, updateInstrument } = useInstruments();
    const [formData, setFormData] = useState({
        symbol: '',
        tickSize: '',
        tickValue: '',
        tickPerPoint: '',
        icebergThreshold: '',
        stopThreshold: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculatePointValue = () => {
        const tickValue = parseFloat(formData.tickValue) || 0;
        const tickPerPoint = parseFloat(formData.tickPerPoint) || 0;
        return tickValue * tickPerPoint;
    };

    const pointValue = calculatePointValue();

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            tickSize: parseFloat(formData.tickSize),
            tickValue: parseFloat(formData.tickValue),
            tickPerPoint: parseFloat(formData.tickPerPoint),
            pointValue,
            icebergThreshold: parseFloat(formData.icebergThreshold),
            stopThreshold: parseFloat(formData.stopThreshold)
        };

        if (initialData) {
            updateInstrument(initialData.id, data);
        } else {
            addInstrument(data);
        }

        // Reset or close
        setFormData({
            symbol: '',
            tickSize: '',
            tickValue: '',
            tickPerPoint: '',
            icebergThreshold: '',
            stopThreshold: ''
        });
        if (onCancel) onCancel();
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">
                    {initialData ? 'Edit Instrument' : 'Add New Instrument'}
                </h3>
                {onCancel && (
                    <button onClick={onCancel} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Instrument Name (Symbol)" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="e.g. NQ" required />
                    <InputGroup label="Tick Size" name="tickSize" type="number" step="0.000001" value={formData.tickSize} onChange={handleChange} placeholder="0.25" required />
                    <InputGroup label="Tick Value ($)" name="tickValue" type="number" step="0.000001" value={formData.tickValue} onChange={handleChange} placeholder="5.00" required />

                    <InputGroup label="Ticks Per Point" name="tickPerPoint" type="number" step="0.000001" value={formData.tickPerPoint} onChange={handleChange} placeholder="4.0" required />
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Point Value ($)</label>
                        <div className="text-lg font-mono text-emerald-400">${pointValue.toFixed(6)}</div>
                    </div>

                    <InputGroup label="Iceberg Threshold" name="icebergThreshold" type="number" value={formData.icebergThreshold} onChange={handleChange} placeholder="150" />
                    <InputGroup label="Stop Threshold" name="stopThreshold" type="number" value={formData.stopThreshold} onChange={handleChange} placeholder="150" />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                        {initialData ? <Save size={18} /> : <Plus size={18} />}
                        {initialData ? 'Update Instrument' : 'Add Instrument'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function InputGroup({ label, ...props }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <input
                {...props}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
            />
        </div>
    );
}
