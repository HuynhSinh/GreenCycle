import React, { useState } from 'react';
import { Navigation, Package, DollarSign, LogOut, Menu, X, User } from 'lucide-react';
import { logout } from '../../auth/api/auth';
import { useNavigate } from 'react-router-dom';
import {
  AssignedPickupsList,
  MyPickupsList,
  PickupHistoryList,
  UnassignedPickupsPanel,
  getActivePickups,
  useAssignedPickups,
  useUnassignedPickups,
} from '../../driver-pickups';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  const unassignedQuery = useUnassignedPickups();
  const assignedQuery = useAssignedPickups();
  const usingDemoData =
    unassignedQuery.data?.usingDemoData || assignedQuery.data?.usingDemoData || false;
  const activeOrders = getActivePickups(assignedQuery.data?.data || []).length;

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('userInfo');
      setIsLoading(false);
      navigate('/login');
    }
  };

  const driverStats = [
    { label: 'Active Orders', value: String(activeOrders), icon: Package },
    { label: 'Today Earnings', value: '$120', icon: DollarSign },
    { label: 'Avg Rating', value: '4.8', icon: User },
  ];

  const pageTitle =
    activeTab === 'history' ? 'Pickup History' : activeTab === 'earnings' ? 'Earnings' : 'Driver Dashboard';

  return (
    <div className="flex h-screen bg-slate-50">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900">
              GC
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Driver</span>}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={Navigation}
            label="Active Orders"
            sidebarOpen={sidebarOpen}
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
          />
          <NavItem
            icon={Package}
            label="History"
            sidebarOpen={sidebarOpen}
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <NavItem
            icon={DollarSign}
            label="Earnings"
            sidebarOpen={sidebarOpen}
            active={activeTab === 'earnings'}
            onClick={() => setActiveTab('earnings')}
          />
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-slate-600" />
            ) : (
              <Menu className="w-6 h-6 text-slate-600" />
            )}
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {usingDemoData && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Using demo data — API unavailable. Claim and status actions still work locally.
              </div>
            )}

            {activeTab === 'orders' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {driverStats.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <MyPickupsList />
                <UnassignedPickupsPanel />
                <AssignedPickupsList />
              </>
            )}

            {activeTab === 'history' && <PickupHistoryList />}

            {activeTab === 'earnings' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-slate-500 text-sm">
                Earnings view is coming soon.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, sidebarOpen, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
