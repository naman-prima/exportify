import { useState } from 'react';
import ColumnSelector from './ColumnSelector';
import { api } from '../utils/api';

const ENTITIES = [
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
];

export default function ExportForm({ onJobCreated }) {
  const [sheets, setSheets] = useState([{ entity: 'orders', columns: [], filters: [] }]);
  const [format, setFormat] = useState('xlsx');
  const [fileName, setFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const addSheet = () => {
    const usedEntities = sheets.map((s) => s.entity);
    const next = ENTITIES.find((e) => !usedEntities.includes(e.value));
    if (next) setSheets([...sheets, { entity: next.value, columns: [], filters: [] }]);
  };

  const removeSheet = (idx) => {
    setSheets(sheets.filter((_, i) => i !== idx));
  };

  const updateSheet = (idx, key, value) => {
    setSheets(sheets.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };

  const addFilter = (idx) => {
    const s = sheets[idx];
    updateSheet(idx, 'filters', [...s.filters, { field: '', value: '' }]);
  };

  const updateFilter = (sheetIdx, filterIdx, key, value) => {
    const s = sheets[sheetIdx];
    const newFilters = s.filters.map((f, i) =>
      i === filterIdx ? { ...f, [key]: value } : f,
    );
    updateSheet(sheetIdx, 'filters', newFilters);
  };

  const removeFilter = (sheetIdx, filterIdx) => {
    const s = sheets[sheetIdx];
    updateSheet(sheetIdx, 'filters', s.filters.filter((_, i) => i !== filterIdx));
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
      const job = await api.createExport(body);
      onJobCreated(job);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const orderFilterFields = [
    { value: 'status', label: 'Status (open/cancelled/archived)' },
    { value: 'financial_status', label: 'Financial Status (paid/pending/refunded)' },
    { value: 'fulfillment_status', label: 'Fulfillment Status (fulfilled/unfulfilled)' },
    { value: 'search', label: 'Search (order #, email, phone)' },
  ];

  const productFilterFields = [
    { value: 'status', label: 'Status (active/draft/archived)' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'search', label: 'Search (title)' },
  ];

  return (
    <div className="export-form">
      <div className="form-header">
        <h2>New Export</h2>
        <div className="format-selector">
          <label>
            <input type="radio" name="format" value="xlsx" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} />
            Excel (XLSX)
          </label>
          <label>
            <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} />
            CSV
          </label>
        </div>
      </div>

      <div className="form-row">
        <label>File Name (optional)</label>
        <input
          type="text"
          placeholder="e.g. orders-may-2026"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
      </div>

      {sheets.map((sheet, idx) => (
        <div key={idx} className="sheet-card">
          <div className="sheet-card-header">
            <select
              value={sheet.entity}
              onChange={(e) => updateSheet(idx, 'entity', e.target.value)}
            >
              {ENTITIES.map((ent) => (
                <option key={ent.value} value={ent.value}>{ent.label}</option>
              ))}
            </select>
            {sheets.length > 1 && (
              <button className="btn-remove" onClick={() => removeSheet(idx)}>Remove</button>
            )}
          </div>

          <div className="sheet-section">
            <h4>Select Columns</h4>
            <ColumnSelector
              entity={sheet.entity}
              selected={sheet.columns}
              onChange={(cols) => updateSheet(idx, 'columns', cols)}
            />
          </div>

          <div className="sheet-section">
            <h4>
              Filters
              <button className="btn-link" onClick={() => addFilter(idx)}>+ Add Filter</button>
            </h4>
            {sheet.filters.map((f, fi) => (
              <div key={fi} className="filter-row">
                <select value={f.field} onChange={(e) => updateFilter(idx, fi, 'field', e.target.value)}>
                  <option value="">Select field...</option>
                  {(sheet.entity === 'orders' ? orderFilterFields : productFilterFields).map((ff) => (
                    <option key={ff.value} value={ff.value}>{ff.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={f.value}
                  onChange={(e) => updateFilter(idx, fi, 'value', e.target.value)}
                />
                <button className="btn-remove-sm" onClick={() => removeFilter(idx, fi)}>x</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sheets.length < ENTITIES.length && (
        <button className="btn-add-sheet" onClick={addSheet}>+ Add Sheet</button>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-export" onClick={handleExport} disabled={creating}>
        {creating ? 'Creating Export...' : 'Start Export'}
      </button>
    </div>
  );
}
