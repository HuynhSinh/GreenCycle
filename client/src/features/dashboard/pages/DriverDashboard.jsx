import React, { useState } from 'react';
import { Navigation, Package, DollarSign, LogOut, Menu, X, Clock, MapPin, User } from 'lucide-react';
import { logout } from '../../auth/api/auth';
import { useNavigate } from 'react-router-dom';

export default function DriverDashboard() {
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

  const driverStats = [
    { label: 'Active Orders', value: '5', icon: Package },
    { label: 'Today Earnings', value: '$120', icon: DollarSign },
    { label: 'Avg Rating', value: '4.8', icon: User },
  ];

  const assignedPickups = [
    { id: 'PK-1001', customer: 'John Doe', address: '123 Main St', status: 'COLLECTING', distance: '2.5 km' },
    { id: 'PK-1002', customer: 'Jane Smith', address: '456 Oak Ave', status: 'COLLECTED', distance: '5.2 km' },
    { id: 'PK-1003', customer: 'Bob Wilson', address: '789 Pine Rd', status: 'ASSIGNED', distance: '8.1 km' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      COLLECTING: 'bg-blue-100 text-blue-800',
      COLLECTED: 'bg-emerald-100 text-emerald-800',
      ASSIGNED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900">
              GC
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Driver</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={Navigation} label="Active Orders" sidebarOpen={sidebarOpen} active />
          <NavItem icon={Package} label="History" sidebarOpen={sidebarOpen} />
          <NavItem icon={DollarSign} label="Earnings" sidebarOpen={sidebarOpen} />
        </nav>

        {/* Logout Button */}
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
          <h1 className="text-2xl font-bold text-slate-900">Driver Dashboard</h1>
          <div className="w-10" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {driverStats.map((stat, index) => {
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
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assigned Pickups */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Assigned Pickups</h2>
              </div>
              <div className="space-y-4 p-6">
                {assignedPickups.map((pickup) => (
                  <div
                    key={pickup.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-slate-900">{pickup.id}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(pickup.status)}`}>
                          {pickup.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {pickup.customer}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pickup.address}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {pickup.distance}
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
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
        active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
