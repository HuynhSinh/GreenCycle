import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  LogOut,
  Menu,
  Package,
  Save,
  ShieldCheck,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import { getDriverProfile, updateDriverProfile } from '../../drivers/api/drivers';

const emptyProfile = {
  fullName: '',
  phoneNumber: '',
  vehicleInfo: '',
  licensePlate: '',
  email: '',
};

const statusMeta = {
  ACTIVE: {
    label: 'Approved',
    tone: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
  INACTIVE: {
    label: 'Waiting approval',
    tone: 'bg-amber-100 text-amber-800',
    icon: Clock,
  },
  PENDING_PROFILE: {
    label: 'Profile required',
    tone: 'bg-rose-100 text-rose-800',
    icon: AlertTriangle,
  },
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const status = profile?.status || 'PENDING_PROFILE';
  const active = status === 'ACTIVE';
  const StatusIcon = statusMeta[status]?.icon || AlertTriangle;

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
        email: data.email || '',
      });
    } catch (requestError) {
      setError(requestError.message || 'Could not load driver profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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
        email: form.email.trim(),
      };
      const response = await updateDriverProfile(payload);

      setProfile(response.data);
      setMessage(response.message || 'Profile submitted and waiting for admin approval.');
      setForm({
        fullName: response.data.driver?.fullName || '',
        phoneNumber: response.data.driver?.phoneNumber || '',
        vehicleInfo: response.data.driver?.vehicleInfo || '',
        licensePlate: response.data.driver?.licensePlate || '',
        email: response.data.email || '',
      });
    } catch (requestError) {
      setError(requestError.message || 'Could not submit driver profile.');
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 font-bold">
              GC
            </div>
            {sidebarOpen && <span className="text-lg font-bold">Driver</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <NavItem icon={User} label="Profile" sidebarOpen={sidebarOpen} active />
          <NavItem icon={Truck} label="Assignments" sidebarOpen={sidebarOpen} disabled={!active} />
          <NavItem icon={ClipboardCheck} label="History" sidebarOpen={sidebarOpen} disabled={!active} />
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
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">My Profile</h1>
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
                    <Field label="Full name">
                      <input
                        required
                        value={form.fullName}
                        onChange={(event) => handleChange('fullName', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Phone number">
                      <input
                        required
                        minLength={8}
                        value={form.phoneNumber}
                        onChange={(event) => handleChange('phoneNumber', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Vehicle">
                      <input
                        required
                        value={form.vehicleInfo}
                        onChange={(event) => handleChange('vehicleInfo', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Truck, van, motorbike..."
                      />
                    </Field>
                    <Field label="License plate">
                      <input
                        required
                        value={form.licensePlate}
                        onChange={(event) => handleChange('licensePlate', event.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                    <Field label="Email">
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
                </div>

                <div className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${statusMeta[status]?.tone}`}>
                  {statusMeta[status]?.label || status}
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
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

function NavItem({ icon: Icon, label, sidebarOpen, active, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Icon className="h-5 w-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
