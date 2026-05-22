import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

function fmtBytes(b) {
  if (!b) return '--';
  return b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}

function fmtAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  return h < 24 ? h + 'h ago' : Math.floor(h / 24) + 'd ago';
}

export default function JobList({ refreshTrigger, compact, limit }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const poll = useRef(null);

  const load = async () => {
    try {
      const d = await api.getJobs();
      setJobs(Array.isArray(d) ? d : []);
    } catch (e) { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  useEffect(() => {
    const running = jobs.some((j) => j.status === 'running' || j.status === 'pending');
    if (running) poll.current = setInterval(load, 3000);
    else clearInterval(poll.current);
    return () => clearInterval(poll.current);
  }, [jobs]);

  const download = async (id) => {
    setDownloading((p) => ({ ...p, [id]: true }));
    try {
      const { downloadUrl } = await api.getDownloadUrl(id);
      if (downloadUrl) window.open(downloadUrl, '_blank');
    } catch (e) { alert(e.message); }
    finally { setDownloading((p) => ({ ...p, [id]: false })); }
  };

  const cancel = async (id) => {
    await api.cancelJob(id).catch(() => {});
    load();
  };

  if (loading) return <div className="jobs-msg">Loading...</div>;

  const display = limit ? jobs.slice(0, limit) : jobs;

  if (display.length === 0) {
    return (
      <div className="jobs-msg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".25"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <p>{compact ? 'No recent exports' : 'No exports yet. Choose a template above to get started.'}</p>
      </div>
    );
  }

  return (
    <div className="jobs">
      {!compact && <h2 className="jobs-title">All Exports</h2>}
      {display.map((j) => {
        const sheets = j.export_job_sheets || [];
        const totalItems = sheets.reduce((s, sh) => s + (sh.total_items || 0), 0);
        const processedItems = sheets.reduce((s, sh) => s + (sh.processed_items || 0), 0);
        const pct = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;
        const isRunning = j.status === 'running' || j.status === 'pending';

        return (
          <div key={j.id} className={`job-row ${compact ? 'compact' : ''}`}>
            <div className="job-left">
              <div className="job-name">{j.file_name}</div>
              <div className="job-meta">
                <span className={`job-status ${j.status}`}>
                  <span className="dot" />
                  {j.status}
                </span>
                <span>{j.format?.toUpperCase()}</span>
                <span>{fmtBytes(j.file_size_bytes)}</span>
                <span>{fmtAgo(j.created_at)}</span>
              </div>
              {isRunning && (
                <div className="job-progress">
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="progress-label">{pct}%</span>
                </div>
              )}
            </div>
            <div className="job-right">
              {j.status === 'completed' && (
                <button className="dl-btn" onClick={() => download(j.id)} disabled={downloading[j.id]}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              )}
              {isRunning && <button className="cancel-btn" onClick={() => cancel(j.id)}>Cancel</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
