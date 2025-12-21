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
        const rawUrl = sheetUrl.trim();

        // Extract Document ID and GID
        const idMatch = rawUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = rawUrl.match(/[#&]gid=([0-9]+)/);
        const docId = idMatch ? idMatch[1] : null;
        const gid = gidMatch ? gidMatch[1] : '0';

        // Generate candidate endpoints
        // 1. Original Provided URL
        // 2. Export URL (if it's a standard sheet ID)
        // 3. GViz Query URL (often bypasses consent)
        const candidates = [rawUrl];
        if (docId && !rawUrl.includes('/d/e/')) {
            candidates.push(`https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`);
            candidates.push(`https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        }

        const proxies = [
            { name: 'Direct', wrap: (url) => url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() },
            { name: 'CodeTabs', wrap: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
            { name: 'AllOrigins', wrap: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
            { name: 'CORSProxy.io', wrap: (url) => `https://corsproxy.io/?` + encodeURIComponent(url) },
            { name: 'ThingProxy', wrap: (url) => `https://thingproxy.freeboard.io/fetch/${url}` }
        ];

        const isValidCsv = (text) => {
            const t = text.trim();
            if (!t || t.length < 10) return false;
            if (t.startsWith('<!DOCTYPE') || t.includes('<html') || t.startsWith('{')) return false;
            const firstLine = t.split('\n')[0];
            return firstLine.includes(',') || firstLine.includes('\t');
        };

        const errors = [];
        let successData = null;

        // Matrix Try: Each Candidate URL x Each Proxy
        for (const url of candidates) {
            for (const proxy of proxies) {
                try {
                    const finalUrl = proxy.wrap(url);
                    const response = await fetch(finalUrl);
                    if (response.ok) {
                        const text = await response.text();
                        if (isValidCsv(text)) {
                            successData = text;
                            break;
                        } else {
                            errors.push(`${proxy.name}: Received HTML/Invalid (Length: ${text.length})`);
                        }
                    } else {
                        errors.push(`${proxy.name}: HTTP ${response.status}`);
                    }
                } catch (e) {
                    errors.push(`${proxy.name}: ${e.message}`);
                }
            }
            if (successData) break;
        }

        try {
            if (!successData) {
                const combinedErrors = [...new Set(errors)].join(' | ');
                throw new Error(`Mobile Sync Blocked. Tried ${candidates.length} modes x ${proxies.length} proxies.\nMost likely: Google Consent Wall.\n\nDetails:\n${combinedErrors.substring(0, 300)}...`);
            }

            const text = successData;
            const lines = text.split('\n');
            const newInstruments = [];

            // Skip header (handle both \r\n and \n)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Handle CSV split (simple split by comma)
                const parts = line.split(',');
                if (parts.length < 2) continue;

                // Map based on expected order from Export:
                // Symbol,TickSize,TickValue,TickPerPoint,PointValue,IcebergThreshold,StopThreshold
                const [symbol, tickSize, tickValue, tickPerPoint, pointValue, icebergThreshold, stopThreshold] = parts;

                if (symbol && tickSize) {
                    newInstruments.push({
                        id: crypto.randomUUID(), // New IDs generated on each sync
                        symbol: symbol.trim(),
                        tickSize: parseFloat(tickSize),
                        tickValue: parseFloat(tickValue),
                        tickPerPoint: parseFloat(tickPerPoint),
                        pointValue: parseFloat(pointValue),
                        icebergThreshold: parseFloat(icebergThreshold) || 0,
                        stopThreshold: parseFloat(stopThreshold) || 0
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

    return (
        <InstrumentContext.Provider value={{
            instruments,
            addInstrument,
            updateInstrument,
            deleteInstrument,
            sheetUrl,
            setSheetUrl,
            isReadOnly,
            syncFromSheet
        }}>
            {children}
        </InstrumentContext.Provider>
    );
}

export const useInstruments = () => useContext(InstrumentContext);
