// API Service Client for KirayaSetu
const API_BASE = '/api';

// Helper to store active user in localStorage for persistence across reloads
export function getSavedUserId() {
  return localStorage.getItem('kirayasetu_user_id') || 'usr_admin';
}

export function setSavedUserId(id) {
  localStorage.setItem('kirayasetu_user_id', id);
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getSavedUserId()
  };
}

export const api = {
  // Auth & Personas
  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/current`, { headers: getHeaders() });
    return res.json();
  },

  // Properties & Units
  async getProperties() {
    const res = await fetch(`${API_BASE}/properties`, { headers: getHeaders() });
    return res.json();
  },

  async getUnits() {
    const res = await fetch(`${API_BASE}/units`, { headers: getHeaders() });
    return res.json();
  },

  // Rental Agreements
  async getAgreements() {
    const res = await fetch(`${API_BASE}/agreements`, { headers: getHeaders() });
    return res.json();
  },

  async getAgreementById(id) {
    const res = await fetch(`${API_BASE}/agreements/${id}`, { headers: getHeaders() });
    return res.json();
  },

  async createAgreement(data) {
    const res = await fetch(`${API_BASE}/agreements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async signAgreement(id, signatureData, signRole = 'tenant') {
    const res = await fetch(`${API_BASE}/agreements/${id}/sign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ signatureData, signRole })
    });
    return res.json();
  },

  // Damages & Invoices
  async getDamages() {
    const res = await fetch(`${API_BASE}/damages`, { headers: getHeaders() });
    return res.json();
  },

  async reportDamage(data) {
    const res = await fetch(`${API_BASE}/damages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async reviewDamage(id, data) {
    const res = await fetch(`${API_BASE}/damages/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Rent & Payments
  async getRentInvoices() {
    const res = await fetch(`${API_BASE}/rent/invoices`, { headers: getHeaders() });
    return res.json();
  },

  async payRent(invoiceId, paymentMethod, transactionRef) {
    const res = await fetch(`${API_BASE}/rent/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ invoiceId, paymentMethod, transactionRef })
    });
    return res.json();
  },

  async sendRentReminders(tenantId, month, customMessage) {
    const res = await fetch(`${API_BASE}/rent/send-reminders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tenantId, month, customMessage })
    });
    return res.json();
  },

  // Meters & Utility Bills
  async getMeters() {
    const res = await fetch(`${API_BASE}/utilities/meters`, { headers: getHeaders() });
    return res.json();
  },

  async registerMeter(data) {
    const res = await fetch(`${API_BASE}/utilities/meters`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getUtilityBills() {
    const res = await fetch(`${API_BASE}/utilities/bills`, { headers: getHeaders() });
    return res.json();
  },

  async addUtilityReading(data) {
    const res = await fetch(`${API_BASE}/utilities/bills`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async payUtilityBill(billId, paymentRef) {
    const res = await fetch(`${API_BASE}/utilities/bills/${billId}/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ paymentRef })
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // File Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': getSavedUserId()
      },
      body: formData
    });
    return res.json();
  },

  // Reset Data
  async resetData() {
    const res = await fetch(`${API_BASE}/reset-data`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  }
};
