import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import {
  approveCollectionSchedule,
  assignCollectionSchedule,
  getCollectionSchedule,
  rejectCollectionSchedule,
} from '../api/collectionSchedules';
import { friendlyError, successText } from '../../../lib/messages';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import BrandLogo from '../../../components/BrandLogo';

const statusStyles = {
  PENDING: 'border border-amber-300 bg-amber-50 text-amber-900',
  APPROVED: 'border border-teal-300 bg-teal-50 text-teal-800',
  ASSIGNED: 'border border-indigo-300 bg-indigo-50 text-indigo-800',
  COLLECTING: 'border border-blue-300 bg-blue-50 text-blue-800',
  ARRIVED: 'border border-violet-300 bg-violet-50 text-violet-800',
  COLLECTED: 'border border-emerald-300 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border border-slate-300 bg-slate-100 text-slate-700',
  REJECTED: 'border border-rose-300 bg-rose-50 text-rose-800',
  FAILED: 'border border-red-300 bg-red-50 text-red-800',
  RESCHEDULED: 'border border-orange-300 bg-orange-50 text-orange-800',
};

const PAGE_SIZE = 5;

const getLocalDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function CollectionScheduleManagement() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');
  const [pickupRequests, setPickupRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [paginationData, setPaginationData] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [metricsData, setMetricsData] = useState({
    requestsToSchedule: 0,
    assignedPickups: 0,
    activeDrivers: 0,
    timeConflicts: 0,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError('');

    try {
      const response = await getCollectionSchedule({
        date: scheduleDate,
        status: statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });

      const data = response.data;
      const nextRequests = (data.requests || []).map((request, index) => ({
        ...request,
        displayId: `PK-${String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(4, '0')}`,
      }));
      const nextDrivers = data.drivers || [];

      setPickupRequests(nextRequests);
      setDrivers(nextDrivers);
      setPaginationData(data.pagination || {
        page: currentPage,
        limit: PAGE_SIZE,
        total: nextRequests.length,
        totalPages: 1,
        hasNextPage: false,
      });
      setMetricsData(data.metrics || {
        requestsToSchedule: 0,
        assignedPickups: 0,
        activeDrivers: 0,
        timeConflicts: 0,
      });

      setSelectedRequestId((current) => (nextRequests.some((request) => request.id === current) ? current : ''));
      setSelectedDriverId((current) =>
        nextDrivers.some((driver) => driver.id === current) ? current : nextDrivers.find((driver) => driver.active)?.id || '',
      );
    } catch (error) {
      setScheduleError(friendlyError(error, 'Unable to load pickup requests. Please try again.'));
      setPickupRequests([]);
      setDrivers([]);
      setMetricsData({
        requestsToSchedule: 0,
        assignedPickups: 0,
        activeDrivers: 0,
        timeConflicts: 0,
      });
    } finally {
      setScheduleLoading(false);
    }
  }, [currentPage, scheduleDate, statusFilter]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const filteredRequests = useMemo(() => {
    return pickupRequests.filter((request) => {
      const matchesQuery = [request.displayId, request.customer, request.address, request.ward, request.items]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesQuery;
    });
  }, [pickupRequests, query]);

  const selectedRequest = pickupRequests.find((request) => request.id === selectedRequestId);
  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId);

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

  const metrics = [
    { label: 'Requests to schedule', value: metricsData.requestsToSchedule, icon: CalendarDays, accent: 'emerald' },
    { label: 'Assigned pickups', value: metricsData.assignedPickups, icon: PackageCheck, accent: 'sky' },
    { label: 'Active drivers', value: metricsData.activeDrivers, icon: Truck, accent: 'indigo' },
    { label: 'Time conflicts', value: metricsData.timeConflicts, icon: AlertTriangle, accent: 'amber' },
  ];

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const result = await approveCollectionSchedule(selectedRequest.id);
      setActionMessage(successText(result.message, 'Pickup request approved. You can now assign a driver.'));
      await loadSchedule();
    } catch (error) {
      setActionError(friendlyError(error, 'Unable to approve this request. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedDriver) return;

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const result = await assignCollectionSchedule({
        requestId: selectedRequest.id,
        driverId: selectedDriver.id,
      });

      setActionMessage(successText(result.message, 'Driver assigned to the pickup request.'));
      await loadSchedule();
    } catch (error) {
      setActionError(friendlyError(error, 'Unable to assign this driver. Please check capacity and schedule conflicts.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const result = await rejectCollectionSchedule(selectedRequest.id, rejectReason);
      setRejectReason('');
      setRejectModalOpen(false);
      setActionMessage(successText(result.message, 'Pickup request rejected.'));
      await loadSchedule();
    } catch (error) {
      setActionError(friendlyError(error, 'Unable to reject this request. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = selectedRequest && selectedRequest.status === 'PENDING';
  const canReject = selectedRequest && ['PENDING', 'APPROVED'].includes(selectedRequest.status);
  const canAssign = selectedRequest && selectedDriver?.active && selectedRequest.status === 'APPROVED';
  const showAssignmentControls = selectedRequest?.status === 'APPROVED';

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
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/dashboard/admin')}
          />
          <NavItem icon={Users} label="Drivers" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/drivers')} />
          <NavItem icon={CalendarDays} label="Schedules" sidebarOpen={sidebarOpen} active />
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

      <div className={`${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'} flex min-w-0 flex-1 flex-col`}>
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
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">Collection Schedule Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSchedule}
              disabled={scheduleLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <RefreshCw className={`h-4 w-4 ${scheduleLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{scheduleLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4"
            >
              {panelOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">{panelOpen ? 'Close Panel' : 'Open Panel'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {scheduleError && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {scheduleError}
            </div>
          )}

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const accentClasses = {
                emerald: 'bg-emerald-50 text-emerald-600',
                sky: 'bg-sky-50 text-sky-600',
                indigo: 'bg-indigo-50 text-indigo-600',
                amber: 'bg-amber-50 text-amber-600',
              };

              return (
                <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

          <section className={`grid grid-cols-1 gap-6 ${panelOpen ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Pickup Requests</h2>
                    <p className="mt-1 text-sm text-slate-600">Filter, review, approve, reject, and assign pickup requests.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex gap-2 sm:w-64">
                      <label className="block min-w-0 flex-1">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(event) => {
                            setCurrentPage(1);
                            setScheduleDate(event.target.value);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          aria-label="Filter by pickup date"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(1);
                          setScheduleDate(scheduleDate ? '' : getLocalDateInputValue());
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {scheduleDate ? 'All dates' : 'Today'}
                      </button>
                    </div>
                    <label className="relative block min-w-0 sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Search request, ward, item"
                      />
                    </label>
                    <label className="relative block sm:w-44">
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
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="COLLECTING">Collecting</option>
                        <option value="ARRIVED">Arrived</option>
                        <option value="COLLECTED">Collected</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="FAILED">Failed</option>
                        <option value="RESCHEDULED">Rescheduled</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <TableHead>Request</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Requested Time</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRequests.map((request) => {
                        const driver = drivers.find((item) => item.id === request.driverId);
                        const selected = request.id === selectedRequestId;

                        return (
                          <tr
                            key={request.id}
                            onClick={() => {
                              setSelectedRequestId(request.id);
                              setPanelOpen(true);
                            }}
                            className={`cursor-pointer transition-colors ${
                              selected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => setSelectedRequestId(request.id)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <p className="font-semibold text-slate-950">{request.displayId}</p>
                                  <p className="text-sm text-slate-600">{request.customer}</p>
                                  <p className="mt-1 text-xs font-medium text-slate-500">{request.items} - {request.weight}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-700">
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                <div>
                                  <p className="font-medium text-slate-900">{request.ward}</p>
                                  <p>{request.address}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-700">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                {request.preferredTime}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-700">{driver ? driver.name : 'Unassigned'}</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status] || 'border border-slate-300 bg-slate-100 text-slate-800'}`}>
                                {formatPickupStatus(request.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRequests.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                            {scheduleLoading ? 'Loading pickup requests...' : 'No pickup requests match the current filters.'}
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
                        )} of ${paginationData.total} requests`
                      : 'No requests to show'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={scheduleLoading || paginationData.page <= 1}
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
                      disabled={scheduleLoading || !paginationData.hasNextPage}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {panelOpen && (
            <aside className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Assignment Panel</h2>
                    <p className="mt-1 text-sm text-slate-600">Review the requested time, then approve, reject, or assign.</p>
                  </div>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close assignment panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedRequest && (
                  <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Selected request</p>
                    <p className="mt-1 font-bold text-slate-950">{selectedRequest.displayId} - {selectedRequest.customer}</p>
                    <p className="mt-1 text-sm text-slate-700">{selectedRequest.ward}, {selectedRequest.district}</p>
                    <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700">
                      Requested time: {selectedRequest.preferredTime}
                    </div>
                  </div>
                )}

                {selectedRequest?.evidenceImages?.length > 0 && (
                  <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Collection evidence</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRequest.evidenceImages.map((image) => (
                        <a
                          key={image.id}
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          title={`Open ${image.category} evidence`}
                        >
                          <img src={image.url} alt={`${image.category} evidence`} className="h-24 w-full object-cover transition-transform group-hover:scale-105" />
                          <div className="px-2 py-1 text-xs font-semibold text-slate-600">{image.category}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {showAssignmentControls ? (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Available drivers</p>
                  <div className="space-y-3">
                    {drivers.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        disabled={!driver.active}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          selectedDriverId === driver.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{driver.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{driver.vehicle}</p>
                            <p className="mt-1 text-xs text-slate-500">{driver.window} - {driver.load}</p>
                          </div>
                          {driver.conflict ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          )}
                        </div>
                      </button>
                    ))}
                    {drivers.length === 0 && (
                      <div className="rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-500">
                        No available drivers for the selected date.
                      </div>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                    {selectedRequest ? 'Approve the request before selecting a driver.' : 'Select a pickup request to review details and take action.'}
                  </div>
                )}

                {actionMessage && (
                  <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {actionMessage}
                  </div>
                )}

                {actionError && (
                  <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {actionError}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={!canApprove || actionLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectReason('');
                      setRejectModalOpen(true);
                    }}
                    disabled={!canReject || actionLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-rose-600 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!canAssign || actionLoading}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Truck className="h-4 w-4" />
                    Assign
                  </button>
                </div>
              </div>
            </aside>
            )}
          </section>
        </main>
      </div>

      <ConfirmDialog
        open={rejectModalOpen && Boolean(selectedRequest)}
        tone="danger"
        title="Reject this pickup request?"
        description="The customer will not be scheduled for this request after it is rejected."
        details={selectedRequest ? `${selectedRequest.displayId} - ${selectedRequest.customer}` : ''}
        confirmLabel="Reject request"
        cancelLabel="Keep request"
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setRejectModalOpen(false);
        }}
        onConfirm={handleReject}
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Reject reason</span>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            placeholder="Optional"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}

function TableHead({ children }) {
  return <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-600">{children}</th>;
}

function formatPickupStatus(status) {
  const labels = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    ASSIGNED: 'Assigned',
    COLLECTING: 'Collecting',
    ARRIVED: 'Arrived',
    COLLECTED: 'Collected',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
    FAILED: 'Failed',
    RESCHEDULED: 'Rescheduled',
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
