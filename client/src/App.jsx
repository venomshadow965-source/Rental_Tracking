import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import AgreementsPage from './pages/AgreementsPage';
import PaymentsPage from './pages/PaymentsPage';
import UtilitiesPage from './pages/UtilitiesPage';
import DamagesPage from './pages/DamagesPage';

import AuthLandingPage from './pages/AuthLandingPage';
import LandlordAuthPage from './pages/LandlordAuthPage';
import TenantAuthPage from './pages/TenantAuthPage';
import UnauthorizedView from './components/UnauthorizedView';

import AgreementViewer from './components/AgreementViewer';
import CreateAgreementModal from './components/CreateAgreementModal';
import AddPropertyModal from './components/AddPropertyModal';
import AddUnitModal from './components/AddUnitModal';
import RentPaymentModal from './components/RentPaymentModal';
import HraReceiptModal from './components/HraReceiptModal';
import ReportDamageModal from './components/ReportDamageModal';
import ReviewDamageModal from './components/ReviewDamageModal';
import InvoiceViewerModal from './components/InvoiceViewerModal';
import RegisterMeterModal from './components/RegisterMeterModal';
import AddReadingModal from './components/AddReadingModal';
import PayUtilityModal from './components/PayUtilityModal';
import GovReceiptModal from './components/GovReceiptModal';
import PropertyMapModal from './components/PropertyMapModal';

import { api, getSavedUserId, setSavedUserId, setSavedToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authView, setAuthView] = useState('landing'); // 'landing', 'landlord', 'tenant'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [meters, setMeters] = useState([]);
  const [utilityBills, setUtilityBills] = useState([]);
  const [damages, setDamages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals
  const [viewingAgreement, setViewingAgreement] = useState(null);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [targetTenantForAgreement, setTargetTenantForAgreement] = useState(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addingUnitProperty, setAddingUnitProperty] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [viewingHraReceipt, setViewingHraReceipt] = useState(null);
  const [showReportDamage, setShowReportDamage] = useState(false);
  const [reviewingDamage, setReviewingDamage] = useState(null);
  const [viewingInvoiceDamage, setViewingInvoiceDamage] = useState(null);
  const [showRegisterMeter, setShowRegisterMeter] = useState(false);
  const [registerMeterPropertyId, setRegisterMeterPropertyId] = useState(null);
  const [showAddReading, setShowAddReading] = useState(false);
  const [payingBill, setPayingBill] = useState(null);
  const [viewingGovReceipt, setViewingGovReceipt] = useState(null);
  const [viewingMapProperty, setViewingMapProperty] = useState(null);

  // Initial Load
  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      setLoading(true);
      const savedId = getSavedUserId();
      
      // Fetch users and units for auth selection
      const [usersRes, propsRes, unitsRes] = await Promise.all([
        api.getUsers(),
        api.getProperties(),
        api.getUnits()
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (propsRes.success) setProperties(propsRes.properties);
      if (unitsRes.success) setUnits(unitsRes.units);

      // If user has a saved session, load their current profile and scoped data
      if (savedId) {
        const currentRes = await api.getCurrentUser();
        if (currentRes.success && currentRes.user) {
          setCurrentUser(currentRes.user);
          await loadUserScopedData();
        } else {
          // Token expired or invalid
          setSavedUserId('');
          setSavedToken('');
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to authenticate session', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserScopedData = async () => {
    try {
      const [agrsRes, invsRes, metersRes, billsRes, damagesRes, notifsRes, propsRes, unitsRes] = await Promise.all([
        api.getAgreements(),
        api.getRentInvoices(),
        api.getMeters(),
        api.getUtilityBills(),
        api.getDamages(),
        api.getNotifications(),
        api.getProperties(),
        api.getUnits()
      ]);

      if (agrsRes.success) setAgreements(agrsRes.agreements);
      if (invsRes.success) setInvoices(invsRes.invoices);
      if (metersRes.success) setMeters(metersRes.meters);
      if (billsRes.success) setUtilityBills(billsRes.bills);
      if (damagesRes.success) setDamages(damagesRes.damages);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
      if (propsRes.success) setProperties(propsRes.properties);
      if (unitsRes.success) setUnits(unitsRes.units);
    } catch (err) {
      console.error('Failed to load user scoped data', err);
    }
  };

  // Login handler from dedicated portal
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    await loadUserScopedData();
  };

  // Logout handler
  const handleLogout = () => {
    setSavedUserId('');
    setSavedToken('');
    setCurrentUser(null);
    setAuthView('landing');
  };

  // Switch portal handler
  const handleSwitchPortal = (targetPortal) => {
    setSavedUserId('');
    setSavedToken('');
    setCurrentUser(null);
    setAuthView(targetPortal);
  };

  // Action: List New Property (Admin only)
  const handleCreateProperty = async (data) => {
    const res = await api.createProperty(data);
    if (res.success) {
      setProperties(prev => [...prev, res.property]);
      const [unitsRes, notifsRes] = await Promise.all([
        api.getUnits(),
        api.getNotifications()
      ]);
      if (unitsRes.success) setUnits(unitsRes.units);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Add Unit to Property (Admin only)
  const handleAddUnit = async (propertyId, unitData) => {
    const res = await api.addUnitToProperty(propertyId, unitData);
    if (res.success) {
      setProperties(prev => prev.map(p => p.id === propertyId ? res.property : p));
      const unitsRes = await api.getUnits();
      if (unitsRes.success) setUnits(unitsRes.units);
    }
    return res;
  };

  // Action: Create Agreement (Admin only)
  const handleCreateAgreement = async (data) => {
    const res = await api.createAgreement(data);
    if (res.success) {
      setAgreements(prev => [res.agreement, ...prev]);
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Sign Agreement
  const handleSignAgreement = async (id, signatureData) => {
    const res = await api.signAgreement(id, signatureData, currentUser?.role);
    if (res.success) {
      setAgreements(prev => prev.map(a => a.id === id ? res.agreement : a));
      if (viewingAgreement && viewingAgreement.id === id) {
        setViewingAgreement(res.agreement);
      }
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Pay Rent
  const handlePayRent = async (invoiceId, paymentMethod, transactionRef) => {
    const res = await api.payRent(invoiceId, paymentMethod, transactionRef);
    if (res.success) {
      setInvoices(prev => prev.map(i => i.id === invoiceId ? res.invoice : i));
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Send Rent Reminders (Admin)
  const handleSendRentReminders = async () => {
    const res = await api.sendRentReminders();
    const notifsRes = await api.getNotifications();
    if (notifsRes.success) setNotifications(notifsRes.notifications);
    return res;
  };

  // Action: Report Damage
  const handleReportDamage = async (data) => {
    const res = await api.reportDamage(data);
    if (res.success) {
      setDamages(prev => [res.damage, ...prev]);
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Review Damage (Admin)
  const handleReviewDamage = async (id, data) => {
    const res = await api.reviewDamage(id, data);
    if (res.success) {
      setDamages(prev => prev.map(d => d.id === id ? res.damage : d));
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Register Meter
  const handleRegisterMeter = async (data) => {
    const res = await api.registerMeter(data);
    if (res.success) {
      setMeters(prev => [...prev, res.meter]);
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  const handleOpenRegisterMeterForProperty = (propertyId) => {
    setRegisterMeterPropertyId(propertyId);
    setShowRegisterMeter(true);
  };

  // Action: Live Sync Single Meter
  const handleSyncMeterLive = async (meterId) => {
    const res = await api.syncMeterLive(meterId);
    if (res.success && res.meter) {
      setMeters(prev => prev.map(m => m.id === meterId ? res.meter : m));
    }
    return res;
  };

  // Action: Live Sync All Meters
  const handleSyncAllMetersLive = async () => {
    const res = await api.syncAllMetersLive();
    if (res.success && res.meters) {
      setMeters(res.meters);
      const billsRes = await api.getUtilityBills();
      if (billsRes.success) setUtilityBills(billsRes.bills);
    }
    return res;
  };

  // Action: Add Monthly Reading
  const handleAddReading = async (data) => {
    const res = await api.addUtilityReading(data);
    if (res.success) {
      setUtilityBills(prev => [res.bill, ...prev]);
      if (res.meter) {
        setMeters(prev => prev.map(m => m.id === res.meter.id ? res.meter : m));
      }
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Action: Pay Utility Bill
  const handlePayUtilityBill = async (billId, paymentRef, paymentMode = 'UPI') => {
    const res = await api.payUtilityBill(billId, paymentRef, paymentMode);
    if (res.success) {
      setUtilityBills(prev => prev.map(b => b.id === billId ? res.bill : b));
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Periodic background sync for real-time notifications & registered tenants
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        const notifsRes = await api.getNotifications();
        if (notifsRes.success) setNotifications(notifsRes.notifications);
        if (currentUser.role === 'admin') {
          const [usersRes, agrsRes] = await Promise.all([
            api.getUsers(),
            api.getAgreements()
          ]);
          if (usersRes.success) setUsers(usersRes.users);
          if (agrsRes.success) setAgreements(agrsRes.agreements);
        }
      } catch (err) {
        // silent sync catch
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Notifications
  const handleMarkNotifRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationAction = (url, notif = null) => {
    if ((notif && (notif.type === 'tenant_registered' || notif.tenantId)) || (url && url.includes('createTenant'))) {
      const tenantId = notif?.tenantId || (url && url.split('createTenant=')[1]);
      setActiveTab('agreements');
      if (currentUser?.role === 'admin') {
        setTargetTenantForAgreement(tenantId);
        setShowCreateAgreement(true);
      }
      return;
    }

    if (url?.startsWith('/properties')) setActiveTab('properties');
    else if (url?.startsWith('/payments')) setActiveTab('payments');
    else if (url?.startsWith('/agreements')) setActiveTab('agreements');
    else if (url?.startsWith('/utilities')) setActiveTab('utilities');
    else if (url?.startsWith('/damages')) setActiveTab('damages');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to KirayaSetu...</h2>
        <p className="text-xs text-slate-400">Verifying secure role authentication</p>
      </div>
    );
  }

  // ==========================================
  // UN-AUTHENTICATED: RENDER SEPARATE AUTH PAGES
  // ==========================================
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <AuthLandingPage 
          onSelectPortal={(portal) => setAuthView(portal)} 
        />
      );
    }

    if (authView === 'landlord') {
      return (
        <LandlordAuthPage
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setAuthView('landing')}
          onSwitchToTenant={() => setAuthView('tenant')}
        />
      );
    }

    if (authView === 'tenant') {
      return (
        <TenantAuthPage
          units={units}
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setAuthView('landing')}
          onSwitchToLandlord={() => setAuthView('landlord')}
        />
      );
    }
  }

  // ==========================================
  // AUTHENTICATED: RENDER ROLE-PROTECTED APP
  // ==========================================
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        properties={properties}
        onLogout={handleLogout}
        onSwitchPortalAuth={handleSwitchPortal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onMarkAllNotificationsRead={handleMarkAllNotifsRead}
        onNavigateAction={handleNotificationAction}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Role Authorization Guards on Action Modals */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            currentUser={currentUser}
            properties={properties}
            agreements={agreements}
            damages={damages}
            invoices={invoices}
            meters={meters}
            utilityBills={utilityBills}
            notifications={notifications}
            users={users}
            onNavigate={setActiveTab}
            onNavigateAction={handleNotificationAction}
            onOpenPayRent={(inv) => setPayingInvoice(inv)}
            onOpenAddProperty={() => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can list new properties.');
                return;
              }
              setShowAddProperty(true);
            }}
            onOpenCreateAgreement={(tenantId = null) => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can make rental agreements.');
                return;
              }
              setTargetTenantForAgreement(tenantId);
              setShowCreateAgreement(true);
            }}
            onOpenReportDamage={() => setShowReportDamage(true)}
            onOpenAgreementViewer={(agr) => setViewingAgreement(agr)}
            onOpenViewInvoice={(dmg) => setViewingInvoiceDamage(dmg)}
            onSendRentReminders={handleSendRentReminders}
            onOpenMap={(prop) => setViewingMapProperty(prop)}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesPage
            properties={properties}
            currentUser={currentUser}
            meters={meters}
            onOpenRegisterMeter={(propId) => handleOpenRegisterMeterForProperty(propId)}
            onOpenAddProperty={() => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can list new properties.');
                return;
              }
              setShowAddProperty(true);
            }}
            onOpenAddUnit={(prop) => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can add units.');
                return;
              }
              setAddingUnitProperty(prop);
            }}
            onOpenCreateAgreement={(tenantId = null) => {
              setTargetTenantForAgreement(tenantId);
              setShowCreateAgreement(true);
            }}
            onOpenMap={(prop) => setViewingMapProperty(prop)}
          />
        )}

        {activeTab === 'agreements' && (
          <AgreementsPage
            agreements={agreements}
            currentUser={currentUser}
            users={users}
            properties={properties}
            onOpenCreateAgreement={(tenantId = null) => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can create rental agreements.');
                return;
              }
              setTargetTenantForAgreement(tenantId);
              setShowCreateAgreement(true);
            }}
            onOpenAgreementViewer={(agr) => setViewingAgreement(agr)}
            onOpenMap={(prop) => setViewingMapProperty(prop)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsPage
            invoices={invoices}
            currentUser={currentUser}
            onOpenPayRent={(inv) => setPayingInvoice(inv)}
            onOpenHraReceipt={(inv) => setViewingHraReceipt(inv)}
            onSendRentReminders={handleSendRentReminders}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesPage
            meters={meters}
            utilityBills={utilityBills}
            currentUser={currentUser}
            onOpenRegisterMeter={() => {
              setRegisterMeterPropertyId(null);
              setShowRegisterMeter(true);
            }}
            onOpenAddReading={() => setShowAddReading(true)}
            onOpenPayBill={(bill) => setPayingBill(bill)}
            onSyncMeter={handleSyncMeterLive}
            onSyncAllMeters={handleSyncAllMetersLive}
            onViewGovReceipt={(bill, receipt) => setViewingGovReceipt({ bill, receipt })}
          />
        )}

        {activeTab === 'damages' && (
          <DamagesPage
            damages={damages}
            currentUser={currentUser}
            onOpenReportDamage={() => setShowReportDamage(true)}
            onOpenViewInvoice={(dmg) => setViewingInvoiceDamage(dmg)}
            onOpenReviewDamage={(dmg) => {
              if (!isAdmin) {
                alert('Access Denied: Only Landlord Administrator can review and reimburse damage claims.');
                return;
              }
              setReviewingDamage(dmg);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">KirayaSetu</span>
            <span>•</span>
            <span>Indian Rent, Model Tenancy Agreement & Government Meter Tracking</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Model Tenancy Act Compliant</span>
            <span>•</span>
            <span>Separate Landlord & Tenant Auth Gateways</span>
            <span>•</span>
            <span>Aadhaar e-Sign & BBPS Integration</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {viewingAgreement && (
        <AgreementViewer
          agreement={viewingAgreement}
          currentUser={currentUser}
          onClose={() => setViewingAgreement(null)}
          onSignAgreement={handleSignAgreement}
          onOpenMap={(prop) => setViewingMapProperty(prop)}
        />
      )}

      {showCreateAgreement && (
        <CreateAgreementModal
          properties={properties}
          units={units}
          users={users}
          currentUser={currentUser}
          initialTenantId={targetTenantForAgreement}
          onClose={() => {
            setShowCreateAgreement(false);
            setTargetTenantForAgreement(null);
          }}
          onSubmit={handleCreateAgreement}
        />
      )}

      {showAddProperty && (
        <AddPropertyModal
          onClose={() => setShowAddProperty(false)}
          onSubmit={handleCreateProperty}
        />
      )}

      {addingUnitProperty && (
        <AddUnitModal
          property={addingUnitProperty}
          onClose={() => setAddingUnitProperty(null)}
          onSubmit={handleAddUnit}
        />
      )}

      {payingInvoice && (
        <RentPaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaySuccess={handlePayRent}
        />
      )}

      {viewingHraReceipt && (
        <HraReceiptModal
          invoice={viewingHraReceipt}
          onClose={() => setViewingHraReceipt(null)}
        />
      )}

      {showReportDamage && (
        <ReportDamageModal
          currentUser={currentUser}
          onClose={() => setShowReportDamage(false)}
          onSubmit={handleReportDamage}
        />
      )}

      {reviewingDamage && (
        <ReviewDamageModal
          damage={reviewingDamage}
          onClose={() => setReviewingDamage(null)}
          onReviewSubmit={handleReviewDamage}
          onOpenViewInvoice={(dmg) => setViewingInvoiceDamage(dmg)}
        />
      )}

      {viewingInvoiceDamage && (
        <InvoiceViewerModal
          damage={viewingInvoiceDamage}
          onClose={() => setViewingInvoiceDamage(null)}
        />
      )}

      {showRegisterMeter && (
        <RegisterMeterModal
          units={units}
          users={users}
          properties={properties}
          initialPropertyId={registerMeterPropertyId}
          currentUser={currentUser}
          onClose={() => {
            setShowRegisterMeter(false);
            setRegisterMeterPropertyId(null);
          }}
          onSubmit={handleRegisterMeter}
        />
      )}

      {showAddReading && (
        <AddReadingModal
          meters={meters}
          onClose={() => setShowAddReading(false)}
          onSubmit={handleAddReading}
        />
      )}

      {payingBill && (
        <PayUtilityModal
          bill={payingBill}
          onClose={() => setPayingBill(null)}
          onPaySuccess={handlePayUtilityBill}
          onViewGovReceipt={(bill, receipt) => setViewingGovReceipt({ bill, receipt })}
        />
      )}

      {viewingGovReceipt && (
        <GovReceiptModal
          bill={viewingGovReceipt.bill}
          receipt={viewingGovReceipt.receipt}
          onClose={() => setViewingGovReceipt(null)}
        />
      )}

      {viewingMapProperty && (
        <PropertyMapModal
          property={viewingMapProperty}
          currentUser={currentUser}
          onClose={() => setViewingMapProperty(null)}
        />
      )}

    </div>
  );
}

