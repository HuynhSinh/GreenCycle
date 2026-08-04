import React, { useState } from 'react';
import { Plus, History, Award, Truck, LogOut, Menu, X, MapPin, Clock } from 'lucide-react';
import { logout } from '../../auth/api/auth';
import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('userInfo');
      setIsLoading(false);
      navigate('/login');
    }
  };

  const userStats = [
    { label: 'Total Pickups', value: '24', icon: Truck },
    { label: 'Points Earned', value: '2,450', icon: Award },
    { label: 'Pending', value: '3', icon: Clock },
  ];

  const recentPickups = [
    { id: 'PK-1001', status: 'COMPLETED', date: '2026-07-19', items: '5 kg' },
    { id: 'PK-1002', status: 'IN_TRANSIT', date: '2026-07-20', items: '3 kg' },
    { id: 'PK-1003', status: 'PENDING', date: '2026-07-20', items: '2 kg' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-emerald-700 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-emerald-700">
              GC
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Customer</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={Truck} label="My Pickups" sidebarOpen={sidebarOpen} active />
          <NavItem icon={History} label="History" sidebarOpen={sidebarOpen} />
          <NavItem icon={Award} label="Rewards" sidebarOpen={sidebarOpen} />
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-emerald-600">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              <Plus className="w-5 h-5" />
              New Pickup
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {userStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <IconComponent className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Pickups */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Recent Pickups</h2>
                <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                  View All →
                </a>
              </div>
              <div className="space-y-4 p-6">
                {recentPickups.map((pickup) => (
                  <div
                    key={pickup.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{pickup.id}</p>
                        <p className="text-sm text-slate-600">{pickup.items} • {pickup.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pickup.status)}`}>
                      {pickup.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, sidebarOpen, active }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-emerald-100 hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
