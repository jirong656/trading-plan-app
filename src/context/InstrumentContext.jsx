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
                    // Robust line splitting for iOS/Windows/Mac/Linux
                    const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
                    const newInstruments = [];

                    // Aggressive Float Parser: Removes ANYTHING that isn't a number, dot, or minus
                    const parseValidFloat = (val) => {
                        if (!val) return 0;
                        // Strip quotes first
                        let clean = val.toString().replace(/['"]/g, '').trim();
                        // Strip currency and spaces
                        clean = clean.replace(/[$,€£\s]/g, '');
                        // If it's pure NaN text, return 0
                        if (clean.toLowerCase() === 'nan') return 0;

                        const num = parseFloat(clean);
                        return isFinite(num) ? num : 0;
                    };

                    if (lines.length < 2) throw new Error("File is empty or missing headers");

                    // 1. Identify Header Row
                    let headerLine = lines[0].trim();
                    // Remove BOM if present
                    if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.substr(1);

                    const headerRow = headerLine.toLowerCase();

                    // Better Delimiter Detection (Winner takes all)
                    const count = (char) => (headerRow.match(new RegExp(`\\${char}`, 'g')) || []).length;
                    const commas = count(',');
                    const tabs = count('\t');
                    const semis = count(';');

                    let delimiter = ',';
                    if (tabs > commas && tabs > semis) delimiter = '\t';
                    else if (semis > commas && semis > tabs) delimiter = ';';

                    // Normalized headers array
                    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));

                    // 2. Map Headers
                    const getIndex = (keywords) => {
                        return headers.findIndex(h => keywords.some(k => h === k || h.includes(k)));
                    };

                    const map = {
                        symbol: getIndex(['symbol', 'instrument', 'contract']),
                        tickSize: getIndex(['tick size', 'ticksize']),
                        tickValue: getIndex(['tick value', 'tickvalue']),
                        tickPerPoint: getIndex(['tick/point', 'ticks per point', 'tick per point', 'tickperpoint']),
                        pointValue: getIndex(['point value', 'pointvalue', 'point val', 'pt value']),
                        iceberg: getIndex(['iceberg', 'icebergthreshold']),
                        stop: getIndex(['stop', 'stopthreshold'])
                    };



                    if (map.symbol === -1 || map.tickSize === -1) {
                        throw new Error(`Import Error: Missing 'Symbol' or 'Tick Size'.\nFound: [${headers.join(', ')}]`);
                    }

                    // 3. Parse Data Rows
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        const parts = line.split(delimiter);

                        if (parts.length < 2) continue;

                        // Safe extraction with quote stripping for string fields
                        const getStr = (idx) => idx !== -1 && parts[idx] ? parts[idx].replace(/['"]/g, '').trim() : '';
                        // Safe float extraction - check index bounds too
                        const getFloat = (idx) => {
                            if (idx === -1 || idx >= parts.length || !parts[idx]) return 0;
                            return parseValidFloat(parts[idx]);
                        };

                        const symbol = getStr(map.symbol);
                        if (!symbol) continue;

                        newInstruments.push({
                            id: crypto.randomUUID(),
                            symbol: symbol,
                            tickSize: getFloat(map.tickSize),
                            tickValue: getFloat(map.tickValue),
                            tickPerPoint: getFloat(map.tickPerPoint),
                            pointValue: getFloat(map.pointValue),
                            icebergThreshold: getFloat(map.iceberg),
                            stopThreshold: getFloat(map.stop)
                        });
                    }

                    if (newInstruments.length === 0) throw new Error("No valid instruments parsed.");
                    setInstruments(newInstruments);
                    setSheetUrl(''); // Switch to local mode to ensure persistence
                    resolve({ success: true, count: newInstruments.length });
                } catch (err) {
                    console.error("CSV Import Crash:", err);
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
