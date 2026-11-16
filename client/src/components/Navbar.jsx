import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  FileText, 
  CreditCard, 
  Zap, 
  AlertTriangle, 
  Bell, 
  UserCheck, 
  ChevronDown, 
  Check, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  LogOut,
  RefreshCw,
  User
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  properties = [],
  onLogout,
  onSwitchPortalAuth,
  activeTab, 
  setActiveTab,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateAction
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    ...(isAdmin ? [{ id: 'properties', label: 'Properties', icon: Building2, badge: properties?.length ? `${properties.length}` : null }] : []),
    { id: 'agreements', label: 'Rental Agreements', icon: FileText, badge: isAdmin ? 'Admin' : 'Aadhaar' },
    { id: 'payments', label: 'Rent & Payments', icon: CreditCard },
    { id: 'utilities', label: 'Meters & Utilities', icon: Zap, badge: 'Gov Meters' },
    { id: 'damages', label: 'Damage & Invoices', icon: AlertTriangle }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isAdmin 
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-500/20' 
                : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">KirayaSetu</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isAdmin ? 'Landlord Portal' : 'Tenant Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Rent, Tenancy & Utility Tracking</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive 
                      ? (isAdmin ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30' : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive 
                        ? (isAdmin ? 'bg-amber-700 text-amber-100' : 'bg-emerald-700 text-emerald-100')
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Notifications & User Profile Menu */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowUserDropdown(false);
                }}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.actionUrl) {
                              onNavigateAction(notif.actionUrl, notif);
                              onMarkNotificationRead(notif.id);
                              setShowNotifDropdown(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer ${
                            !notif.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                            notif.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                            notif.severity === 'success' ? 'bg-emerald-100 text-emerald-700' :
                            notif.type === 'tenant_registered' ? 'bg-emerald-600 text-white shadow-sm' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between">
                              <p className={`text-xs font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                                {new Date(notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            {notif.actionText && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateAction(notif.actionUrl, notif);
                                  onMarkNotificationRead(notif.id);
                                  setShowNotifDropdown(false);
                                }}
                                className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold mt-1.5 hover:underline"
                              >
                                <span>{notif.actionText}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {!notif.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkNotificationRead(notif.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Account Profile & Logout */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition-all text-left"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">{currentUser?.name}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isAdmin ? 'Landlord' : 'Tenant'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                    {isAdmin ? 'Property Owner' : currentUser?.unitNumber || 'Resident'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Account Profile Flyout */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center space-x-3">
                    <img
                      src={currentUser?.avatar}
                      alt={currentUser?.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                        isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isAdmin ? 'Landlord Administrator' : 'Tenant Resident'}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 text-xs text-slate-600 space-y-1 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-semibold text-slate-700">{currentUser?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aadhaar:</span>
                      <span className="font-mono font-bold text-slate-700">{currentUser?.aadhaar}</span>
                    </div>
                    {currentUser?.pan && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">PAN:</span>
                        <span className="font-mono font-bold text-slate-700">{currentUser?.pan}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onSwitchPortalAuth(isAdmin ? 'tenant' : 'landlord');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                      <span>Switch to {isAdmin ? 'Tenant Resident Portal' : 'Landlord Portal'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out of Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  isActive 
                    ? (isAdmin ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold') 
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="mt-0.5 text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}

