const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// In production, merchant_id comes from the embedded app context.
// For dev, read from env or default.
function getMerchantId() {
  return localStorage.getItem('merchant_id') || import.meta.env.VITE_MERCHANT_ID || '';
}

export function setMerchantId(id) {
  localStorage.setItem('merchant_id', id);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-merchant-id': getMerchantId(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getColumns: (entity) => request(`/v1/export/columns/${entity}`),
  createExport: (body) => request('/v1/export', { method: 'POST', body: JSON.stringify(body) }),
  getJobs: () => request('/v1/export/jobs'),
  getJob: (id) => request(`/v1/export/jobs/${id}`),
  cancelJob: (id) => request(`/v1/export/jobs/${id}/cancel`, { method: 'PATCH' }),
  getDownloadUrl: (id) => request(`/v1/export/jobs/${id}/download`),
};
