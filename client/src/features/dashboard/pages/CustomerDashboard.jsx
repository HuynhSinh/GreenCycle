import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  CalendarDays,
  CheckCircle2,
  Gift,
  LogOut,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth/api/auth';
import {
  cancelCustomerPickup,
  createCustomerPickup,
  getCustomerPickups,
  getPickupBookingData,
  updateCustomerPickup,
} from '../../customer-pickups/api/customerPickups';
import {
  getCustomerRewards,
  getCustomerWallet,
  redeemCustomerReward,
} from '../../rewards/api/customerRewards';
import { friendlyError, successText } from '../../../lib/messages';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const initialForm = {
  fullName: '',
  phoneNumber: '',
  addressLine: '',
  ward: '',
  district: '',
  city: 'Ho Chi Minh',
  scheduledDate: '',
  scheduledTime: '',
  note: '',
  items: [{ categoryId: '', weight: '' }],
};

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

const pickupTimeSlots = Array.from({ length: 18 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
});

const getLocalDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const createIdempotencyKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  return `redeem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('pickups');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redeemingId, setRedeemingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editingPickupId, setEditingPickupId] = useState('');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [form, setForm] = useState({
    ...initialForm,
    scheduledDate: getLocalDateInputValue(),
    scheduledTime: '09:00',
  });

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError('');

    try {
      const [bookingResponse, pickupsResponse] = await Promise.all([
        getPickupBookingData(),
        getCustomerPickups(),
      ]);
      const bookingData = bookingResponse.data || {};
      const customer = bookingData.customer;
      const defaultAddress = customer?.addresses?.find((address) => address.isDefault) || customer?.addresses?.[0];

      setCategories(bookingData.categories || []);
      setPickups(pickupsResponse.data?.pickups || []);
      setForm((current) => ({
        ...current,
        fullName: customer?.fullName || current.fullName,
        phoneNumber: customer?.phoneNumber || current.phoneNumber,
        addressLine: defaultAddress?.addressLine || current.addressLine,
        ward: defaultAddress?.ward || current.ward,
        district: defaultAddress?.district || current.district,
        city: defaultAddress?.city || current.city,
        items: current.items.map((item) => ({
          ...item,
          categoryId: item.categoryId || bookingData.categories?.[0]?.id || '',
        })),
      }));
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to load pickup booking data. Please try again.'));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadRewards = useCallback(async () => {
    setLoadingRewards(true);
    setError('');

    try {
      const [walletResponse, rewardsResponse] = await Promise.all([
        getCustomerWallet(),
        getCustomerRewards(),
      ]);

      setWalletData(walletResponse.data || null);
      setRewards(rewardsResponse.data?.rewards || []);
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to load your Eco-point wallet. Please try again.'));
    } finally {
      setLoadingRewards(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      loadRewards();
    }
  }, [activeTab, loadRewards]);

  const metrics = useMemo(() => {
    const activeCount = pickups.filter((pickup) => ['PENDING', 'APPROVED', 'ASSIGNED', 'COLLECTING', 'ARRIVED'].includes(pickup.status)).length;
    const collectedCount = pickups.filter((pickup) => pickup.status === 'COLLECTED').length;
    const totalPoints = pickups.reduce((total, pickup) => total + (pickup.totalPoints || 0), 0);

    return [
      { label: 'Active pickups', value: activeCount, icon: Truck, tone: 'bg-sky-50 text-sky-600' },
      { label: 'Collected', value: collectedCount, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
      { label: 'Estimated points', value: totalPoints, icon: Award, tone: 'bg-amber-50 text-amber-600' },
    ];
  }, [pickups]);

  const walletMetrics = useMemo(() => {
    const transactions = walletData?.wallet?.transactions || [];
    const earned = transactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((total, transaction) => total + transaction.amount, 0);
    const redeemed = transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    return [
      { label: 'Eco-point balance', value: walletData?.wallet?.balance || 0, icon: Wallet, tone: 'bg-emerald-50 text-emerald-600' },
      { label: 'Lifetime points', value: walletData?.passport?.totalPoints || 0, icon: Award, tone: 'bg-amber-50 text-amber-600' },
      { label: 'Redeemed points', value: redeemed, icon: Gift, tone: 'bg-rose-50 text-rose-600' },
      { label: 'Earned in history', value: earned, icon: CheckCircle2, tone: 'bg-sky-50 text-sky-600' },
    ];
  }, [walletData]);

  const totalWeight = form.items.reduce((total, item) => total + Number(item.weight || 0), 0);
  const estimatedPoints = form.items.reduce((total, item) => {
    const category = categories.find((entry) => entry.id === item.categoryId);
    return total + Number(item.weight || 0) * (category?.pointFactor || 0);
  }, 0);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    } finally {
      localStorage.removeItem('userInfo');
      setIsLoading(false);
      navigate('/login');
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetBookingForm = () => {
    setEditingPickupId('');
    setForm((current) => ({
      ...current,
      scheduledDate: getLocalDateInputValue(),
      scheduledTime: '09:00',
      note: '',
      items: [{ categoryId: categories[0]?.id || '', weight: '' }],
    }));
  };

  const pickupToForm = (pickup) => {
    const scheduledDate = new Date(pickup.scheduledTime);
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(scheduledDate);
    const localTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(scheduledDate);

    return {
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      addressLine: pickup.address?.addressLine || '',
      ward: pickup.address?.ward || '',
      district: pickup.address?.district === 'Unspecified district' ? '' : pickup.address?.district || '',
      city: pickup.address?.city || 'Ho Chi Minh',
      scheduledDate: localDate,
      scheduledTime: localTime,
      note: pickup.note || '',
      items: pickup.items.map((item) => ({
        categoryId: item.categoryId,
        weight: String(item.weight || ''),
      })),
    };
  };

  const handleViewPickup = (pickup) => {
    setSelectedPickup(pickup);
    setMessage('');
    setError('');
  };

  const handleEditPickup = (pickup) => {
    setSelectedPickup(null);
    setEditingPickupId(pickup.id);
    setForm(pickupToForm(pickup));
    setBookingOpen(true);
    setMessage('');
    setError('');
  };

  const executeCancelPickup = async (pickup) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const result = await cancelCustomerPickup(pickup.id);
      setMessage(successText(result.message, 'Pickup request cancelled. The list has been refreshed.'));
      setSelectedPickup(result.data);
      setConfirmDialog(null);
      await loadData();
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to cancel this request. Please try again.'));
      setConfirmDialog(null);
    } finally {
      setSaving(false);
    }
  };

  const executeRedeemReward = async (reward, idempotencyKey) => {
    setRedeemingId(reward.id);
    setMessage('');
    setError('');

    try {
      const result = await redeemCustomerReward(reward.id, idempotencyKey);
      setMessage(successText(result.message, 'Reward redeemed successfully. Points have been deducted from your wallet.'));
      setConfirmDialog(null);
      await loadRewards();
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to redeem this reward. Please try again.'));
      setConfirmDialog(null);
    } finally {
      setRedeemingId('');
    }
  };

  const handleCancelPickup = (pickup) => {
    setConfirmDialog({
      type: 'cancelPickup',
      pickup,
    });
  };

  const handleRedeemReward = (reward) => {
    setConfirmDialog({
      type: 'redeemReward',
      reward,
      idempotencyKey: createIdempotencyKey(),
    });
  };

  const handleConfirmAction = async () => {
    if (confirmDialog?.type === 'cancelPickup') {
      await executeCancelPickup(confirmDialog.pickup);
    }

    if (confirmDialog?.type === 'redeemReward') {
      await executeRedeemReward(confirmDialog.reward, confirmDialog.idempotencyKey);
    }
  };

  const closeConfirmDialog = () => {
    if (saving || redeemingId) return;
    setConfirmDialog(null);
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { categoryId: categories[0]?.id || '', weight: '' }],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const pickupHour = Number(form.scheduledTime.split(':')[0]);

      if (pickupHour < 8 || pickupHour >= 17) {
        setError('Please choose a pickup time from 08:00 to before 17:00.');
        setSaving(false);
        return;
      }

      const scheduledTime = new Date(`${form.scheduledDate}T${form.scheduledTime}:00+07:00`).toISOString();
      const payload = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: {
          label: 'Pickup address',
          addressLine: form.addressLine.trim(),
          ward: form.ward.trim(),
          district: form.district.trim(),
          city: form.city.trim(),
        },
        scheduledTime,
        note: form.note.trim(),
        items: form.items.map((item) => ({
          categoryId: item.categoryId,
          weight: Number(item.weight || 0),
        })),
      };
      const result = editingPickupId
        ? await updateCustomerPickup(editingPickupId, payload)
        : await createCustomerPickup(payload);

      setMessage(successText(result.message, 'Pickup request saved. The list has been refreshed.'));
      setSelectedPickup(result.data);
      resetBookingForm();
      await loadData();
      setBookingOpen(false);
    } catch (requestError) {
      setError(friendlyError(requestError, 'Unable to save this pickup request. Please check the information and try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} fixed inset-y-0 left-0 z-20 flex flex-col bg-emerald-700 text-white transition-all duration-300 lg:static`}>
        <div className="border-b border-emerald-600 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-emerald-700">GC</div>
            {sidebarOpen && <span className="text-lg font-bold">Customer</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <NavItem icon={CalendarDays} label="Pickups" sidebarOpen={sidebarOpen} active={activeTab === 'pickups'} onClick={() => setActiveTab('pickups')} />
          <NavItem icon={Award} label="Rewards" sidebarOpen={sidebarOpen} active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} />
        </nav>

        <div className="border-t border-emerald-600 p-4">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-emerald-600 disabled:opacity-50"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Customer Portal</p>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {activeTab === 'rewards' ? 'Eco Wallet & Rewards' : 'My Pickups'}
            </h1>
          </div>
          {activeTab === 'pickups' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loadingData}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loadingData ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bookingOpen) {
                    resetBookingForm();
                    setBookingOpen(false);
                  } else {
                    setBookingOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4"
              >
                {bookingOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">{bookingOpen ? 'Close Form' : 'New Pickup'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loadRewards}
              disabled={loadingRewards}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-4"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">{loadingRewards ? 'Loading...' : 'Refresh'}</span>
            </button>
          )}
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          {activeTab === 'pickups' ? (
          <>
          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${metric.tone}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className={`grid grid-cols-1 items-start gap-6 ${bookingOpen ? 'xl:grid-cols-[420px_minmax(0,1fr)]' : ''}`}>
            {bookingOpen && (
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">{editingPickupId ? 'Edit Pickup Request' : 'Pickup Request'}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {editingPickupId ? 'Only pending pickup requests can be edited.' : 'Submit your requested pickup time, address, and e-waste estimate.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                <Field label="Full name" required>
                  <input required value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="Phone number" required>
                  <input required minLength={8} value={form.phoneNumber} onChange={(event) => updateForm('phoneNumber', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="Address line" required>
                  <input required value={form.addressLine} onChange={(event) => updateForm('addressLine', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="Ward" required>
                  <input required value={form.ward} onChange={(event) => updateForm('ward', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="District">
                  <input value={form.district} onChange={(event) => updateForm('district', event.target.value)} className={inputClasses} placeholder="Optional" />
                </Field>
                <Field label="City" required>
                  <input required value={form.city} onChange={(event) => updateForm('city', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="Pickup date" required>
                  <input required type="date" min={getLocalDateInputValue()} value={form.scheduledDate} onChange={(event) => updateForm('scheduledDate', event.target.value)} className={inputClasses} />
                </Field>
                <Field label="Pickup time" required hint="Available slots: 08:00-17:00, every 30 minutes.">
                  <select required value={form.scheduledTime} onChange={(event) => updateForm('scheduledTime', event.target.value)} className={inputClasses}>
                    {pickupTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="border-t border-slate-200 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Waste Items</h3>
                    <p className="mt-1 text-sm text-slate-600">Add each e-waste type and estimated kilograms.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_140px_40px]">
                      <Field label="Category" required>
                        <select required value={item.categoryId} onChange={(event) => updateItem(index, 'categoryId', event.target.value)} className={inputClasses}>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Kg" required>
                        <input required type="number" min="0.1" step="0.1" value={item.weight} onChange={(event) => updateItem(index, 'weight', event.target.value)} className={inputClasses} />
                      </Field>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                        className="mt-7 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-white hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Remove waste item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <Field label="Notes">
                  <textarea value={form.note} onChange={(event) => updateForm('note', event.target.value)} rows={3} className={`${inputClasses} resize-none`} placeholder="Gate instructions, preferred contact time..." />
                </Field>

                <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <Info label="Estimated weight" value={`${totalWeight.toFixed(1).replace(/\.0$/, '')} kg`} icon={Scale} />
                  <Info label="Estimated points" value={Math.round(estimatedPoints)} icon={Award} />
                </div>

                <button
                  type="submit"
                  disabled={saving || loadingData || categories.length === 0}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CalendarDays className="h-4 w-4" />
                  {saving ? 'Saving...' : editingPickupId ? 'Update Pickup Request' : 'Submit Pickup Request'}
                </button>
              </div>
            </form>
            )}

            <section className="self-start rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">My Pickups</h2>
                <p className="mt-1 text-sm text-slate-600">Track the pickup requests submitted from your account.</p>
                  </div>
                </div>
              </div>
              <div className={bookingOpen ? 'divide-y divide-slate-200' : 'grid grid-cols-1 gap-4 p-5 lg:grid-cols-2'}>
                {pickups.map((pickup) => (
                  <div key={pickup.id} className={bookingOpen ? 'p-5' : 'rounded-lg border border-slate-200 bg-slate-50 p-4'}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{formatDateTime(pickup.scheduledTime)}</p>
                        <p className="mt-1 text-sm text-slate-600">{pickup.address?.ward}, {pickup.address?.district}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[pickup.status] || 'border border-slate-300 bg-slate-100 text-slate-700'}`}>
                        {formatPickupStatus(pickup.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {pickup.items.map((item) => `${item.category} ${item.weight}kg`).join(', ')}
                    </p>
                    {pickup.driver && (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        Driver: {pickup.driver.name} - {pickup.driver.vehicle}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewPickup(pickup)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
                      >
                        View
                      </button>
                      {pickup.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditPickup(pickup)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelPickup(pickup)}
                            disabled={saving}
                            className="rounded-lg border border-rose-600 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {pickups.length === 0 && (
                  <div className={bookingOpen ? 'px-5 py-10 text-center text-sm font-medium text-slate-500' : 'rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center text-sm font-medium text-slate-500 lg:col-span-2'}>
                    {loadingData ? 'Loading pickup requests...' : 'You do not have any pickup requests yet.'}
                  </div>
                )}
              </div>
            </section>
          </section>

          {selectedPickup && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Pickup Details</h2>
                    <p className="mt-1 text-sm text-slate-600">{formatDateTime(selectedPickup.scheduledTime)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPickup(null)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close pickup details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <Detail label="Status" value={formatPickupStatus(selectedPickup.status)} />
                  <Detail label="Address" value={`${selectedPickup.address?.addressLine || ''}, ${selectedPickup.address?.ward || ''}, ${selectedPickup.address?.district || ''}`} />
                  <Detail label="Total weight" value={`${selectedPickup.totalWeight} kg`} />
                  <Detail label="Estimated points" value={selectedPickup.totalPoints} />
                  <Detail label="Items" value={selectedPickup.items.map((item) => `${item.category} ${item.weight}kg`).join(', ')} />
                  {selectedPickup.note && <Detail label="Notes" value={selectedPickup.note} />}
                  {selectedPickup.driver && <Detail label="Driver" value={`${selectedPickup.driver.name} - ${selectedPickup.driver.phoneNumber}`} />}
                </div>

                {selectedPickup.status === 'PENDING' && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleEditPickup(selectedPickup)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelPickup(selectedPickup)}
                      disabled={saving}
                      className="rounded-lg border border-rose-600 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          ) : (
            <RewardsView
              loading={loadingRewards}
              walletData={walletData}
              walletMetrics={walletMetrics}
              rewards={rewards}
              redeemingId={redeemingId}
              onRedeem={handleRedeemReward}
            />
          )}
        </main>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDialog)}
        tone={confirmDialog?.type === 'redeemReward' ? 'reward' : 'danger'}
        title={confirmDialog?.type === 'redeemReward' ? 'Redeem this reward?' : 'Cancel pickup request?'}
        description={
          confirmDialog?.type === 'redeemReward'
            ? 'This will create a redemption request and deduct Eco-points from your wallet.'
            : 'This pickup will be cancelled and will no longer be scheduled by admin.'
        }
        details={
          confirmDialog?.type === 'redeemReward'
            ? `${confirmDialog.reward.name} - ${confirmDialog.reward.pointCost} Eco-points`
            : confirmDialog?.pickup
              ? `${formatDateTime(confirmDialog.pickup.scheduledTime)} - ${confirmDialog.pickup.address?.ward || 'Unspecified ward'}`
              : ''
        }
        confirmLabel={confirmDialog?.type === 'redeemReward' ? 'Redeem reward' : 'Cancel pickup'}
        cancelLabel="Keep it"
        loading={saving || Boolean(redeemingId)}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

const inputClasses = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100';

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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

function Field({ label, children, required = false, hint = '' }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {hint && <span className="mt-1 block text-xs font-medium text-slate-500">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RewardsView({ loading, walletData, walletMetrics, rewards, redeemingId, onRedeem }) {
  const transactions = walletData?.wallet?.transactions || [];
  const exchanges = walletData?.exchanges || [];
  const balance = walletData?.wallet?.balance || 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {walletMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${metric.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
        Eco-points are added to your wallet only after a driver marks a pickup as collected and enters the actual kilograms.
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">Redeem Rewards</h2>
            <p className="mt-1 text-sm text-slate-600">Choose an available physical reward and redeem it with your Eco-point balance.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            {rewards.map((reward) => {
              const disabled = !reward.canRedeem || redeemingId === reward.id;
              return (
                <article key={reward.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {reward.imageUrl ? (
                    <img src={reward.imageUrl} alt={reward.name} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-emerald-100 text-emerald-700">
                      <Gift className="h-10 w-10" />
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-base font-bold text-slate-950">{reward.name}</p>
                      {reward.partnerName && <p className="mt-1 text-xs font-semibold uppercase text-emerald-700">{reward.partnerName}</p>}
                      {reward.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{reward.description}</p>}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-amber-700">{reward.pointCost} pts</span>
                      <span className="font-medium text-slate-500">
                        {reward.inventory.isUnlimited ? 'Unlimited' : `${reward.inventory.stockQuantity} left`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRedeem(reward)}
                      disabled={disabled}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Gift className="h-4 w-4" />
                      {redeemingId === reward.id ? 'Redeeming...' : balance < reward.pointCost ? 'Not enough points' : 'Redeem'}
                    </button>
                  </div>
                </article>
              );
            })}
            {rewards.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center text-sm font-medium text-slate-500 md:col-span-2">
                {loading ? 'Loading rewards...' : 'No rewards are available right now.'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">Point History</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.description || transaction.type}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold ${transaction.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                  {loading ? 'Loading point history...' : 'No point transactions yet. Points will be added after a successful collection.'}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">Reward Exchanges</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {exchanges.map((exchange) => (
                <div key={exchange.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{exchange.rewardName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rewardExchangeStatusClass(exchange.status)}`}>
                      {formatRewardExchangeStatus(exchange.status)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">{formatDateTime(exchange.createdAt)}</p>
                  {exchange.voucherCode && (
                    <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-900">
                      Code: {exchange.voucherCode}
                    </p>
                  )}
                </div>
              ))}
              {exchanges.length === 0 && (
                <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                  {loading ? 'Loading redemption history...' : 'You have not redeemed any rewards yet.'}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function formatRewardExchangeStatus(status) {
  const labels = {
    SUCCESS: 'Redeemed',
    PENDING: 'Pending',
    FAILED: 'Failed',
  };

  return labels[status] || status;
}

function rewardExchangeStatusClass(status) {
  if (status === 'SUCCESS') return 'bg-emerald-100 text-emerald-800';
  if (status === 'FAILED') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

function NavItem({ icon: Icon, label, sidebarOpen, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-emerald-100 hover:bg-white/10'
      }`}
    >
      <Icon className="h-5 w-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
