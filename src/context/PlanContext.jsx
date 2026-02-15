import { createContext, useContext, useState, useEffect } from 'react';

const PlanContext = createContext();

export function PlanProvider({ children }) {
    const [plans, setPlans] = useState(() => {
        try {
            const saved = localStorage.getItem('trading_plans');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load plans", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('trading_plans', JSON.stringify(plans));
    }, [plans]);

    const [dailySettings, setDailySettings] = useState(() => {
        try {
            const saved = localStorage.getItem('daily_settings');
            return saved ? JSON.parse(saved) : { riskCapital: '', riskRewardRatio: '' };
        } catch (e) {
            return { riskCapital: '', riskRewardRatio: '' };
        }
    });

    useEffect(() => {
        localStorage.setItem('daily_settings', JSON.stringify(dailySettings));
    }, [dailySettings]);

    const updateDailySettings = (settings) => {
        setDailySettings(prev => ({ ...prev, ...settings }));
    };

    // Safe UUID generator for compatibility
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const addPlan = (plan) => {
        setPlans(prev => [{ ...plan, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    };

    const updatePlan = (id, updatedData) => {
        setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    };

    const deletePlan = (id) => {
        setPlans(prev => prev.filter(p => p.id !== id));
    };

    return (
        <PlanContext.Provider value={{ plans, dailySettings, updateDailySettings, addPlan, updatePlan, deletePlan }}>
            {children}
        </PlanContext.Provider>
    );
}

export const usePlans = () => useContext(PlanContext);
