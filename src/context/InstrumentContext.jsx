import { createContext, useContext, useState, useEffect } from 'react';

const InstrumentContext = createContext();

export function InstrumentProvider({ children }) {
    const [instruments, setInstruments] = useState(() => {
        try {
            const saved = localStorage.getItem('instruments');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load instruments", e);
            return [];
        }
    });

    const [sheetUrl, setSheetUrl] = useState(() => {
        return localStorage.getItem('sheet_url') || '';
    });

    const isReadOnly = !!sheetUrl;

    useEffect(() => {
        localStorage.setItem('instruments', JSON.stringify(instruments));
    }, [instruments]);

    useEffect(() => {
        localStorage.setItem('sheet_url', sheetUrl);
    }, [sheetUrl]);

    // Auto-sync on load if URL exists
    useEffect(() => {
        if (sheetUrl) {
            syncFromSheet();
        }
    }, []); // Run once on mount

    const addInstrument = (instrument) => {
        if (isReadOnly) return;
        setInstruments(prev => [...prev, { ...instrument, id: crypto.randomUUID() }]);
    };

    const updateInstrument = (id, updatedData) => {
        if (isReadOnly) return;
        setInstruments(prev => prev.map(inst => inst.id === id ? { ...inst, ...updatedData } : inst));
    };

    const deleteInstrument = (id) => {
        if (isReadOnly) return;
        setInstruments(prev => prev.filter(inst => inst.id !== id));
    };

    const syncFromSheet = async () => {
        if (!sheetUrl) return;
        const inputUrl = sheetUrl.trim();

        // BETTER ID EXTRACTION: Handles /d/ID, /d/e/ID, and even direct IDs
        // Matches standard IDs like 1AbCd-EfG... and Published keys like 2PACX-...
        const idMatch = inputUrl.match(/\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/) || inputUrl.match(/id=([a-zA-Z0-9-_]+)/);
        const docId = idMatch ? idMatch[1] : (inputUrl.length > 30 ? inputUrl : null);

        const gidMatch = inputUrl.match(/[#&]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';

        // Generate candidate endpoints
        const candidates = [inputUrl];
        if (docId && docId !== 'e') {
            // Standard export
            candidates.push(`https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`);
            // Account-specific export
            candidates.push(`https://docs.google.com/spreadsheets/u/0/d/${docId}/export?format=csv&gid=${gid}`);
            // GViz (The "Secret" data endpoint)
            candidates.push(`https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`);
            // Publication alias
            candidates.push(`https://docs.google.com/spreadsheets/d/${docId}/pub?output=csv&gid=${gid}`);
        }

        const proxies = [
            { name: 'Direct', wrap: (url) => url + (url.includes('?') ? '&' : '?') + 'cache=' + Date.now() },
            { name: 'CodeTabs', wrap: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
            { name: 'AllOrigins', wrap: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
            { name: 'CORSProxy.io', wrap: (url) => `https://corsproxy.io/?` + encodeURIComponent(url) },
            { name: 'ThingProxy', wrap: (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}` }
        ];

        const isValidCsv = (text) => {
            const t = text.trim();
            if (!t || t.length < 10) return false;
            // Reject obvious HTML
            if (t.toLowerCase().startsWith('<!doctype') || t.toLowerCase().includes('<html')) return false;
            // Reject JSON wrappers if they appear
            if (t.startsWith('{') && t.endsWith('}')) return false;

            const firstLine = t.split('\n')[0];
            // Support comma, tab, or semicolon (Europe)
            return firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';');
        };
        // Helper to parse currency/text to float safely
        const parseValidFloat = (val) => {
            if (!val) return 0;
            // Remove currency symbols, commas, and whitespace
            const clean = val.toString().replace(/[$,€£\s]/g, '');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        };

        const errors = [];
        let successData = null;

        // Try the Matrix
        for (const url of candidates) {
            for (const proxy of proxies) {
                try {
                    const finalUrl = proxy.wrap(url);
                    const response = await fetch(finalUrl, { credentials: 'omit' });
                    if (response.ok) {
                        const text = await response.text();
                        if (isValidCsv(text)) {
                            successData = text;
                            break;
                        } else {
                            errors.push(`${proxy.name}: HTML (Len:${text.length})`);
                        }
                    } else {
                        errors.push(`${proxy.name}: ${response.status}`);
                    }
                } catch (e) {
                    errors.push(`${proxy.name}: Error`);
                }
            }
            if (successData) break;
        }

        try {
            if (!successData) {
                const combinedErrors = [...new Set(errors)].join(' | ');
                throw new Error(`Mobile Sync failed after trying ${candidates.length} URL formats.\n\nRECOMMENDATION: Copy the "SHARE" link from browser and use that.\n\nLOG:\n${combinedErrors.substring(0, 200)}...`);
            }

            const text = successData;
            const lines = text.split('\n');
            const newInstruments = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Detect delimiter
                let parts = [];
                if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(';')) parts = line.split(';');
                else parts = line.split(',');

                if (parts.length < 2) continue;

                const [symbol, tickSize, tickValue, tickPerPoint, pointValue, icebergThreshold, stopThreshold] = parts;

                if (symbol && tickSize) {
                    newInstruments.push({
                        id: crypto.randomUUID(),
                        symbol: symbol.replace(/"/g, '').trim(),
                        tickSize: parseValidFloat(tickSize),
                        tickValue: parseValidFloat(tickValue),
                        tickPerPoint: parseValidFloat(tickPerPoint),
                        pointValue: parseValidFloat(pointValue),
                        icebergThreshold: parseValidFloat(icebergThreshold),
                        stopThreshold: parseValidFloat(stopThreshold)
                    });
                }
            }

            setInstruments(newInstruments);
            return { success: true, count: newInstruments.length };

        } catch (error) {
            console.error("Sync failed", error);
            return { success: false, error: error.message };
        }
    };

    const importFromCSV = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    const newInstruments = [];

                    // Helper to parse currency/text to float safely
                    const parseValidFloat = (val) => {
                        if (!val) return 0;
                        const clean = val.toString().replace(/[$,€£\s]/g, '');
                        const num = parseFloat(clean);
                        return isNaN(num) ? 0 : num;
                    };

                    if (lines.length < 2) throw new Error("File is empty or missing headers");

                    // 1. Identify Header Row
                    const headerRow = lines[0].toLowerCase();
                    let delimiter = ',';
                    if (headerRow.includes('\t')) delimiter = '\t';
                    else if (headerRow.includes(';')) delimiter = ';';

                    const headers = headerRow.split(delimiter).map(h => h.trim().replace(/['"]+/g, ''));

                    // 2. Map Headers to Field Names
                    const map = {
                        symbol: headers.findIndex(h => h.includes('symbol') || h.includes('instrument')),
                        tickSize: headers.findIndex(h => h.includes('tick size')),
                        tickValue: headers.findIndex(h => h.includes('tick value')),
                        tickPerPoint: headers.findIndex(h => h.includes('tick') && h.includes('point') && !h.includes('value')), // matches "tick/point"
                        pointValue: headers.findIndex(h => h.includes('point value')),
                        iceberg: headers.findIndex(h => h.includes('iceberg') || h.includes('threshold')),
                        stop: headers.findIndex(h => h.includes('stop'))
                    };

                    // Check if critical headers are found
                    if (map.symbol === -1 || map.tickSize === -1) {
                        throw new Error("Could not find 'Symbol' or 'Tick Size' columns. Please check CSV headers.");
                    }

                    // 3. Parse Data Rows
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        // Handle quotes if CSV is complex, but simple split for now based on user data
                        const parts = line.split(delimiter);

                        // Skip malformed lines
                        if (parts.length < Math.max(map.symbol, map.tickSize)) continue;

                        const symbol = parts[map.symbol]?.replace(/"/g, '').trim();
                        if (!symbol) continue;

                        newInstruments.push({
                            id: crypto.randomUUID(),
                            symbol: symbol,
                            tickSize: parseValidFloat(parts[map.tickSize]),
                            tickValue: map.tickValue !== -1 ? parseValidFloat(parts[map.tickValue]) : 0,
                            tickPerPoint: map.tickPerPoint !== -1 ? parseValidFloat(parts[map.tickPerPoint]) : 0,
                            pointValue: map.pointValue !== -1 ? parseValidFloat(parts[map.pointValue]) : 0,
                            icebergThreshold: map.iceberg !== -1 ? parseValidFloat(parts[map.iceberg]) : 0,
                            stopThreshold: map.stop !== -1 ? parseValidFloat(parts[map.stop]) : 0
                        });
                    }

                    if (newInstruments.length === 0) throw new Error("No valid instruments found");
                    setInstruments(newInstruments);
                    resolve({ success: true, count: newInstruments.length });
                } catch (err) {
                    console.error("CSV Import Error:", err);
                    resolve({ success: false, error: err.message });
                }
            };
            reader.onerror = () => resolve({ success: false, error: "File read error" });
            reader.readAsText(file);
        });
    };

    return (
        <InstrumentContext.Provider value={{
            instruments,
            addInstrument,
            updateInstrument,
            deleteInstrument,
            sheetUrl,
            setSheetUrl,
            isReadOnly,
            syncFromSheet,
            importFromCSV
        }}>
            {children}
        </InstrumentContext.Provider>
    );
}

export const useInstruments = () => useContext(InstrumentContext);
