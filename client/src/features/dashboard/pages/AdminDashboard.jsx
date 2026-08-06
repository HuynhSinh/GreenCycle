import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Menu,
  PackageCheck,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import { getCollectionSchedule } from '../../collection-schedules/api/collectionSchedules';
import { getAdminDrivers } from '../../drivers/api/drivers';
import { getAdminRewards } from '../../rewards/api/rewards';
import { friendlyError } from '../../../lib/messages';
import BrandLogo from '../../../components/BrandLogo';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [summary, setSummary] = useState({
    schedules: null,
    drivers: null,
    rewards: null,
  });

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError('');

    try {
      const [scheduleResponse, driverResponse, rewardResponse] = await Promise.all([
        getCollectionSchedule({ status: 'ALL', page: 1, limit: 1 }),
        getAdminDrivers({ status: 'ALL', page: 1, limit: 1 }),
        getAdminRewards({ type: 'ALL', page: 1, limit: 1 }),
      ]);

      setSummary({
        schedules: scheduleResponse.data || null,
        drivers: driverResponse.data || null,
        rewards: rewardResponse.data || null,
      });
    } catch (error) {
      setDashboardError(friendlyError(error, 'Unable to load dashboard metrics. Please try again.'));
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const metrics = useMemo(() => {
    const scheduleMetrics = summary.schedules?.metrics || {};
    const driverMetrics = summary.drivers?.metrics || {};
    const rewardMetrics = summary.rewards?.metrics || {};

    return [
      {
        label: 'Requests to schedule',
        value: scheduleMetrics.requestsToSchedule || 0,
        icon: CalendarDays,
        tone: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Assigned pickups',
        value: scheduleMetrics.assignedPickups || 0,
        icon: PackageCheck,
        tone: 'bg-sky-50 text-sky-600',
      },
      {
        label: 'Active drivers',
        value: driverMetrics.activeDrivers || 0,
        icon: Truck,
        tone: 'bg-indigo-50 text-indigo-600',
      },
      {
        label: 'Available rewards',
        value: rewardMetrics.availableRewards || 0,
        icon: Award,
        tone: 'bg-amber-50 text-amber-600',
      },
    ];
  }, [summary]);

  const modules = [
    {
      label: 'Driver Management',
      description: 'Create, approve, enable, and disable driver accounts.',
      icon: Users,
      action: () => navigate('/dashboard/admin/drivers'),
    },
    {
      label: 'Collection Schedules',
      description: 'Review pickup requests, approve them, and assign drivers.',
      icon: CalendarDays,
      action: () => navigate('/dashboard/admin/schedules'),
    },
    {
      label: 'Reward Management',
      description: 'Create physical rewards, update stock, and review availability.',
      icon: Award,
      action: () => navigate('/dashboard/admin/rewards'),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed inset-y-0 left-0 z-20 flex flex-col bg-slate-900 text-white transition-all duration-300 lg:static`}
      >
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10 rounded-lg bg-white p-1" />
            {sidebarOpen && <span className="text-lg font-bold">Admin</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <NavItem icon={BarChart3} label="Dashboard" sidebarOpen={sidebarOpen} active />
          <NavItem icon={Users} label="Drivers" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/drivers')} />
          <NavItem icon={CalendarDays} label="Schedules" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/schedules')} />
          <NavItem icon={Award} label="Rewards" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/rewards')} />
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
          </button>
          <div className="min-w-0 px-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Operations</p>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">Admin Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            disabled={dashboardLoading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-4"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">{dashboardLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {dashboardError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {dashboardError}
            </div>
          )}

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">
                        {dashboardLoading ? '-' : metric.value}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${metric.tone}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">Operational Overview</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Metrics are loaded from the driver, schedule, and reward modules.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.label}
                      type="button"
                      onClick={module.action}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-emerald-300 hover:bg-white hover:shadow-sm"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-slate-950">{module.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                      <p className="mt-4 text-sm font-semibold text-emerald-700">Open module</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Attention Needed</h2>
              <div className="mt-4 space-y-3">
                <InfoRow label="Drivers pending approval" value={summary.drivers?.metrics?.pendingApproval || 0} />
                <InfoRow label="Drivers missing profiles" value={summary.drivers?.metrics?.pendingProfiles || 0} />
                <InfoRow label="Low stock rewards" value={summary.rewards?.metrics?.lowStockRewards || 0} />
                <InfoRow label="Schedule conflicts" value={summary.schedules?.metrics?.timeConflicts || 0} />
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

function NavItem({ icon: Icon, label, sidebarOpen, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      <Icon className="h-5 w-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
