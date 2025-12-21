import { useState } from 'react';
import InstrumentTable from './InstrumentTable';
import InstrumentForm from './InstrumentForm';
import { Plus, Download, Upload, RefreshCw, Link } from 'lucide-react';
import { useInstruments } from '../../context/InstrumentContext';

export default function InstrumentManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingInstrument, setEditingInstrument] = useState(null);
    const { instruments, addInstrument, isReadOnly, sheetUrl, setSheetUrl, syncFromSheet } = useInstruments();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleEdit = (inst) => {
        if (isReadOnly) return;
        setEditingInstrument(inst);
        setIsFormOpen(true);
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setEditingInstrument(null);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncFromSheet();
        setIsSyncing(false);
        if (result?.success) {
            alert(`Synced ${result.count} instruments successfully!`);
        } else if (result?.error) {
            alert(`Sync Failed: ${result.error}`);
        }
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Symbol,TickSize,TickValue,TickPerPoint,PointValue,IcebergThreshold,StopThreshold\n"
            + instruments.map(i => `${i.symbol},${i.tickSize},${i.tickValue},${i.tickPerPoint},${i.pointValue},${i.icebergThreshold},${i.stopThreshold}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "instruments.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Simple import handler (could be improved)
    // Disabled in Read-Only mode effectively by not showing the button/input logic or just checking isReadOnly
    const handleImport = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n');
            lines.slice(1).forEach(line => {
                if (!line) return;
                const [symbol, tickSize, tickValue, tickPerPoint, pointValue, icebergThreshold, stopThreshold] = line.split(',');
                if (symbol && tickSize) {
                    addInstrument({
                        symbol: symbol.trim(),
                        tickSize: parseFloat(tickSize),
                        tickValue: parseFloat(tickValue),
                        tickPerPoint: parseFloat(tickPerPoint),
                        pointValue: parseFloat(pointValue),
                        icebergThreshold: parseFloat(icebergThreshold),
                        stopThreshold: parseFloat(stopThreshold)
                    });
                }
            });
            alert('Imported successfully!');
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Instrument Database</h2>
                    <p className="text-slate-400 mt-1">Manage future instruments and their contract specs.</p>
                </div>

                {/* Google Sheet Integration */}
                <div className="flex-1 w-full md:w-auto md:max-w-md mx-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input
                                type="text"
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                placeholder="Paste Google Sheet Published CSV URL..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={!sheetUrl || isSyncing}
                            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Sync</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isReadOnly && (
                        <>
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors">
                                <Upload size={18} />
                                <span className="hidden sm:inline">Import CSV</span>
                                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                            </label>
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                                <Download size={18} />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                            {!isFormOpen && (
                                <button
                                    onClick={() => setIsFormOpen(true)}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Instrument
                                </button>
                            )}
                        </>
                    )}
                    {isReadOnly && (
                        <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm rounded-lg flex items-center gap-2">
                            <span>Read-Only Mode (Managed via Sheets)</span>
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen && !isReadOnly && (
                <InstrumentForm onCancel={handleClose} initialData={editingInstrument} />
            )}

            <InstrumentTable onEdit={handleEdit} isReadOnly={isReadOnly} />

            {/* Version Indicator for Debugging */}
            <div className="text-center mt-6 text-slate-600 text-[10px] font-mono opacity-50">
                v1.8 Universal Fallback
            </div>
        </div>
    );
}
