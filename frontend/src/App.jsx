import { useState } from 'react';
import ExportForm from './components/ExportForm';
import JobList from './components/JobList';
import MerchantSetup from './components/MerchantSetup';
import './App.css';

function App() {
  const [merchantId, setMerchantId] = useState(
    localStorage.getItem('merchant_id') || '',
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('export');

  if (!merchantId) {
    return <MerchantSetup onSet={setMerchantId} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Exportify</h1>
          <span className="merchant-tag">{merchantId}</span>
        </div>
        <nav className="header-nav">
          <button
            className={activeTab === 'export' ? 'active' : ''}
            onClick={() => setActiveTab('export')}
          >
            New Export
          </button>
          <button
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            All Jobs
          </button>
        </nav>
        <button
          className="btn-logout"
          onClick={() => {
            localStorage.removeItem('merchant_id');
            setMerchantId('');
          }}
        >
          Switch Merchant
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'export' && (
          <ExportForm
            onJobCreated={() => {
              setRefreshTrigger((t) => t + 1);
              setActiveTab('jobs');
            }}
          />
        )}
        {activeTab === 'jobs' && <JobList refreshTrigger={refreshTrigger} />}
      </main>
    </div>
  );
}

export default App;
