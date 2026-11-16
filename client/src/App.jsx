import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AgreementsPage from './pages/AgreementsPage';
import PaymentsPage from './pages/PaymentsPage';
import UtilitiesPage from './pages/UtilitiesPage';
import DamagesPage from './pages/DamagesPage';

import AgreementViewer from './components/AgreementViewer';
import CreateAgreementModal from './components/CreateAgreementModal';
import RentPaymentModal from './components/RentPaymentModal';
import HraReceiptModal from './components/HraReceiptModal';
import ReportDamageModal from './components/ReportDamageModal';
import ReviewDamageModal from './components/ReviewDamageModal';
import RegisterMeterModal from './components/RegisterMeterModal';
import AddReadingModal from './components/AddReadingModal';
import PayUtilityModal from './components/PayUtilityModal';

import { api, getSavedUserId, setSavedUserId } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
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
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [viewingHraReceipt, setViewingHraReceipt] = useState(null);
  const [showReportDamage, setShowReportDamage] = useState(false);
  const [reviewingDamage, setReviewingDamage] = useState(null);
  const [showRegisterMeter, setShowRegisterMeter] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [payingBill, setPayingBill] = useState(null);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        usersRes, 
        currentRes, 
        propsRes, 
        unitsRes, 
        agrsRes, 
        invsRes, 
        metersRes, 
        billsRes, 
        damagesRes, 
        notifsRes
      ] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser(),
        api.getProperties(),
        api.getUnits(),
        api.getAgreements(),
        api.getRentInvoices(),
        api.getMeters(),
        api.getUtilityBills(),
        api.getDamages(),
        api.getNotifications()
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (currentRes.success) setCurrentUser(currentRes.user);
      if (propsRes.success) setProperties(propsRes.properties);
      if (unitsRes.success) setUnits(unitsRes.units);
      if (agrsRes.success) setAgreements(agrsRes.agreements);
      if (invsRes.success) setInvoices(invsRes.invoices);
      if (metersRes.success) setMeters(metersRes.meters);
      if (billsRes.success) setUtilityBills(billsRes.bills);
      if (damagesRes.success) setDamages(damagesRes.damages);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch Active User Persona (Admin vs Tenant)
  const handleSwitchUser = async (userId) => {
    setSavedUserId(userId);
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
    // Refresh user-scoped data
    const [agrsRes, invsRes, metersRes, billsRes, damagesRes, notifsRes] = await Promise.all([
      api.getAgreements(),
      api.getRentInvoices(),
      api.getMeters(),
      api.getUtilityBills(),
      api.getDamages(),
      api.getNotifications()
    ]);

    if (agrsRes.success) setAgreements(agrsRes.agreements);
    if (invsRes.success) setInvoices(invsRes.invoices);
    if (metersRes.success) setMeters(metersRes.meters);
    if (billsRes.success) setUtilityBills(billsRes.bills);
    if (damagesRes.success) setDamages(damagesRes.damages);
    if (notifsRes.success) setNotifications(notifsRes.notifications);
  };

  // Action: Create Agreement
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
  const handlePayUtilityBill = async (billId, paymentRef) => {
    const res = await api.payUtilityBill(billId, paymentRef);
    if (res.success) {
      setUtilityBills(prev => prev.map(b => b.id === billId ? res.bill : b));
      const notifsRes = await api.getNotifications();
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    }
    return res;
  };

  // Notifications
  const handleMarkNotifRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationAction = (url) => {
    if (url === '/payments') setActiveTab('payments');
    else if (url === '/agreements') setActiveTab('agreements');
    else if (url === '/utilities') setActiveTab('utilities');
    else if (url === '/damages') setActiveTab('damages');
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Loading KirayaSetu...</h2>
        <p className="text-xs text-slate-500">Rent, Agreement & Utility Tracking System</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onMarkAllNotificationsRead={handleMarkAllNotifsRead}
        onNavigateAction={handleNotificationAction}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            onNavigate={setActiveTab}
            onOpenPayRent={(inv) => setPayingInvoice(inv)}
            onOpenCreateAgreement={() => setShowCreateAgreement(true)}
            onOpenReportDamage={() => setShowReportDamage(true)}
            onOpenAgreementViewer={(agr) => setViewingAgreement(agr)}
            onSendRentReminders={handleSendRentReminders}
          />
        )}

        {activeTab === 'agreements' && (
          <AgreementsPage
            agreements={agreements}
            currentUser={currentUser}
            onOpenCreateAgreement={() => setShowCreateAgreement(true)}
            onOpenAgreementViewer={(agr) => setViewingAgreement(agr)}
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
            onOpenRegisterMeter={() => setShowRegisterMeter(true)}
            onOpenAddReading={() => setShowAddReading(true)}
            onOpenPayBill={(bill) => setPayingBill(bill)}
          />
        )}

        {activeTab === 'damages' && (
          <DamagesPage
            damages={damages}
            currentUser={currentUser}
            onOpenReportDamage={() => setShowReportDamage(true)}
            onOpenReviewDamage={(dmg) => setReviewingDamage(dmg)}
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
            <span>e-Stamp & UIDAI Aadhaar Verification</span>
            <span>•</span>
            <span>BBPS Utility Integration</span>
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
        />
      )}

      {showCreateAgreement && (
        <CreateAgreementModal
          properties={properties}
          units={units}
          users={users}
          onClose={() => setShowCreateAgreement(false)}
          onSubmit={handleCreateAgreement}
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
        />
      )}

      {showRegisterMeter && (
        <RegisterMeterModal
          units={units}
          users={users}
          currentUser={currentUser}
          onClose={() => setShowRegisterMeter(false)}
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
        />
      )}

    </div>
  );
}
