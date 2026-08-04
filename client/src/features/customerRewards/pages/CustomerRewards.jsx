import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Gift, LogOut, Menu, X, Search, Filter, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { getCustomerWallet, getRewards, redeemReward } from '../api/customerRewards';
import { logout } from '../../auth/api/auth';

const PAGE_SIZE = 12;

const formatCurrency = (value) => new Intl.NumberFormat('en-US').format(value);

export default function CustomerRewards() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [rewards, setRewards] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasNextPage: false });
  const [metrics, setMetrics] = useState({ totalRewards: 0, availableRewards: 0, lowStockRewards: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchWallet = async () => {
    try {
      const response = await getCustomerWallet();
      setWallet(response.data || { balance: 0, transactions: [] });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load wallet');
    }
  };

  const loadRewards = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getRewards({ q: query, type: typeFilter, page: currentPage, limit: PAGE_SIZE });
      const data = response.data;
      setRewards(data.rewards || []);
      setMetrics(data.metrics || { totalRewards: 0, availableRewards: 0, lowStockRewards: 0 });
      setPagination(data.pagination || { page: currentPage, limit: PAGE_SIZE, total: 0, totalPages: 1, hasNextPage: false });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load rewards');
      setRewards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    loadRewards();
  }, [query, typeFilter, currentPage]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn(error);
    }

    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleRedeem = async (reward) => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await redeemReward(reward.id);
      setWallet((current) => ({ ...current, balance: response.data.balance }));
      setMessage(`Redeemed ${reward.name}. Voucher: ${response.data.reward.voucherCodeUsed || 'n/a'}`);
      await loadRewards();
    } catch (err) {
      setError(err.message || 'Could not redeem reward');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Eco Points', value: formatCurrency(wallet.balance), icon: Sparkles, accent: 'emerald' },
      { label: 'Rewards available', value: metrics.availableRewards, icon: CheckCircle2, accent: 'sky' },
      { label: 'Reward types', value: metrics.totalRewards, icon: Award, accent: 'amber' },
    ],
    [metrics, wallet.balance],
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-emerald-700 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-emerald-700">GC</div>
            {sidebarOpen && <span className="font-bold text-lg">Customer</span>}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={Award} label="Rewards" sidebarOpen={sidebarOpen} active />
          <NavItem icon={ArrowRight} label="Pickups" sidebarOpen={sidebarOpen} onClick={() => navigate('/dashboard/customer')} />
          <NavItem icon={Gift} label="Vouchers" sidebarOpen={sidebarOpen} />
        </nav>
        <div className="p-4 border-t border-emerald-600">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500 transition-colors">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Rewards & Eco Wallet</h1>
          <div className="text-sm text-slate-600">Manage points and redeem vouchers</div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Eco Point Wallet</p>
                  <h2 className="mt-2 text-4xl font-bold text-slate-900">{formatCurrency(wallet.balance)} pts</h2>
                </div>
                <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-emerald-700">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Available balance</p>
                  <p className="mt-1">Use points to redeem vouchers and rewards.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Recent activity</p>
                  {wallet.transactions.length === 0 ? (
                    <p className="mt-2 text-slate-500">No transactions yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {wallet.transactions.slice(0, 4).map((item) => (
                        <li key={item.id} className="rounded-2xl bg-white p-3 border border-slate-200">
                          <p className="text-sm font-semibold text-slate-900">{item.type.replaceAll('_', ' ')}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Vouchers store</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Available rewards</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block min-w-[180px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setQuery(event.target.value);
                      }}
                      className="w-full rounded-2xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Search rewards"
                    />
                  </label>
                  <label className="relative block min-w-[160px]">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={typeFilter}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setTypeFilter(event.target.value);
                      }}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All categories</option>
                      <option value="DIGITAL_VOUCHER">Digital voucher</option>
                      <option value="PHYSICAL_PRODUCT">Physical product</option>
                    </select>
                  </label>
                </div>
              </div>

              {message && <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
              {error && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                {rewards.map((reward) => {
                  const canRedeem = reward.available && wallet.balance >= reward.pointCost;
                  return (
                    <div key={reward.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
                          <Award className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-slate-900">{reward.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{reward.partnerName || 'GreenCycle'}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-700">{reward.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-800">{reward.type.replaceAll('_', ' ')}</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{formatCurrency(reward.pointCost)} pts</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reward.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {reward.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                        </span>
                        <button
                          type="button"
                          disabled={!canRedeem || actionLoading}
                          onClick={() => handleRedeem(reward)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${canRedeem ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                        >
                          Redeem
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Showing page {pagination.page} of {pagination.totalPages}.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage <= 1 || isLoading}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
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
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${active ? 'bg-white/20 text-white' : 'text-emerald-100 hover:bg-white/10'}`}
    >
      <Icon className="h-5 w-5" />
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
