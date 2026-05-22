import { useState, useEffect } from 'react';
import ColumnSelector from './ColumnSelector';
import { api } from '../utils/api';

const TEMPLATES = {
  'orders-7d': {
    title: 'Orders — Last 7 Days',
    entity: 'orders',
    datePreset: '7d',
    columns: ['id', 'name', 'order_number', 'email', 'phone', 'created_at', 'status', 'financial_status', 'fulfillment_status', 'currency', 'total_price', 'total_discounts', 'payment_gateway_names', 'payment_method', 'customer_first_name', 'customer_last_name', 'customer_email', 'shipping_city', 'shipping_province', 'shipping_country', 'line_title', 'line_sku', 'line_quantity', 'line_price'],
  },
  'orders-30d': {
    title: 'Orders — Last 30 Days',
    entity: 'orders',
    datePreset: '30d',
    columns: ['id', 'name', 'order_number', 'email', 'phone', 'created_at', 'processed_at', 'status', 'financial_status', 'fulfillment_status', 'currency', 'total_price', 'subtotal_price', 'total_discounts', 'total_tax', 'payment_gateway_names', 'payment_method', 'customer_first_name', 'customer_last_name', 'customer_email', 'customer_phone', 'shipping_first_name', 'shipping_last_name', 'shipping_address1', 'shipping_city', 'shipping_province', 'shipping_zip', 'shipping_country', 'shipping_phone', 'billing_first_name', 'billing_last_name', 'billing_city', 'billing_country', 'line_title', 'line_variant_title', 'line_sku', 'line_quantity', 'line_price', 'line_total_discount', 'line_product_id', 'line_vendor'],
  },
  'orders-all': {
    title: 'All Orders',
    entity: 'orders',
    datePreset: null,
    columns: [],
  },
  'products': {
    title: 'All Products',
    entity: 'products',
    datePreset: null,
    columns: [],
  },
  'custom': {
    title: 'Custom Export',
    entity: 'orders',
    datePreset: null,
    columns: [],
  },
};

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

const ORDER_FILTERS = [
  { value: 'status', label: 'Order Status', options: ['open', 'cancelled', 'archived'] },
  { value: 'financial_status', label: 'Payment Status', options: ['paid', 'pending', 'refunded', 'partially_paid', 'voided'] },
  { value: 'fulfillment_status', label: 'Fulfillment', options: ['fulfilled', 'unfulfilled', 'partial'] },
];

export default function ExportView({ template, onJobCreated }) {
  const config = TEMPLATES[template] || TEMPLATES['custom'];
  const [entity, setEntity] = useState(config.entity);
  const [columns, setColumns] = useState(config.columns);
  const [format, setFormat] = useState('xlsx');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState(config.datePreset || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [financialFilter, setFinancialFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [showColumns, setShowColumns] = useState(template === 'custom' || template === 'orders-all' || template === 'products');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dates = getDateFromPreset(config.datePreset);
    setDateFrom(dates.from);
    setDateTo(dates.to);
  }, []);

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
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

  const isCustom = template === 'custom';

  return (
    <div className="export-view">
      <div className="export-header">
        <h1>{config.title}</h1>
        <div className="format-toggle">
          <button className={format === 'xlsx' ? 'active' : ''} onClick={() => setFormat('xlsx')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Excel
          </button>
          <button className={format === 'csv' ? 'active' : ''} onClick={() => setFormat('csv')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            CSV
          </button>
        </div>
      </div>

      {isCustom && (
        <div className="config-section">
          <label className="section-label">Data Type</label>
          <div className="entity-pills">
            <button className={entity === 'orders' ? 'entity-pill active' : 'entity-pill'} onClick={() => { setEntity('orders'); setColumns([]); }}>Orders</button>
            <button className={entity === 'products' ? 'entity-pill active' : 'entity-pill'} onClick={() => { setEntity('products'); setColumns([]); }}>Products</button>
          </div>
        </div>
      )}

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
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); }} />
            </div>
            <div className="date-field">
              <label>To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset('custom'); }} />
            </div>
          </div>
        </div>
      )}

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

      <div className="config-section">
        <div className="section-label-row">
          <label className="section-label">Columns</label>
          <button className="toggle-link" onClick={() => setShowColumns(!showColumns)}>
            {showColumns ? 'Hide' : 'Customize'}
          </button>
        </div>
        {!showColumns && columns.length > 0 && (
          <p className="columns-summary">{columns.length} columns selected (using template defaults)</p>
        )}
        {!showColumns && columns.length === 0 && (
          <p className="columns-summary">All default columns will be exported</p>
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
