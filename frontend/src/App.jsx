import { useState } from 'react';
import ExportView from './components/ExportView';
import JobList from './components/JobList';
import MerchantSetup from './components/MerchantSetup';
import './App.css';

function App() {
  const [merchantId, setMerchantId] = useState(() => {
    // Check URL params first (from OAuth redirect or platform embed)
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('merchant_id');
    if (fromUrl) {
      localStorage.setItem('merchant_id', fromUrl);
      return fromUrl;
    }
    return localStorage.getItem('merchant_id') || '';
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('export');

  if (!merchantId) {
    return <MerchantSetup onSet={setMerchantId} />;
  }

  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar-left">
          <div className="logo-icon">E</div>
          <span className="logo-text">Exportify</span>
        </div>
        <div className="topbar-tabs">
          <button className={activeTab === 'export' ? 'tab active' : 'tab'} onClick={() => setActiveTab('export')}>New Export</button>
          <button className={activeTab === 'jobs' ? 'tab active' : 'tab'} onClick={() => setActiveTab('jobs')}>All Jobs</button>
        </div>
        <div className="topbar-right">
          <span className="merchant-id">{merchantId}</span>
          <button className="topbar-btn" onClick={() => { localStorage.removeItem('merchant_id'); setMerchantId(''); }}>
            Switch
          </button>
        </div>
      </nav>

      {activeTab === 'export' && (
        <ExportView
          template="custom"
          onJobCreated={() => {
            setRefreshTrigger((t) => t + 1);
            setActiveTab('jobs');
          }}
        />
      )}

      {activeTab === 'jobs' && (
        <div style={{ padding: '20px 24px' }}>
          <JobList refreshTrigger={refreshTrigger} />
        </div>
      )}
    </div>
  );
}

export default App;
