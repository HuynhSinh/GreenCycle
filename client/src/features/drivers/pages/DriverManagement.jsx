import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ToggleLeft,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import {
  approveAdminDriver,
  createAdminDriver,
  disableAdminDriver,
  getAdminDrivers,
} from '../api/drivers';
import { friendlyError, successText } from '../../../lib/messages';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const PAGE_SIZE = 5;

const emptyForm = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  phoneNumber: '',
  vehicleInfo: '',
  licensePlate: '',
  maxCapacityKg: '',
};

const statusStyles = {
  ACTIVE: 'border border-emerald-300 bg-emerald-50 text-emerald-800',
  INACTIVE: 'border border-slate-300 bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'border border-amber-300 bg-amber-50 text-amber-900',
  PENDING_PROFILE: 'border border-rose-300 bg-rose-50 text-rose-800',
};

export default function DriverManagement() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [metricsData, setMetricsData] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
    pendingApproval: 0,
    pendingProfiles: 0,
  });
  const [paginationData, setPaginationData] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [driversLoading, setDriversLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [driverError, setDriverError] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId);

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true);
    setDriverError('');

    try {
      const response = await getAdminDrivers({
        q: query,
        status: statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const data = response.data;
      const nextDrivers = data.drivers || [];

      setDrivers(nextDrivers);
      setMetricsData(data.metrics || {
        totalDrivers: 0,
        activeDrivers: 0,
        inactiveDrivers: 0,
        pendingApproval: 0,
        pendingProfiles: 0,
      });
      setPaginationData(data.pagination || {
        page: currentPage,
        limit: PAGE_SIZE,
        total: nextDrivers.length,
        totalPages: 1,
        hasNextPage: false,
      });
      setSelectedDriverId((current) => (nextDrivers.some((driver) => driver.id === current) ? current : ''));
    } catch (error) {
      setDriverError(friendlyError(error, 'Unable to load drivers. Please try again.'));
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, [currentPage, query, statusFilter]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const metrics = useMemo(
    () => [
      { label: 'Driver accounts', value: metricsData.totalDrivers, icon: Users, accent: 'emerald' },
      { label: 'Active drivers', value: metricsData.activeDrivers, icon: Truck, accent: 'sky' },
      { label: 'Inactive drivers', value: metricsData.inactiveDrivers, icon: ToggleLeft, accent: 'slate' },
      { label: 'Pending approval', value: metricsData.pendingApproval, icon: AlertTriangle, accent: 'amber' },
      { label: 'Missing profiles', value: metricsData.pendingProfiles, icon: AlertTriangle, accent: 'rose' },
    ],
    [metricsData],
  );

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

  const handleSelectDriver = (driver) => {
    setSelectedDriverId(driver.id);
    setDetailOpen(true);
    setCreateOpen(false);
    setMessage('');
    setActionError('');
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
    setDetailOpen(false);
    setSelectedDriverId('');
    setMessage('');
    setActionError('');
  };

  const handleClosePanel = () => {
    setCreateOpen(false);
    setDetailOpen(false);
    setSelectedDriverId('');
    setMessage('');
    setActionError('');
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateDriver = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setMessage('');
    setActionError('');

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.fullName.trim() ? { fullName: form.fullName.trim() } : {}),
        ...(form.phoneNumber.trim() ? { phoneNumber: form.phoneNumber.trim() } : {}),
        vehicleInfo: form.vehicleInfo.trim(),
        licensePlate: form.licensePlate.trim(),
        ...(form.maxCapacityKg ? { maxCapacityKg: Number(form.maxCapacityKg) } : {}),
      };
      const result = await createAdminDriver(payload);

      setMessage('Driver account created. The driver can sign in and update their profile.');
      setForm(emptyForm);
      setCreateOpen(false);
      setSelectedDriverId(result.data.id);
      setDetailOpen(true);
      await loadDrivers();
    } catch (error) {
      setActionError(friendlyError(error, 'Unable to create this driver account. Please check the information and try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDriverAction = async (action) => {
    if (!selectedDriver) return;

    setActionLoading(true);
    setMessage('');
    setActionError('');

    try {
      const actions = {
        approve: approveAdminDriver,
        disable: disableAdminDriver,
      };
      const result = await actions[action](selectedDriver.id);

      setMessage(successText(result.message, action === 'approve' ? 'Driver approved and activated.' : 'Driver disabled.'));
      await loadDrivers();
    } catch (error) {
      setActionError(friendlyError(error, 'Unable to update this driver status. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDriverDisable = async () => {
    await handleDriverAction('disable');
    setConfirmDialog(null);
  };

  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed inset-y-0 left-0 z-20 flex flex-col bg-slate-900 text-white transition-all duration-300 lg:static`}
      >
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 font-bold">
              GC
            </div>
            {sidebarOpen && <span className="text-lg font-bold">Admin</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin')} />
          <NavItem icon={Users} label="Drivers" sidebarOpen={sidebarOpen} active />
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
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">Driver Management</h1>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Driver</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {driverError && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {driverError}
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
                      <p className="mt-2 text-3xl font-bold text-slate-950">{metric.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${accentClasses[metric.accent]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className={`grid grid-cols-1 items-start gap-6 ${detailOpen || createOpen ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
            <div className="self-start rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Drivers</h2>
                  <p className="mt-1 text-sm text-slate-600">Search, filter, approve, or disable driver accounts.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block min-w-0 sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setQuery(event.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Search name, email, plate"
                    />
                  </label>
                  <label className="relative block sm:w-52">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setStatusFilter(event.target.value);
                      }}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="PENDING_APPROVAL">Pending approval</option>
                      <option value="PENDING_PROFILE">Pending profile</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>Driver</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Status</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {drivers.map((driver) => {
                      const selected = driver.id === selectedDriverId;

                      return (
                        <tr
                          key={driver.id}
                          onClick={() => handleSelectDriver(driver)}
                          className={`cursor-pointer transition-colors ${selected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-950">{driver.driver?.fullName || driver.username}</p>
                            <p className="text-sm text-slate-600">@{driver.username}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            <p>{driver.email}</p>
                            <p className="mt-1 text-slate-500">{driver.driver?.phoneNumber || 'Profile not completed'}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            <p>{driver.driver?.vehicleInfo || 'Not set'}</p>
                            <p className="mt-1 text-slate-500">
                              {[driver.driver?.licensePlate || 'No plate', driver.driver?.maxCapacityKg ? `${driver.driver.maxCapacityKg} kg max` : null]
                                .filter(Boolean)
                                .join(' - ')}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            {driver.driver ? `${driver.driver.activeAssignments} active / ${driver.driver.totalAssignments} total` : 'No profile'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[driver.status]}`}>
                              {formatDriverStatus(driver.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {drivers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                          {driversLoading ? 'Loading drivers...' : 'No drivers match the current filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {paginationData.total > 0
                    ? `Showing ${(paginationData.page - 1) * paginationData.limit + 1}-${Math.min(
                        paginationData.page * paginationData.limit,
                        paginationData.total,
                      )} of ${paginationData.total} drivers`
                    : 'No drivers to show'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={driversLoading || paginationData.page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="min-w-24 text-center text-sm font-semibold text-slate-700">
                    Page {paginationData.page} of {paginationData.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={driversLoading || !paginationData.hasNextPage}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {detailOpen && selectedDriver && (
              <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Driver Details</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedDriver.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePanel}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close driver detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Info label="Account" value={selectedDriver.username} />
                  <Info label="Full name" value={selectedDriver.driver?.fullName || 'Profile not completed'} />
                  <Info label="Phone" value={selectedDriver.driver?.phoneNumber || 'Not set'} />
                  <Info label="Vehicle" value={selectedDriver.driver?.vehicleInfo || 'Not set'} />
                  <Info label="License plate" value={selectedDriver.driver?.licensePlate || 'Not set'} />
                  <Info label="Maximum capacity" value={selectedDriver.driver?.maxCapacityKg ? `${selectedDriver.driver.maxCapacityKg} kg` : 'Not set'} />
                  <Info label="Assignments" value={selectedDriver.driver ? `${selectedDriver.driver.activeAssignments} active / ${selectedDriver.driver.totalAssignments} total` : 'No profile'} />
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selectedDriver.status]}`}>
                      {formatDriverStatus(selectedDriver.status)}
                    </span>
                  </div>
                </div>

                {message && (
                  <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {message}
                  </div>
                )}
                {actionError && (
                  <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {actionError}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3">
                  {selectedDriver.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDialog({ type: 'disableDriver', driver: selectedDriver })}
                      disabled={actionLoading || !selectedDriver.profileComplete}
                      className="flex items-center justify-center gap-2 rounded-lg border border-rose-600 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                    >
                      <ToggleLeft className="h-4 w-4" />
                      Disable Driver
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDriverAction('approve')}
                      disabled={actionLoading || !selectedDriver.profileComplete}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <UserCheck className="h-4 w-4" />
                      {selectedDriver.status === 'PENDING_APPROVAL' ? 'Approve Driver' : 'Reactivate Driver'}
                    </button>
                  )}
                </div>
              </aside>
            )}

            {createOpen && (
              <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Create Driver Account</h2>
                    <p className="mt-1 text-sm text-slate-600">The driver can sign in and complete their profile later.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePanel}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close create driver panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateDriver} className="space-y-4">
                  <Field label="Username" required>
                    <input minLength={3} required value={form.username} onChange={(event) => handleFormChange('username', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={form.email} onChange={(event) => handleFormChange('email', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>
                  <Field label="Temporary password" required>
                    <input type="password" minLength={8} required value={form.password} onChange={(event) => handleFormChange('password', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </Field>
                  <Field label="Full name">
                    <input value={form.fullName} onChange={(event) => handleFormChange('fullName', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>
                  <Field label="Phone number">
                    <input minLength={8} value={form.phoneNumber} onChange={(event) => handleFormChange('phoneNumber', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>
                  <Field label="Vehicle">
                    <input value={form.vehicleInfo} onChange={(event) => handleFormChange('vehicleInfo', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>
                  <Field label="License plate">
                    <input value={form.licensePlate} onChange={(event) => handleFormChange('licensePlate', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>
                  <Field label="Maximum capacity (kg)">
                    <input type="number" min="0.1" step="0.1" value={form.maxCapacityKg} onChange={(event) => handleFormChange('maxCapacityKg', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
                  </Field>

                  {message && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                      {message}
                    </div>
                  )}
                  {actionError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                      {actionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                    {actionLoading ? 'Creating...' : 'Create Driver'}
                  </button>
                </form>
              </aside>
            )}
          </section>
        </main>
      </div>

      <ConfirmDialog
        open={confirmDialog?.type === 'disableDriver'}
        tone="danger"
        title="Disable this driver?"
        description="This driver will not be able to receive new assignments until an admin reactivates the account."
        details={confirmDialog?.driver ? `${confirmDialog.driver.driver?.fullName || confirmDialog.driver.username} - ${confirmDialog.driver.email}` : ''}
        confirmLabel="Disable driver"
        cancelLabel="Keep active"
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmDialog(null);
        }}
        onConfirm={handleConfirmDriverDisable}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TableHead({ children }) {
  return <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-600">{children}</th>;
}

function formatDriverStatus(status) {
  const labels = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING_APPROVAL: 'Pending approval',
    PENDING_PROFILE: 'Pending profile',
  };

  return labels[status] || status;
}

function NavItem({ icon: Icon, label, sidebarOpen, active, onClick }) {
  return (
    <button
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
