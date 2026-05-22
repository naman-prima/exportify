import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ColumnSelector({ entity, selected, onChange }) {
  const [groups, setGroups] = useState({});
  const [allColumns, setAllColumns] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getColumns(entity).then((data) => {
      setGroups(data.groups);
      setAllColumns(data.allColumns);
      if (selected.length === 0) onChange(data.defaultColumns);
      setLoading(false);
    });
  }, [entity]);

  const toggle = (key) => {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );
  };

  const toggleGroup = (groupName) => {
    const groupKeys = groups[groupName].map((c) => c.key);
    const allSelected = groupKeys.every((k) => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter((k) => !groupKeys.includes(k)));
    } else {
      onChange([...new Set([...selected, ...groupKeys])]);
    }
  };

  const toggleExpand = (groupName) => {
    setExpanded((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const selectAll = () => onChange(allColumns.map((c) => c.key));
  const selectNone = () => onChange([]);

  if (loading) return <div className="col-selector-loading">Loading columns...</div>;

  return (
    <div className="col-selector">
      <div className="col-selector-header">
        <span className="col-count">{selected.length} of {allColumns.length} columns</span>
        <div className="col-actions">
          <button onClick={selectAll} className="btn-link">All</button>
          <button onClick={selectNone} className="btn-link">None</button>
        </div>
      </div>
      <div className="col-groups">
        {Object.entries(groups).map(([groupName, cols]) => {
          const groupKeys = cols.map((c) => c.key);
          const selectedCount = groupKeys.filter((k) => selected.includes(k)).length;
          const isExpanded = expanded[groupName];
          const hasSlow = cols.some((c) => c.slow);

          return (
            <div key={groupName} className="col-group">
              <div className="col-group-header" onClick={() => toggleExpand(groupName)}>
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                <label className="col-group-label">
                  <input
                    type="checkbox"
                    checked={selectedCount === cols.length}
                    ref={(el) => el && (el.indeterminate = selectedCount > 0 && selectedCount < cols.length)}
                    onChange={() => toggleGroup(groupName)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="group-name">{groupName}</span>
                  <span className="group-count">({selectedCount}/{cols.length})</span>
                  {hasSlow && <span className="slow-tag">Slow</span>}
                </label>
              </div>
              {isExpanded && (
                <div className="col-group-items">
                  {cols.map((col) => (
                    <label key={col.key} className="col-item">
                      <input
                        type="checkbox"
                        checked={selected.includes(col.key)}
                        onChange={() => toggle(col.key)}
                      />
                      <span>{col.label}</span>
                      {col.slow && <span className="slow-tag">Slow</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
