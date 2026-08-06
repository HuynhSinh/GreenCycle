import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import { getDriverAssignments, updateDriverAssignmentStatus } from '../../driver-assignments/api/driverAssignments';
import { getDriverProfile, updateDriverProfile } from '../../drivers/api/drivers';
import { friendlyError } from '../../../lib/messages';
import BrandLogo from '../../../components/BrandLogo';

const emptyProfile = {
  fullName: '',
  phoneNumber: '',
  vehicleInfo: '',
  licensePlate: '',
  maxCapacityKg: '',
  email: '',
};

const statusMeta = {
  ACTIVE: {
    label: 'Approved',
    tone: 'border border-emerald-300 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  INACTIVE: {
    label: 'Inactive',
    tone: 'border border-slate-300 bg-slate-100 text-slate-700',
    icon: AlertTriangle,
  },
  PENDING_APPROVAL: {
    label: 'Pending approval',
    tone: 'border border-amber-300 bg-amber-50 text-amber-900',
    icon: Clock,
  },
  PENDING_PROFILE: {
    label: 'Profile required',
    tone: 'border border-rose-300 bg-rose-50 text-rose-800',
    icon: AlertTriangle,
  },
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [collectionForm, setCollectionForm] = useState({ evidenceImageDataUri: '', items: {} });
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const status = profile?.status || 'PENDING_PROFILE';
  const active = status === 'ACTIVE';
  const StatusIcon = statusMeta[status]?.icon || AlertTriangle;
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getDriverProfile();
      const data = response.data;

      setProfile(data);
      setForm({
        fullName: data.driver?.fullName || '',
        phoneNumber: data.driver?.phoneNumber || '',
        vehicleInfo: data.driver?.vehicleInfo || '',
        licensePlate: data.driver?.licensePlate || '',
        maxCapacityKg: data.driver?.maxCapacityKg ? String(data.driver.maxCapacityKg) : '',
        email: data.email || '',
      });
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to load the driver profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setAssignmentLoading(true);
    setAssignmentError('');

    try {
      const response = await getDriverAssignments();
      const data = response.data || {};
      const nextAssignments = data.assignments || [];

      setAssignments(nextAssignments);
      setActiveAssignmentId(data.activeAssignmentId || null);
      setSelectedAssignmentId((current) =>
        nextAssignments.some((assignment) => assignment.id === current) ? current : nextAssignments[0]?.id || '',
      );
    } catch (requestError) {
      setAssignmentError(friendlyError(requestError, 'Unable to load assigned tasks. Please try again.'));
      setAssignments([]);
      setActiveAssignmentId(null);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'assignments' && active) {
      loadAssignments();
    }
  }, [activeTab, active]);

  const profileStats = useMemo(
    () => [
      {
        label: 'Profile status',
        value: statusMeta[status]?.label || status,
        icon: StatusIcon,
        tone: active ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
      },
      {
        label: 'Active assignments',
        value: profile?.driver?.activeAssignments || 0,
        icon: Package,
        tone: 'text-sky-600 bg-sky-50',
      },
      {
        label: 'Completed pickups',
        value: profile?.driver?.completedAssignments || 0,
        icon: ClipboardCheck,
        tone: 'text-slate-600 bg-slate-100',
      },
    ],
    [StatusIcon, active, profile, status],
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    } finally {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setLoggingOut(false);
      navigate('/login');
    }
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCollectionWeightChange = (wasteItemId, value) => {
    setCollectionForm((current) => ({
      ...current,
      items: {
        ...current.items,
        [wasteItemId]: value,
      },
    }));
  };

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCollectionForm((current) => ({
        ...current,
        evidenceImageDataUri: String(reader.result || ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetCollectionForm = (assignment) => {
    setCollectionForm({
      evidenceImageDataUri: '',
      items: Object.fromEntries((assignment?.wasteItems || []).map((item) => [item.id, item.actualWeight || item.scheduledWeight || ''])),
    });
  };

  const handleSelectAssignment = (assignment) => {
    setSelectedAssignmentId(assignment.id);
    setAssignmentMessage('');
    setAssignmentError('');
    resetCollectionForm(assignment);
  };

  const handleAssignmentStatus = async (nextStatus) => {
    if (!selectedAssignment) return;

    setAssignmentLoading(true);
    setAssignmentMessage('');
    setAssignmentError('');

    try {
      const payload =
        nextStatus === 'COLLECTED'
          ? {
              status: nextStatus,
              evidenceImageDataUri: collectionForm.evidenceImageDataUri,
              items: selectedAssignment.wasteItems.map((item) => ({
                wasteItemId: item.id,
                actualWeight: Number(collectionForm.items[item.id] || 0),
              })),
            }
          : { status: nextStatus };
      const result = await updateDriverAssignmentStatus(selectedAssignment.id, payload);

      const nextMessages = {
        COLLECTING: 'Pickup started. Please work on one assignment at a time.',
        ARRIVED: 'Arrival at the pickup location has been recorded.',
        COLLECTED: 'Pickup marked as collected. Evidence photo and actual weights were saved.',
      };
      setAssignmentMessage(nextMessages[nextStatus] || 'Assignment updated.');
      await loadAssignments();
      resetCollectionForm(result.data);
    } catch (requestError) {
      setAssignmentError(friendlyError(requestError, 'Unable to update this assignment. Please check the information and try again.'));
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        vehicleInfo: form.vehicleInfo.trim(),
        licensePlate: form.licensePlate.trim(),
        maxCapacityKg: Number(form.maxCapacityKg),
        email: form.email.trim(),
      };
      const response = await updateDriverProfile(payload);
      const wasApproved = profile?.status === 'ACTIVE';

      setProfile(response.data);
      setMessage(
        wasApproved
          ? 'Profile updated and sent for admin approval. Assignments are paused until approval.'
          : response.message || 'Profile submitted. Please wait for admin approval before receiving assignments.',
      );
      setForm({
        fullName: response.data.driver?.fullName || '',
        phoneNumber: response.data.driver?.phoneNumber || '',
        vehicleInfo: response.data.driver?.vehicleInfo || '',
        licensePlate: response.data.driver?.licensePlate || '',
        maxCapacityKg: response.data.driver?.maxCapacityKg ? String(response.data.driver.maxCapacityKg) : '',
        email: response.data.email || '',
      });
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to save the driver profile. Please check the information and try again.'));
    } finally {
      setSaving(false);
    }
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
            <BrandLogo className="h-10 w-10 rounded-lg bg-white p-1" />
            {sidebarOpen && <span className="text-lg font-bold">Driver</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <NavItem icon={User} label="Profile" sidebarOpen={sidebarOpen} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <NavItem icon={Truck} label="Assignments" sidebarOpen={sidebarOpen} active={activeTab === 'assignments'} disabled={!active} onClick={() => setActiveTab('assignments')} />
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
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
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Driver Portal</p>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {activeTab === 'assignments' ? 'My Assignments' : 'My Profile'}
            </h1>
          </div>
          <span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${statusMeta[status]?.tone}`}>
            {statusMeta[status]?.label || status}
          </span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-600">
              Loading driver profile...
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              {activeTab === 'assignments' ? (
              <section className="space-y-6 xl:col-span-2">
                {assignmentError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {assignmentError}
                  </div>
                )}
                {assignmentMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {assignmentMessage}
                  </div>
                )}

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Assigned Pickups</h2>
                        <p className="mt-1 text-sm text-slate-600">Work on one pickup at a time and submit evidence when collection is complete.</p>
                      </div>
                      <button
                        type="button"
                        onClick={loadAssignments}
                        disabled={assignmentLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 ${assignmentLoading ? 'animate-spin' : ''}`} />
                        {assignmentLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {assignments.map((assignment) => {
                        const selected = assignment.id === selectedAssignmentId;
                        return (
                          <button
                            key={assignment.id}
                            type="button"
                            onClick={() => handleSelectAssignment(assignment)}
                            className={`w-full px-5 py-4 text-left transition-colors ${selected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-semibold text-slate-950">{assignment.customer}</p>
                                <p className="mt-1 text-sm text-slate-600">{assignment.address}, {assignment.ward}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{assignment.scheduledTimeLabel}</p>
                              </div>
                              <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${taskStatusStyles[assignment.status] || 'bg-slate-100 text-slate-700'}`}>
                                {assignment.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {assignments.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                          {assignmentLoading ? 'Loading assignments...' : 'No assignments have been assigned yet.'}
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    {selectedAssignment ? (
                      <>
                        <div className="mb-5">
                          <h2 className="text-lg font-bold text-slate-900">Pickup Task</h2>
                          <p className="mt-1 text-sm text-slate-600">{selectedAssignment.district} - {selectedAssignment.scheduledTimeLabel}</p>
                        </div>

                        <div className="space-y-3">
                          <Info label="Customer" value={selectedAssignment.customer} />
                          <Info label="Address" value={`${selectedAssignment.address}, ${selectedAssignment.ward}`} />
                          <Info label="Scheduled weight" value={`${Number(selectedAssignment.totalWeight || 0).toFixed(1).replace(/\.0$/, '')} kg`} />
                        </div>

                        <div className="mt-5 space-y-3">
                          {selectedAssignment.status === 'ASSIGNED' && (
                            <button
                              type="button"
                              onClick={() => handleAssignmentStatus('COLLECTING')}
                              disabled={assignmentLoading || (activeAssignmentId && activeAssignmentId !== selectedAssignment.id)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <Truck className="h-4 w-4" />
                              Start Pickup
                            </button>
                          )}
                          {selectedAssignment.status === 'COLLECTING' && (
                            <button
                              type="button"
                              onClick={() => handleAssignmentStatus('ARRIVED')}
                              disabled={assignmentLoading}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark Arrived
                            </button>
                          )}

                          {['COLLECTING', 'ARRIVED'].includes(selectedAssignment.status) && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <Field label="Evidence photo" required>
                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-center transition-colors hover:bg-slate-50">
                                  {collectionForm.evidenceImageDataUri ? (
                                    <img src={collectionForm.evidenceImageDataUri} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
                                  ) : (
                                    <Camera className="mb-2 h-7 w-7 text-slate-400" />
                                  )}
                                  <span className="text-sm font-semibold text-slate-700">Choose photo</span>
                                  <input type="file" accept="image/*" capture="environment" onChange={handleEvidenceChange} className="sr-only" />
                                </label>
                              </Field>

                              <div className="mt-4 space-y-3">
                                {selectedAssignment.wasteItems.map((item) => (
                                  <Field key={item.id} label={`${item.category} actual kg`} required>
                                    <input
                                      required
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      value={collectionForm.items[item.id] || ''}
                                      onChange={(event) => handleCollectionWeightChange(item.id, event.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </Field>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAssignmentStatus('COLLECTED')}
                                disabled={assignmentLoading}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                <ClipboardCheck className="h-4 w-4" />
                                Mark Collected
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-sm font-medium text-slate-500">Select an assignment to view details.</div>
                    )}
                  </aside>
                </section>
              </section>
              ) : (
              <>
              <section className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {message}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {profileStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                            <p className="mt-2 text-2xl font-bold text-slate-950">{stat.value}</p>
                          </div>
                          <div className={`rounded-lg p-3 ${stat.tone}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!active && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                    Driver profile must be approved by admin before this account can receive assignments.
                  </div>
                )}

                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-5">
                    <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
                    <p className="mt-1 text-sm text-slate-600">Submit accurate contact and vehicle information for admin verification.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                    <Field label="Full name" required>
                      <input
                        required
                        value={form.fullName}
                        onChange={(event) => handleChange('fullName', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Phone number" required>
                      <input
                        required
                        minLength={8}
                        value={form.phoneNumber}
                        onChange={(event) => handleChange('phoneNumber', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Vehicle" required>
                      <input
                        required
                        value={form.vehicleInfo}
                        onChange={(event) => handleChange('vehicleInfo', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Truck, van, motorbike..."
                      />
                    </Field>
                    <Field label="License plate" required>
                      <input
                        required
                        value={form.licensePlate}
                        onChange={(event) => handleChange('licensePlate', event.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Maximum capacity (kg)" required>
                      <input
                        required
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={form.maxCapacityKg}
                        onChange={(event) => handleChange('maxCapacityKg', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Email" required>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) => handleChange('email', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>

                    <div className="flex items-end md:justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Submitting...' : 'Submit Profile'}
                      </button>
                    </div>
                  </form>
                </section>

                {active && (
                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Assignments</h2>
                    <p className="mt-1 text-sm text-slate-600">This account is approved and can receive new pickup assignments from admin.</p>
                  </section>
                )}
              </section>

              <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Verification</h2>
                    <p className="text-sm text-slate-600">@{profile?.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Info label="Account email" value={profile?.email || 'Not set'} />
                  <Info label="Full name" value={profile?.driver?.fullName || 'Not submitted'} />
                  <Info label="Phone" value={profile?.driver?.phoneNumber || 'Not submitted'} />
                  <Info label="Vehicle" value={profile?.driver?.vehicleInfo || 'Not submitted'} />
                  <Info label="License plate" value={profile?.driver?.licensePlate || 'Not submitted'} />
                  <Info label="Maximum capacity" value={profile?.driver?.maxCapacityKg ? `${profile.driver.maxCapacityKg} kg` : 'Not submitted'} />
                </div>

                <div className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${statusMeta[status]?.tone}`}>
                  {statusMeta[status]?.label || status}
                </div>
              </aside>
              </>
              )}
            </div>
          )}
        </main>
      </div>
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

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const taskStatusStyles = {
  ASSIGNED: 'border border-indigo-300 bg-indigo-50 text-indigo-800',
  COLLECTING: 'border border-blue-300 bg-blue-50 text-blue-800',
  ARRIVED: 'border border-violet-300 bg-violet-50 text-violet-800',
  COLLECTED: 'border border-emerald-300 bg-emerald-50 text-emerald-800',
  FAILED: 'border border-red-300 bg-red-50 text-red-800',
};

function NavItem({ icon: Icon, label, sidebarOpen, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Icon className="h-5 w-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
