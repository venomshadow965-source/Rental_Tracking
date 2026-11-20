// API Service Client for KirayaSetu
const API_BASE = '/api';

export function getSavedUserId() {
  return localStorage.getItem('kirayasetu_user_id') || '';
}

export function setSavedUserId(id) {
  if (!id) {
    localStorage.removeItem('kirayasetu_user_id');
  } else {
    localStorage.setItem('kirayasetu_user_id', id);
  }
}

export function getSavedToken() {
  return localStorage.getItem('kirayasetu_token') || '';
}

export function setSavedToken(token) {
  if (!token) {
    localStorage.removeItem('kirayasetu_token');
  } else {
    localStorage.setItem('kirayasetu_token', token);
  }
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  const userId = getSavedUserId();
  const token = getSavedToken();
  if (userId) headers['x-user-id'] = userId;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const api = {
  // Auth & Portals
  async login(identifier, password, portalType) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, portalType })
    });
    return res.json();
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

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

  async createProperty(data) {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async addUnitToProperty(propertyId, unitData) {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(unitData)
    });
    return res.json();
  },

  async updatePropertyLocation(propertyId, locationData) {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/location`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(locationData)
    });
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

  async terminateAgreement(id) {
    const res = await fetch(`${API_BASE}/agreements/${id}/terminate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async vacateUnit(unitId) {
    const res = await fetch(`${API_BASE}/units/${unitId}/vacate`, {
      method: 'POST',
      headers: getHeaders()
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

  // Rent & Payments & Real-Time Bank Transfers
  async getRentInvoices() {
    const res = await fetch(`${API_BASE}/rent/invoices`, { headers: getHeaders() });
    return res.json();
  },

  async getBankAccounts() {
    const res = await fetch(`${API_BASE}/user/bank-accounts`, { headers: getHeaders() });
    return res.json();
  },

  async linkBankAccount(data) {
    const res = await fetch(`${API_BASE}/user/bank-accounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Real-Time Bank & UPI Verification APIs
  async verifyIfsc(ifsc) {
    const res = await fetch(`${API_BASE}/verify/ifsc/${encodeURIComponent(ifsc)}`, { headers: getHeaders() });
    return res.json();
  },

  async verifyBankAccount(data) {
    const res = await fetch(`${API_BASE}/verify/bank-account`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async verifyUpiQr(data) {
    const res = await fetch(`${API_BASE}/verify/upi-qr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getLandlordBankVerification() {
    const res = await fetch(`${API_BASE}/landlord/bank-verification?t=${Date.now()}`, { 
      headers: getHeaders(),
      cache: 'no-store'
    });
    return res.json();
  },

  async updateLandlordBankVerification(data) {
    const res = await fetch(`${API_BASE}/landlord/bank-verification`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async confirmUpiPayment(invoiceId, utr, upiApp = 'UPI App', payerVpa = null, note = '') {
    const res = await fetch(`${API_BASE}/rent/confirm-upi-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ invoiceId, utr, upiApp, payerVpa, note })
    });
    return res.json();
  },

  async payRent(invoiceId, paymentMethod, transactionRef, bankDetails = null) {
    const res = await fetch(`${API_BASE}/rent/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ invoiceId, paymentMethod, transactionRef, bankDetails })
    });
    return res.json();
  },

  async simulateUpiScan(invoiceId, upiApp = 'Google Pay', payerVpa = null) {
    const res = await fetch(`${API_BASE}/rent/simulate-upi-scan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ invoiceId, upiApp, payerVpa })
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

  async generateRentInvoice(data) {
    const res = await fetch(`${API_BASE}/rent/invoices/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Meters & Utility Bills (Live DISCOM & Bharat BillPay Integration)
  async getUtilityProviders() {
    const res = await fetch(`${API_BASE}/utilities/providers`, { headers: getHeaders() });
    return res.json();
  },

  async verifyGovMeter(data) {
    const res = await fetch(`${API_BASE}/utilities/verify-gov-meter`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

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

  async syncMeterLive(meterId) {
    const res = await fetch(`${API_BASE}/utilities/meters/${meterId}/sync-live`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async syncAllMetersLive() {
    const res = await fetch(`${API_BASE}/utilities/sync-all-meters`, {
      method: 'POST',
      headers: getHeaders()
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

  async payUtilityBill(billId, paymentRef, paymentMethod = 'UPI / BBPS Instant') {
    const res = await fetch(`${API_BASE}/utilities/bills/${billId}/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ paymentRef, paymentMethod })
    });
    return res.json();
  },

  async payUtilityBillGovernment(billId, paymentMethod, paidBy) {
    const res = await fetch(`${API_BASE}/utilities/bills/${billId}/pay-government`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ paymentMethod, paidBy })
    });
    return res.json();
  },

  async getGovernmentReceipt(billId) {
    const res = await fetch(`${API_BASE}/utilities/bills/${billId}/government-receipt`, {
      headers: getHeaders()
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
