import { useState, useEffect } from 'react';
import ColumnSelector from './ColumnSelector';
import { api } from '../utils/api';

function getDateFromPreset(preset) {
  if (!preset) return { from: '', to: '' };
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const from = new Date(now);
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  return { from: from.toISOString().split('T')[0], to };
}

const QUICK_FILTERS = [
  { id: 'orders-7d', label: 'Orders — Last 7 days', entity: 'orders', datePreset: '7d' },
  { id: 'orders-30d', label: 'Orders — Last 30 days', entity: 'orders', datePreset: '30d' },
  { id: 'orders-all', label: 'All Orders', entity: 'orders', datePreset: '' },
  { id: 'products-all', label: 'All Products', entity: 'products', datePreset: '' },
];

const ORDER_FILTERS = [
  { value: 'status', label: 'Order Status', options: ['open', 'cancelled', 'archived'] },
  { value: 'financial_status', label: 'Payment Status', options: ['paid', 'pending', 'refunded', 'partially_paid', 'voided'] },
  { value: 'fulfillment_status', label: 'Fulfillment', options: ['fulfilled', 'unfulfilled', 'partial'] },
];

export default function ExportView({ onJobCreated }) {
  const [entity, setEntity] = useState('orders');
  const [columns, setColumns] = useState([]);
  const [format, setFormat] = useState('xlsx');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [financialFilter, setFinancialFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeQuick, setActiveQuick] = useState('');

  const applyQuickFilter = (qf) => {
    setActiveQuick(qf.id);
    setEntity(qf.entity);
    setColumns([]);
    setStatusFilter('');
    setFinancialFilter('');
    setFulfillmentFilter('');
    if (qf.datePreset) {
      setDatePreset(qf.datePreset);
      const dates = getDateFromPreset(qf.datePreset);
      setDateFrom(dates.from);
      setDateTo(dates.to);
    } else {
      setDatePreset('');
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    setActiveQuick('');
    const dates = getDateFromPreset(preset);
    setDateFrom(dates.from);
    setDateTo(dates.to);
  };

  const handleExport = async () => {
    setError('');
    setCreating(true);
    try {
      const filters = [];
      if (dateFrom) filters.push({ field: 'created_at_min', value: dateFrom });
      if (dateTo) filters.push({ field: 'created_at_max', value: dateTo });
      if (statusFilter) filters.push({ field: 'status', value: statusFilter });
      if (financialFilter) filters.push({ field: 'financial_status', value: financialFilter });
      if (fulfillmentFilter) filters.push({ field: 'fulfillment_status', value: fulfillmentFilter });

      await api.createExport({
        format,
        sheets: [{
          entity,
          columns: columns.length > 0 ? columns : undefined,
          filters,
        }],
      });
      onJobCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="export-view">
      {/* Quick Filters */}
      <div className="quick-section">
        <label className="section-label">Quick Export</label>
        <div className="quick-pills">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.id}
              className={`quick-pill ${activeQuick === qf.id ? 'active' : ''}`}
              onClick={() => applyQuickFilter(qf)}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider"><span>or configure manually</span></div>

      {/* Entity + Format row */}
      <div className="row-config">
        <div className="config-section flex-1">
          <label className="section-label">Data Type</label>
          <div className="entity-pills">
            <button className={entity === 'orders' ? 'entity-pill active' : 'entity-pill'} onClick={() => { setEntity('orders'); setColumns([]); setActiveQuick(''); }}>Orders</button>
            <button className={entity === 'products' ? 'entity-pill active' : 'entity-pill'} onClick={() => { setEntity('products'); setColumns([]); setActiveQuick(''); }}>Products</button>
          </div>
        </div>
        <div className="config-section">
          <label className="section-label">Format</label>
          <div className="format-toggle">
            <button className={format === 'xlsx' ? 'active' : ''} onClick={() => setFormat('xlsx')}>Excel</button>
            <button className={format === 'csv' ? 'active' : ''} onClick={() => setFormat('csv')}>CSV</button>
          </div>
        </div>
      </div>

      {/* Date Range */}
      {entity === 'orders' && (
        <div className="config-section">
          <label className="section-label">Date Range</label>
          <div className="date-presets">
            {[['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['', 'All time']].map(([val, label]) => (
              <button key={val} className={datePreset === val ? 'date-pill active' : 'date-pill'} onClick={() => handleDatePreset(val)}>
                {label}
              </button>
            ))}
          </div>
          <div className="date-inputs">
            <div className="date-field">
              <label>From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); setActiveQuick(''); }} />
            </div>
            <div className="date-field">
              <label>To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset('custom'); setActiveQuick(''); }} />
            </div>
          </div>
        </div>
      )}

      {/* Status Filters */}
      {entity === 'orders' && (
        <div className="config-section">
          <label className="section-label">Filters</label>
          <div className="filter-grid">
            {ORDER_FILTERS.map((f) => (
              <div key={f.value} className="filter-select">
                <label>{f.label}</label>
                <select
                  value={f.value === 'status' ? statusFilter : f.value === 'financial_status' ? financialFilter : fulfillmentFilter}
                  onChange={(e) => {
                    setActiveQuick('');
                    if (f.value === 'status') setStatusFilter(e.target.value);
                    else if (f.value === 'financial_status') setFinancialFilter(e.target.value);
                    else setFulfillmentFilter(e.target.value);
                  }}
                >
                  <option value="">All</option>
                  {f.options.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="config-section">
        <div className="section-label-row">
          <label className="section-label">Columns</label>
          <button className="toggle-link" onClick={() => setShowColumns(!showColumns)}>
            {showColumns ? 'Hide columns' : 'Customize columns'}
          </button>
        </div>
        {!showColumns && (
          <p className="columns-summary">
            {columns.length > 0 ? `${columns.length} columns selected` : 'All default columns will be exported'}
          </p>
        )}
        {showColumns && (
          <ColumnSelector entity={entity} selected={columns} onChange={setColumns} />
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button className="export-btn" onClick={handleExport} disabled={creating}>
        {creating ? (
          <span className="btn-loading">
            <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Starting export...
          </span>
        ) : (
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to {format.toUpperCase()}
          </span>
        )}
      </button>
    </div>
  );
}
