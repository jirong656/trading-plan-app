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
        const cleanUrl = sheetUrl.trim();

        const fetchWithFallback = async (url) => {
            const errors = [];

            // Attempt 1: Direct Fetch
            try {
                const response = await fetch(url);
                if (response.ok) return await response.text();
                errors.push(`Direct: ${response.status}`);
            } catch (e) {
                errors.push(`Direct: ${e.message}`);
            }

            // Attempt 2: AllOrigins Proxy
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) return await response.text();
                errors.push(`AllOrigins: ${response.status}`);
            } catch (e) {
                errors.push(`AllOrigins: ${e.message}`);
            }

            // Attempt 3: CORSProxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                if (response.ok) return await response.text();
                errors.push(`CORSProxy: ${response.status}`);
            } catch (e) {
                errors.push(`CORSProxy: ${e.message}`);
            }

            // Attempt 4: CodeTabs (Very Reliable)
            try {
                const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) return await response.text();
                errors.push(`CodeTabs: ${response.status}`);
            } catch (e) {
                errors.push(`CodeTabs: ${e.message}`);
            }

            const errorMsg = errors.join('\n');
            if (errorMsg.includes('401') || errorMsg.includes('403')) {
                throw new Error(`Access Denied (401/403).\nIs your Sheet published to "Anyone" or just "Your Organization"?\n\nDetails:\n${errorMsg}`);
            }
            throw new Error(`Sync Failed. Details:\n${errorMsg}`);
        };

        try {
            const text = await fetchWithFallback(cleanUrl);

            // Check if user provided a standard Google Sheet link (HTML) instead of CSV
            // Also detection for JSON responses if proxies fail to unwrap
            if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('docs-chrome') || text.trim().startsWith('{')) {
                throw new Error(`Incorrect Link Type. Received HTML/JSON instead of CSV.\nPreview: "${text.substring(0, 100)}..."`);
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
