import { useState } from 'react';
import { LayoutDashboard, Database, Settings, Calculator, BoxSelect, Target } from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children, activeTab, onTabChange }) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-cyan-500/30">
            <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
                                FA
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                FutureArchitect
                            </span>
                        </div>

                        <div className="flex space-x-1">
                            <NavButton
                                active={activeTab === 'dashboard'}
                                onClick={() => onTabChange('dashboard')}
                                icon={<LayoutDashboard size={18} />}
                                label="Trading Plans"
                            />
                            <NavButton
                                active={activeTab === 'instruments'}
                                onClick={() => onTabChange('instruments')}
                                icon={<Database size={18} />}
                                label="Instruments"
                            />
                            <NavButton
                                active={activeTab === 'calculator'}
                                onClick={() => onTabChange('calculator')}
                                icon={<Calculator size={18} />}
                                label="Calculator"
                            />
                            <NavButton
                                active={activeTab === 'zoneplanner'}
                                onClick={() => onTabChange('zoneplanner')}
                                icon={<BoxSelect size={18} />}
                                label="Zone Plan"
                            />
                            <NavButton
                                active={activeTab === 'negrr'}
                                onClick={() => onTabChange('negrr')}
                                icon={<Target size={18} />}
                                label="NegRR Plan"
                            />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

function NavButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
