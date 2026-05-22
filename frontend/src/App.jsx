import { useState } from 'react';
import ExportView from './components/ExportView';
import JobList from './components/JobList';
import MerchantSetup from './components/MerchantSetup';
import './App.css';

function App() {
  const [merchantId, setMerchantId] = useState(
    localStorage.getItem('merchant_id') || '',
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [view, setView] = useState('home');

  if (!merchantId) {
    return <MerchantSetup onSet={setMerchantId} />;
  }

  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar-left" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">E</div>
          <span className="logo-text">Exportify</span>
        </div>
        <div className="topbar-right">
          <span className="merchant-id">{merchantId}</span>
          <button className="topbar-btn" onClick={() => { localStorage.removeItem('merchant_id'); setMerchantId(''); }}>
            Switch
          </button>
        </div>
      </nav>

      {view === 'home' && (
        <div className="home">
          <div className="home-hero">
            <h1>What would you like to export?</h1>
            <p>Choose a quick template or create a custom export</p>
          </div>

          <div className="templates-grid">
            <div className="template-card" onClick={() => setView('export-orders-7d')}>
              <div className="template-icon orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>
              </div>
              <div className="template-info">
                <h3>Orders — Last 7 days</h3>
                <p>Export recent orders with customer & payment details</p>
              </div>
              <span className="template-arrow">&rsaquo;</span>
            </div>

            <div className="template-card" onClick={() => setView('export-orders-30d')}>
              <div className="template-icon orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <div className="template-info">
                <h3>Orders — Last 30 days</h3>
                <p>Monthly order report with line items & addresses</p>
              </div>
              <span className="template-arrow">&rsaquo;</span>
            </div>

            <div className="template-card" onClick={() => setView('export-orders-all')}>
              <div className="template-icon orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div className="template-info">
                <h3>All Orders</h3>
                <p>Full order history export</p>
              </div>
              <span className="template-arrow">&rsaquo;</span>
            </div>

            <div className="template-card" onClick={() => setView('export-products')}>
              <div className="template-icon products">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div className="template-info">
                <h3>All Products</h3>
                <p>Product catalog with pricing & inventory</p>
              </div>
              <span className="template-arrow">&rsaquo;</span>
            </div>

            <div className="template-card custom" onClick={() => setView('export-custom')}>
              <div className="template-icon custom-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div className="template-info">
                <h3>Custom Export</h3>
                <p>Pick your own columns, filters & format</p>
              </div>
              <span className="template-arrow">&rsaquo;</span>
            </div>
          </div>

          <div className="home-section">
            <div className="section-header">
              <h2>Recent Exports</h2>
              <button className="link-btn" onClick={() => setView('jobs')}>View all</button>
            </div>
            <JobList
              refreshTrigger={refreshTrigger}
              compact
              limit={3}
            />
          </div>
        </div>
      )}

      {view === 'jobs' && (
        <div>
          <button className="back-btn" onClick={() => setView('home')}>&larr; Back</button>
          <JobList refreshTrigger={refreshTrigger} />
        </div>
      )}

      {view.startsWith('export-') && (
        <div>
          <button className="back-btn" onClick={() => setView('home')}>&larr; Back</button>
          <ExportView
            template={view.replace('export-', '')}
            onJobCreated={() => {
              setRefreshTrigger((t) => t + 1);
              setView('jobs');
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
