import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ColumnSelector({ entity, selected, onChange }) {
  const [groups, setGroups] = useState({});
  const [allColumns, setAllColumns] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getColumns(entity).then((data) => {
      setGroups(data.groups);
      setAllColumns(data.allColumns);
      if (selected.length === 0) onChange(data.defaultColumns);
      setLoading(false);
    });
  }, [entity]);

  const toggle = (key) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const toggleGroup = (groupName) => {
    const keys = groups[groupName].map((c) => c.key);
    const allOn = keys.every((k) => selected.includes(k));
    onChange(allOn ? selected.filter((k) => !keys.includes(k)) : [...new Set([...selected, ...keys])]);
  };

  if (loading) return <div className="col-loading">Loading columns...</div>;

  return (
    <div className="col-selector">
      <div className="col-bar">
        <span>{selected.length} / {allColumns.length} columns</span>
        <div>
          <button className="col-action" onClick={() => onChange(allColumns.map((c) => c.key))}>Select all</button>
          <button className="col-action" onClick={() => onChange([])}>Clear</button>
        </div>
      </div>
      {Object.entries(groups).map(([name, cols]) => {
        const keys = cols.map((c) => c.key);
        const count = keys.filter((k) => selected.includes(k)).length;
        const isOpen = expanded[name];
        const hasSlow = cols.some((c) => c.slow);

        return (
          <div key={name} className="col-group">
            <div className="col-group-row" onClick={() => setExpanded((p) => ({ ...p, [name]: !p[name] }))}>
              <span className={`chevron ${isOpen ? 'open' : ''}`}>&#9654;</span>
              <input
                type="checkbox"
                checked={count === cols.length}
                ref={(el) => el && (el.indeterminate = count > 0 && count < cols.length)}
                onChange={() => toggleGroup(name)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="col-group-name">{name}</span>
              <span className="col-group-count">{count}/{cols.length}</span>
              {hasSlow && <span className="slow-label">Slow</span>}
            </div>
            {isOpen && (
              <div className="col-items">
                {cols.map((col) => (
                  <label key={col.key} className="col-check">
                    <input type="checkbox" checked={selected.includes(col.key)} onChange={() => toggle(col.key)} />
                    {col.label}
                    {col.slow && <span className="slow-label sm">Slow</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
