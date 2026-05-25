const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Merchant ID priority:
// 1. sessionStorage 'merchant-mid' (set by Ratio platform dashboard)
// 2. URL query param ?merchant_id=xxx (set by OAuth redirect)
// 3. localStorage (persisted from previous session)
// 4. VITE_MERCHANT_ID env var (dev fallback)
function getMerchantId() {
  // Platform session (Ratio dashboard sets this)
  const fromSession = sessionStorage.getItem('merchant-mid');
  if (fromSession) return fromSession;

  // URL params (OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('merchant_id');
  if (fromUrl) {
    localStorage.setItem('merchant_id', fromUrl);
    return fromUrl;
  }

  return localStorage.getItem('merchant_id') || import.meta.env.VITE_MERCHANT_ID || '';
}

export function setMerchantId(id) {
  localStorage.setItem('merchant_id', id);
}

export function clearMerchantId() {
  localStorage.removeItem('merchant_id');
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
