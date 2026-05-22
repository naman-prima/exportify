import { useState } from 'react';
import ColumnSelector from './ColumnSelector';
import { api } from '../utils/api';

const ENTITIES = [
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
];

const ORDER_FILTERS = [
  { value: 'status', label: 'Status (open / cancelled / archived)', type: 'text' },
  { value: 'financial_status', label: 'Financial Status (paid / pending / refunded)', type: 'text' },
  { value: 'fulfillment_status', label: 'Fulfillment (fulfilled / unfulfilled)', type: 'text' },
  { value: 'search', label: 'Search (order #, email, phone)', type: 'text' },
  { value: 'created_at_min', label: 'Created After (date)', type: 'date' },
  { value: 'created_at_max', label: 'Created Before (date)', type: 'date' },
];

const PRODUCT_FILTERS = [
  { value: 'status', label: 'Status (active / draft / archived)' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'search', label: 'Search (title)' },
];

export default function ExportForm({ onJobCreated }) {
  const [sheets, setSheets] = useState([{ entity: 'orders', columns: [], filters: [] }]);
  const [format, setFormat] = useState('xlsx');
  const [fileName, setFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const addSheet = () => {
    const used = sheets.map((s) => s.entity);
    const next = ENTITIES.find((e) => !used.includes(e.value));
    if (next) setSheets([...sheets, { entity: next.value, columns: [], filters: [] }]);
  };

  const removeSheet = (idx) => setSheets(sheets.filter((_, i) => i !== idx));

  const updateSheet = (idx, key, value) =>
    setSheets(sheets.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));

  const addFilter = (idx) => {
    const s = sheets[idx];
    updateSheet(idx, 'filters', [...s.filters, { field: '', value: '' }]);
  };

  const updateFilter = (si, fi, key, value) => {
    const s = sheets[si];
    updateSheet(si, 'filters', s.filters.map((f, i) => (i === fi ? { ...f, [key]: value } : f)));
  };

  const removeFilter = (si, fi) => {
    const s = sheets[si];
    updateSheet(si, 'filters', s.filters.filter((_, i) => i !== fi));
  };

  const handleExport = async () => {
    setError('');
    setCreating(true);
    try {
      const body = {
        format,
        fileName: fileName || undefined,
        sheets: sheets.map((s) => ({
          entity: s.entity,
          columns: s.columns.length > 0 ? s.columns : undefined,
          filters: s.filters.filter((f) => f.field && f.value),
        })),
      };
      await api.createExport(body);
      onJobCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="export-form">
      <div className="form-top">
        <h2>New Export</h2>
        <div className="format-pills">
          <button className={`format-pill ${format === 'xlsx' ? 'active' : ''}`} onClick={() => setFormat('xlsx')}>Excel</button>
          <button className={`format-pill ${format === 'csv' ? 'active' : ''}`} onClick={() => setFormat('csv')}>CSV</button>
        </div>
      </div>

      <div className="form-field">
        <label>File Name</label>
        <input type="text" placeholder="e.g. orders-may-2026 (optional)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
      </div>

      {sheets.map((sheet, idx) => (
        <div key={idx} className="sheet-card">
          <div className="sheet-card-header">
            <select className="sheet-entity-select" value={sheet.entity} onChange={(e) => updateSheet(idx, 'entity', e.target.value)}>
              {ENTITIES.map((ent) => (
                <option key={ent.value} value={ent.value}>{ent.label}</option>
              ))}
            </select>
            {sheets.length > 1 && (
              <button className="btn-remove" onClick={() => removeSheet(idx)}>Remove</button>
            )}
          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">
              <span>Columns</span>
            </div>
            <ColumnSelector
              entity={sheet.entity}
              selected={sheet.columns}
              onChange={(cols) => updateSheet(idx, 'columns', cols)}
            />
          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">
              <span>Filters</span>
              <button className="btn-link" onClick={() => addFilter(idx)}>+ Add</button>
            </div>
            {sheet.filters.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 0' }}>No filters — all items will be exported</div>
            )}
            {sheet.filters.map((f, fi) => {
              const filterDefs = sheet.entity === 'orders' ? ORDER_FILTERS : PRODUCT_FILTERS;
              const filterDef = filterDefs.find((fd) => fd.value === f.field);
              const inputType = filterDef?.type === 'date' ? 'date' : 'text';
              return (
                <div key={fi} className="filter-row">
                  <select value={f.field} onChange={(e) => updateFilter(idx, fi, 'field', e.target.value)}>
                    <option value="">Select field...</option>
                    {filterDefs.map((ff) => (
                      <option key={ff.value} value={ff.value}>{ff.label}</option>
                    ))}
                  </select>
                  <input type={inputType} placeholder={inputType === 'date' ? '' : 'Value'} value={f.value} onChange={(e) => updateFilter(idx, fi, 'value', e.target.value)} />
                  <button className="btn-remove-sm" onClick={() => removeFilter(idx, fi)}>x</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {sheets.length < ENTITIES.length && (
        <button className="btn-add-sheet" onClick={addSheet}>+ Add another sheet</button>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-export" onClick={handleExport} disabled={creating}>
        {creating ? 'Starting export...' : 'Start Export'}
      </button>
    </div>
  );
}
