import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  Filter,
  Gift,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import { createAdminReward, deleteAdminReward, getAdminRewards, updateAdminReward } from '../api/rewards';
import { friendlyError, successText } from '../../../lib/messages';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const PAGE_SIZE = 5;

const emptyForm = {
  name: '',
  description: '',
  type: 'PHYSICAL_PRODUCT',
  pointCost: '',
  partnerName: '',
  imageUrl: '',
  imageDataUri: '',
  stockQuantity: '',
  isUnlimited: false,
};

const currencyFormatter = new Intl.NumberFormat('en-US');

export default function AdminRewardManagement() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [metricsData, setMetricsData] = useState({
    totalRewards: 0,
    availableRewards: 0,
    lowStockRewards: 0,
  });
  const [paginationData, setPaginationData] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [rewardLoading, setRewardLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rewardError, setRewardError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const selectedReward = rewards.find((reward) => reward.id === selectedRewardId);

  const loadRewards = useCallback(async () => {
    setRewardLoading(true);
    setRewardError('');

    try {
      const response = await getAdminRewards({
        q: query,
        type: typeFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const data = response.data;
      const nextRewards = data.rewards || [];

      setRewards(nextRewards);
      setMetricsData(data.metrics || {
        totalRewards: 0,
        availableRewards: 0,
        lowStockRewards: 0,
      });
      setPaginationData(data.pagination || {
        page: currentPage,
        limit: PAGE_SIZE,
        total: nextRewards.length,
        totalPages: 1,
        hasNextPage: false,
      });
      setSelectedRewardId((current) => (nextRewards.some((reward) => reward.id === current) ? current : ''));
    } catch (error) {
      setRewardError(friendlyError(error, 'Unable to load rewards. Please try again.'));
      setRewards([]);
    } finally {
      setRewardLoading(false);
    }
  }, [currentPage, query, typeFilter]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const metrics = useMemo(
    () => [
      { label: 'Reward items', value: metricsData.totalRewards, icon: Gift, accent: 'emerald' },
      { label: 'Available items', value: metricsData.availableRewards, icon: CheckCircle2, accent: 'sky' },
      { label: 'Low stock alerts', value: metricsData.lowStockRewards, icon: AlertTriangle, accent: 'amber' },
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

  const handleSelectReward = (reward) => {
    setSelectedRewardId(reward.id);
    setForm(rewardToForm(reward));
    setDetailOpen(true);
    setMessage('');
    setFormError('');
  };

  const handleNewReward = () => {
    setSelectedRewardId('');
    setForm(emptyForm);
    setDetailOpen(true);
    setMessage('');
    setFormError('');
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRewardId('');
    setForm(emptyForm);
    setMessage('');
    setFormError('');
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageDataUri: String(reader.result || ''),
        imageUrl: String(reader.result || ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || Number(form.pointCost || 0) <= 0) {
      setFormError('Please enter the reward name and required points.');
      return;
    }

    setActionLoading(true);
    setMessage('');
    setFormError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        pointCost: Number(form.pointCost || 0),
        partnerName: form.partnerName.trim(),
        stockQuantity: form.isUnlimited ? 0 : Number(form.stockQuantity || 0),
        isUnlimited: form.isUnlimited,
        ...(form.imageDataUri ? { imageDataUri: form.imageDataUri } : {}),
        ...(!form.imageDataUri && form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      };
      const result = selectedRewardId
        ? await updateAdminReward(selectedRewardId, payload)
        : await createAdminReward(payload);
      const savedReward = result.data;

      setSelectedRewardId(savedReward.id);
      setForm(rewardToForm(savedReward));
      setMessage(selectedRewardId ? 'Reward updated successfully.' : 'Reward created successfully.');
      await loadRewards();
    } catch (error) {
      setFormError(friendlyError(error, 'Unable to save this reward. Please check the information and try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReward = async () => {
    if (!confirmDialog?.reward) return;

    setActionLoading(true);
    setMessage('');
    setFormError('');

    try {
      const result = await deleteAdminReward(confirmDialog.reward.id);

      setConfirmDialog(null);
      setSelectedRewardId('');
      setForm(emptyForm);
      setDetailOpen(false);
      setMessage(successText(result.message, 'Reward item deleted successfully.'));
      await loadRewards();
    } catch (error) {
      setFormError(friendlyError(error, 'Unable to delete this reward item. It may already have redemption history.'));
      setConfirmDialog(null);
    } finally {
      setActionLoading(false);
    }
  };

  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
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
          <NavItem icon={Users} label="Drivers" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/drivers')} />
          <NavItem icon={CalendarDays} label="Schedules" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/admin/schedules')} />
          <NavItem icon={Award} label="Rewards" sidebarOpen={sidebarOpen} active />
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
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">Reward Management</h1>
          </div>
          <button
            onClick={handleNewReward}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Reward</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {rewardError && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {rewardError}
            </div>
          )}
          {message && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {message}
            </div>
          )}
          {formError && !detailOpen && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {formError}
            </div>
          )}

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <section className={`grid grid-cols-1 items-start gap-6 ${detailOpen ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
            <div className="self-start rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Reward Items</h2>
                  <p className="mt-1 text-sm text-slate-600">Create and update reward items, point cost, inventory, and Cloudinary image.</p>
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
                      placeholder="Search item or partner"
                    />
                  </label>
                  <label className="relative block sm:w-48">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={typeFilter}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setTypeFilter(event.target.value);
                      }}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All types</option>
                      <option value="PHYSICAL_PRODUCT">Physical product</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>Reward</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Availability</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rewards.map((reward) => {
                      const selected = reward.id === selectedRewardId;
                      const lowStock = !reward.inventory.isUnlimited && reward.inventory.stockQuantity <= 10;

                      return (
                        <tr
                          key={reward.id}
                          onClick={() => handleSelectReward(reward)}
                          className={`cursor-pointer transition-colors ${selected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                {reward.imageUrl ? (
                                  <img src={reward.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <Gift className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-950">{reward.name}</p>
                                <p className="text-sm text-slate-600">{reward.partnerName || 'GreenCycle'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">{formatType(reward.type)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{currencyFormatter.format(reward.pointCost)}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            {reward.inventory.isUnlimited ? (
                              <span className="font-medium text-emerald-700">Unlimited</span>
                            ) : (
                              <span className={lowStock ? 'font-semibold text-amber-700' : 'font-medium text-slate-800'}>
                                {reward.inventory.stockQuantity} left
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                reward.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {reward.available ? 'AVAILABLE' : 'OUT_OF_STOCK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {rewards.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                          {rewardLoading ? 'Loading rewards...' : 'No rewards match the current filters.'}
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
                      )} of ${paginationData.total} items`
                    : 'No rewards to show'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={rewardLoading || paginationData.page <= 1}
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
                    disabled={rewardLoading || !paginationData.hasNextPage}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {detailOpen && (
            <aside className="self-start space-y-6">
              <form onSubmit={handleSave} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedReward ? 'Reward Details' : 'Create Reward'}</h2>
                    <p className="mt-1 text-sm text-slate-600">Image uploads are stored in Cloudinary and saved as Reward.imageUrl.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close reward detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Field label="Reward image">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:bg-slate-100">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />
                      ) : (
                        <ImagePlus className="mb-3 h-8 w-8 text-slate-400" />
                      )}
                      <span className="text-sm font-semibold text-slate-700">Choose image</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
                    </label>
                  </Field>
                  <Field label="Reward name" required>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => handleChange('name', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Reward name"
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={(event) => handleChange('description', event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Short fulfillment note"
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Type">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        Physical product
                      </div>
                    </Field>
                    <Field label="Point cost" required>
                      <input
                        required
                        type="number"
                        min="1"
                        value={form.pointCost}
                        onChange={(event) => handleChange('pointCost', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </Field>
                  </div>
                  <Field label="Partner">
                    <input
                      value={form.partnerName}
                      onChange={(event) => handleChange('partnerName', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Partner name"
                    />
                  </Field>
                  <Field label="Stock quantity">
                    <input
                      type="number"
                      min="0"
                      disabled={form.isUnlimited}
                      value={form.stockQuantity}
                      onChange={(event) => handleChange('stockQuantity', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                    />
                  </Field>
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <span className="text-sm font-semibold text-slate-700">Unlimited stock</span>
                    <input
                      type="checkbox"
                      checked={form.isUnlimited}
                      onChange={(event) => handleChange('isUnlimited', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                {formError && (
                  <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {actionLoading ? 'Saving...' : 'Save Reward'}
                </button>
                {selectedReward && (
                  <button
                    type="button"
                    onClick={() => setConfirmDialog({ type: 'deleteReward', reward: selectedReward })}
                    disabled={actionLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-600 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Reward
                  </button>
                )}
              </form>
            </aside>
            )}
          </section>
        </main>
      </div>

      <ConfirmDialog
        open={confirmDialog?.type === 'deleteReward'}
        tone="danger"
        title="Delete this reward item?"
        description="This action removes the reward item and its inventory from the catalog. Rewards with redemption history cannot be deleted."
        details={confirmDialog?.reward ? `${confirmDialog.reward.name} - ${currencyFormatter.format(confirmDialog.reward.pointCost)} points` : ''}
        confirmLabel="Delete reward"
        cancelLabel="Keep reward"
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setConfirmDialog(null);
        }}
        onConfirm={handleDeleteReward}
      />
    </div>
  );
}

function rewardToForm(reward) {
  if (!reward) return emptyForm;

  return {
    name: reward.name || '',
    description: reward.description || '',
    type: 'PHYSICAL_PRODUCT',
    pointCost: String(reward.pointCost || ''),
    partnerName: reward.partnerName || '',
    imageUrl: reward.imageUrl || '',
    imageDataUri: '',
    stockQuantity: String(reward.inventory?.stockQuantity || ''),
    isUnlimited: Boolean(reward.inventory?.isUnlimited),
  };
}

function formatType(type) {
  return type === 'PHYSICAL_PRODUCT' ? 'Physical product' : 'Not available in MVP';
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
