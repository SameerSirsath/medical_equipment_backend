// src/api/client.js

const API_BASE = import.meta.env.VITE_API_URL || '';

const buildUrl = (url) => {
  if (!API_BASE) return url;
  return `${API_BASE}${url}`;
};

export async function apiPost(url, data) {
  const res = await fetch(buildUrl(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function apiGet(url) {
  const res = await fetch(buildUrl(url), { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ---- NEW: PUT helper for updating feedback remark ----
export async function apiPut(url, data) {
  const res = await fetch(buildUrl(url), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Fetch real categories & products with graceful fallback (dev only)
export async function fetchBootstrapData() {
  try {
    const data = await apiGet('/api/bootstrap');
    console.log('✅ Bootstrap data loaded:', data);
    if (!data.categories || !data.products_by_category) {
      throw new Error('Invalid response structure');
    }
    return data;
  } catch (error) {
    console.error('❌ Bootstrap fetch error:', error);
    if (import.meta.env.DEV) {
      console.warn('⚠️ Using mock data (development fallback)');
      return {
        categories: ["Anaesthesia Devices", "Cardiology Devices"],
        products_by_category: {
          "Anaesthesia Devices": [
            { equipment_id: 1, name: "Anaesthesia Machine" },
            { equipment_id: 2, name: "Ventilator" }
          ],
          "Cardiology Devices": [
            { equipment_id: 3, name: "ECG Machine" },
            { equipment_id: 4, name: "Holter Monitor" }
          ]
        }
      };
    }
    throw error; // re‑throw in production so UI can show error
  }
}