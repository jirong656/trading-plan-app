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
        let cleanUrl = sheetUrl.trim();

        // INTELLIGENT FIX: Convert standard "Browser Link" to "CSV Export Link"
        // This avoids the 'Publish to Web' redirect issues on mobile
        // Input: .../spreadsheets/d/123XYZ/edit#gid=0
        // Output: .../spreadsheets/d/123XYZ/export?format=csv&gid=0
        const idMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        // Only transform if it's NOT a 'Publish to Web' link (/d/e/) and looks like a standard sheet
        if (idMatch && !cleanUrl.includes('/d/e/')) {
            const docId = idMatch[1];
            let gid = '0';
            const gidMatch = cleanUrl.match(/[#&]gid=([0-9]+)/);
            if (gidMatch) gid = gidMatch[1];

            cleanUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
            console.log("Transformed URL to Export format:", cleanUrl);
        }

        const fetchWithFallback = async (url) => {
            const errors = [];

            // Add cache buster to bypass aggressive ISP/Browser caching
            const bustUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();

            const isValidCsv = (text) => {
                const t = text.trim();
                if (!t) return false;
                if (t.startsWith('<!DOCTYPE') || t.includes('<html') || t.startsWith('{')) return false;
                // Basic CSV check: at least one comma in the first line
                return t.split('\n')[0].includes(',');
            };

            // Attempt 1: Direct Fetch
            try {
                const response = await fetch(bustUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (isValidCsv(text)) return text;
                    errors.push(`Direct: HTML/Auth Page Detected`);
                } else {
                    errors.push(`Direct Error: ${response.status} ${response.statusText}`);
                }
            } catch (e) {
                errors.push(`Direct Fetch: ${e.message}`);
            }

            // Attempt 2: AllOrigins Proxy
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(bustUrl)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (isValidCsv(text)) return text;
                    errors.push(`AllOrigins: HTML Returned`);
                } else {
                    errors.push(`AllOrigins Error: ${response.status}`);
                }
            } catch (e) {
                errors.push(`AllOrigins Fetch: ${e.message}`);
            }

            // Attempt 3: CodeTabs (Fastest)
            try {
                const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(bustUrl)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (isValidCsv(text)) return text;
                    errors.push(`CodeTabs: HTML Returned`);
                } else {
                    errors.push(`CodeTabs Error: ${response.status}`);
                }
            } catch (e) {
                errors.push(`CodeTabs Fetch: ${e.message}`);
            }

            // Attempt 4: CORSProxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(bustUrl);
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (isValidCsv(text)) return text;
                    errors.push(`CORSProxy: HTML Returned`);
                } else {
                    errors.push(`CORSProxy Error: ${response.status}`);
                }
            } catch (e) {
                errors.push(`CORSProxy Fetch: ${e.message}`);
            }

            // Attempt 5: ThingProxy (Last Resort)
            try {
                const proxyUrl = `https://thingproxy.freeboard.io/fetch/${bustUrl}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (isValidCsv(text)) return text;
                    errors.push(`ThingProxy: HTML Returned`);
                } else {
                    errors.push(`ThingProxy Error: ${response.status}`);
                }
            } catch (e) {
                errors.push(`ThingProxy Fetch: ${e.message}`);
            }

            const errorMsg = errors.join('\n');
            // Check for specific common issues
            if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('HTML')) {
                throw new Error(`Connection Blocked (401/403/HTML).\nThis usually means Google is asking for a Login or Cookie Consent.\n\nPRO TIP: Use the "Share" link (Anyone with link) instead of "Publish to Web".\n\nDetails:\n${errorMsg}`);
            }
            throw new Error(`Sync Failed. All 5 methods blocked.\nDetails:\n${errorMsg}`);
        };

        try {
            const text = await fetchWithFallback(cleanUrl);

            // Double check (redundant but safe)
            if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('docs-chrome')) {
                throw new Error(`Integrity Check Failed. Still received HTML.\nPreview: "${text.substring(0, 50)}..."`);
            }

            const lines = text.split('\n');
            const newInstruments = [];

            // Skip header
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
