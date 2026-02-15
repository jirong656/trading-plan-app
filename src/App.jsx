import { useState } from 'react';
import { InstrumentProvider } from './context/InstrumentContext';
import { PlanProvider } from './context/PlanContext';
import Layout from './components/Layout';
import InstrumentManager from './components/InstrumentManager/InstrumentManager';
import TradingDashboard from './components/TradingDashboard/TradingDashboard';
import ContractCalculator from './components/ContractCalculator/ContractCalculator';
import ZonePlanCalculator from './components/ContractCalculator/ZonePlanCalculator';
import NegRRManager from './components/NegRR/NegRRManager';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/20">
      <ErrorBoundary>
        <InstrumentProvider>
          <PlanProvider>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'dashboard' && <TradingDashboard />}
              {activeTab === 'instruments' && <InstrumentManager />}
              {activeTab === 'calculator' && <ContractCalculator />}
              {activeTab === 'zoneplanner' && <ZonePlanCalculator />}
              {activeTab === 'negrr' && <NegRRManager />}
            </Layout>
          </PlanProvider>
        </InstrumentProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
