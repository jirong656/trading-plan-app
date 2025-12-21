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
            let lastError;

            // Attempt 1: Direct Fetch
            try {
                const response = await fetch(url);
                if (response.ok) return await response.text();
                lastError = `Direct: ${response.status}`;
            } catch (e) {
                console.warn("Direct fetch failed", e);
                lastError = `Direct: ${e.message}`;
            }

            // Attempt 2: AllOrigins Proxy
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) return await response.text();
                lastError = `AllOrigins: ${response.status}`;
            } catch (e) {
                console.warn("AllOrigins failed", e);
                lastError = `AllOrigins: ${e.message}`;
            }

            // Attempt 3: CORSProxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                if (response.ok) return await response.text();
                lastError = `CORSProxy: ${response.status}`;
            } catch (e) {
                console.warn("CORSProxy failed", e);
                lastError = `CORSProxy: ${e.message}`;
            }

            throw new Error(`All methods failed. Last error: ${lastError}`);
        };

        try {
            const text = await fetchWithFallback(cleanUrl);

            // Check if user provided a standard Google Sheet link (HTML) instead of CSV
            if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('docs-chrome')) {
                throw new Error('Incorrect Link Type. Please use the "Publish to Web" > "CSV" link.');
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
