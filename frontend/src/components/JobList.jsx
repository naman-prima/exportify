import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }) {
  const colors = {
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
  };
  return (
    <span className="status-badge" style={{ background: colors[status] || '#6b7280' }}>
      {status}
    </span>
  );
}

function SheetProgress({ sheets }) {
  if (!sheets || sheets.length === 0) return null;
  return (
    <div className="sheet-progress">
      {sheets.map((s) => (
        <div key={s.id} className="sheet-prog-item">
          <span className="entity-tag">{s.entity}</span>
          <span>{s.processed_items || 0} / {s.total_items || '?'} items</span>
          <span>{s.exported_rows || 0} rows</span>
        </div>
      ))}
    </div>
  );
}

export default function JobList({ refreshTrigger }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const intervalRef = useRef(null);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [refreshTrigger]);

  // Poll for running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === 'running' || j.status === 'pending');
    if (hasRunning) {
      intervalRef.current = setInterval(loadJobs, 3000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [jobs]);

  const handleDownload = async (jobId) => {
    setDownloading((prev) => ({ ...prev, [jobId]: true }));
    try {
      const { downloadUrl } = await api.getDownloadUrl(jobId);
      if (downloadUrl) window.open(downloadUrl, '_blank');
    } catch (e) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await api.cancelJob(jobId);
      loadJobs();
    } catch (e) {
      alert('Cancel failed: ' + e.message);
    }
  };

  if (loading) return <div className="jobs-loading">Loading jobs...</div>;
  if (jobs.length === 0) return <div className="jobs-empty">No exports yet. Create one above.</div>;

  return (
    <div className="job-list">
      <h2>All Jobs</h2>
      <table className="jobs-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Format</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Size</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="file-name">{job.file_name}</td>
              <td>{job.format?.toUpperCase()}</td>
              <td><StatusBadge status={job.status} /></td>
              <td><SheetProgress sheets={job.export_job_sheets} /></td>
              <td>{formatBytes(job.file_size_bytes)}</td>
              <td>{formatTime(job.created_at)}</td>
              <td className="job-actions">
                {job.status === 'completed' && (
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(job.id)}
                    disabled={downloading[job.id]}
                  >
                    {downloading[job.id] ? '...' : 'Download'}
                  </button>
                )}
                {(job.status === 'running' || job.status === 'pending') && (
                  <button className="btn-cancel" onClick={() => handleCancel(job.id)}>
                    Cancel
                  </button>
                )}
                {job.status === 'failed' && (
                  <span className="error-text" title={job.error_message}>Failed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
