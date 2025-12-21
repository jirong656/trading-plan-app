import { useState } from 'react';
import InstrumentTable from './InstrumentTable';
import InstrumentForm from './InstrumentForm';
import { Plus, Download, Upload, RefreshCw, Link, Cloud, FileUp } from 'lucide-react';
import { useInstruments } from '../../context/InstrumentContext';

export default function InstrumentManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingInstrument, setEditingInstrument] = useState(null);
    const { instruments, addInstrument, isReadOnly, sheetUrl, setSheetUrl, syncFromSheet, importFromCSV } = useInstruments();
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

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsSyncing(true);
        const result = await importFromCSV(file);
        setIsSyncing(false);

        if (result.success) {
            alert(`Successfully imported ${result.count} instruments from file!`);
        } else {
            alert(`Import Error: ${result.error}`);
        }
        e.target.value = '';
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Instrument Manager
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Manage future instruments and specs.</p>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        id="csvImport"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileImport}
                    />

                    <button
                        onClick={() => document.getElementById('csvImport').click()}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 disabled:opacity-50 text-sm font-medium"
                    >
                        <FileUp size={16} />
                        Import CSV
                    </button>

                    <button
                        onClick={handleSync}
                        disabled={!sheetUrl || isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none text-sm font-medium"
                    >
                        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Sync Cloud"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <Cloud className="text-blue-400" size={20} />
                    <h3 className="text-sm font-semibold text-slate-200">Google Sheets Sync</h3>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Link size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder='Paste "Share" or "Publish to Web" link here'
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            <b>Desktop:</b> Sync works automatically using proxies.
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            <b>Mobile:</b> If "Sync Cloud" fails due to Google blocks, use <b>"Import CSV"</b>.
                        </p>
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-wrap gap-3">
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Instrument
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                )}

                {isReadOnly && (
                    <div className="mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-lg flex items-center gap-2">
                        <span>Read-Only Mode (Managed via Cloud/CSV)</span>
                    </div>
                )}
            </div>

            {isFormOpen && !isReadOnly && (
                <InstrumentForm onCancel={handleClose} initialData={editingInstrument} />
            )}

            <InstrumentTable onEdit={handleEdit} isReadOnly={isReadOnly} />

            <div className="text-center mt-6 text-slate-600 text-[10px] font-mono opacity-50">
                v1.9 Manual Import Fail-safe
            </div>
        </div>
    );
}
