import { useState } from 'react';
import { InstrumentProvider } from './context/InstrumentContext';
import { PlanProvider } from './context/PlanContext';
import Layout from './components/Layout';
import InstrumentManager from './components/InstrumentManager/InstrumentManager';
import TradingDashboard from './components/TradingDashboard/TradingDashboard';
import ContractCalculator from './components/ContractCalculator/ContractCalculator';
import ZonePlanCalculator from './components/ContractCalculator/ZonePlanCalculator';
import NegRRManager from './components/NegRR/NegRRManager';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
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
  );
}

export default App;
