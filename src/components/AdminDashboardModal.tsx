import React, { useState } from 'react';
import { 
  X, ShieldAlert, CheckCircle2, AlertTriangle, 
  Users, Package, DollarSign, Activity, FileText, 
  Check, Ban, Sparkles, Filter, ShieldCheck
} from 'lucide-react';
import { store } from '../services/marketplaceStore';
import { ProductListing, User, Report } from '../types';

interface AdminDashboardModalProps {
  currentUser: User;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  currentUser,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'users' | 'revenue' | 'audit'>('pending');

  const allListings = store.getListings({ status: 'all' });
  const pendingListings = allListings.filter(l => l.status === 'pending');
  const activeListings = allListings.filter(l => l.status === 'active');
  const reports = store.getReports();
  const allUsers = store.getAllUsers();
  const transactions = store.getTransactions();
  const auditLogs = store.getAuditLogs();

  const totalRevenueUGX = transactions
    .filter(t => t.status === 'successful')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleApproveListing = (listingId: string) => {
    store.updateListing(listingId, { status: 'active' });
    store.addAuditLog('LISTING_APPROVED', `Listing ${listingId} approved by moderator`, 'listing', listingId);
    window.location.reload();
  };

  const handleRejectListing = (listingId: string) => {
    const reason = prompt('Enter rejection reason for seller:', 'Violates marketplace listing guidelines.');
    if (reason) {
      store.updateListing(listingId, { status: 'rejected', rejectionReason: reason });
      store.addAuditLog('LISTING_REJECTED', `Listing ${listingId} rejected: ${reason}`, 'listing', listingId);
      window.location.reload();
    }
  };

  const handleResolveReport = (reportId: string, action: Report['resolutionAction']) => {
    const notes = prompt('Enter resolution notes:', `Action taken: ${action}`);
    if (notes) {
      store.resolveReport(reportId, action, notes);
      window.location.reload();
    }
  };

  const handleToggleUserVerification = (user: User) => {
    store.toggleSellerVerification(user.id);
    window.location.reload();
  };

  const handleToggleUserSuspension = (user: User) => {
    if (user.isSuspended) {
      store.updateUser(user.id, { isSuspended: false });
      store.addAuditLog('USER_UNSUSPENDED', `User ${user.id} unsuspended`, 'user', user.id);
    } else {
      const reason = prompt('Reason for account suspension:', 'Policy violation or repeated scams');
      if (reason) {
        store.updateUser(user.id, { isSuspended: true, suspensionReason: reason });
        store.addAuditLog('USER_SUSPENDED', `User ${user.id} suspended: ${reason}`, 'user', user.id);
      }
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl min-h-[85vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold">
                ANATECH MARKET Administration Console
              </h2>
              <span className="text-[10px] text-slate-400">
                Operator: {currentUser.name} ({currentUser.role.toUpperCase()})
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Level Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="p-3">
            <span className="text-[11px] text-slate-500 block">Total Users</span>
            <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{allUsers.length}</span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-500 block">Active Listings</span>
            <span className="text-lg font-bold tabular-nums text-emerald-600">{activeListings.length}</span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-500 block">Review Queue</span>
            <span className="text-lg font-bold tabular-nums text-amber-500">{pendingListings.length}</span>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-500 block">Reports Pending</span>
            <span className="text-lg font-bold tabular-nums text-rose-500">
              {reports.filter(r => r.status === 'pending').length}
            </span>
          </div>
          <div className="p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 block">Revenue (UGX)</span>
            <span className="text-sm sm:text-base font-bold tabular-nums font-mono text-cyan-600 dark:text-cyan-400">
              UGX {totalRevenueUGX.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: `Pending Approvals (${pendingListings.length})` },
            { id: 'reports', label: `Reports Queue (${reports.length})` },
            { id: 'users', label: `Users & Roles (${allUsers.length})` },
            { id: 'revenue', label: `Transactions (${transactions.length})` },
            { id: 'audit', label: `Audit Log (${auditLogs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Tab 1: Pending Listings Review Queue */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Listings Awaiting Moderation Review
              </h3>
              {pendingListings.length > 0 ? (
                <div className="space-y-3">
                  {pendingListings.map(item => (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img src={item.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <span className="text-xs font-mono font-bold text-cyan-600">
                            UGX {item.price.toLocaleString()}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Seller: {item.sellerName} · {item.district} · Category: {item.categoryId}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApproveListing(item.id)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectListing(item.id)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  All pending listings have been reviewed. Queue is clean.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Reports Queue */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reported Listings & Users Queue
              </h3>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map(rep => (
                    <div
                      key={rep.id}
                      className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                            {rep.reason.replace('_', ' ')}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {rep.targetTitle} ({rep.targetType})
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Reported by {rep.reporterName} on {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          rep.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                        <strong>Reporter Notes:</strong> {rep.details}
                      </p>

                      {rep.status === 'pending' && (
                        <div className="flex gap-2 pt-1 text-xs">
                          <button
                            onClick={() => handleResolveReport(rep.id, 'listing_removed')}
                            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                          >
                            Remove Listing
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'seller_suspended')}
                            className="px-3 py-1 bg-red-800 text-white rounded-lg font-bold"
                          >
                            Suspend Seller
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'dismissed')}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No open abuse reports.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Users & Roles */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                User Management & Permissions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">District</th>
                      <th className="p-2.5">Plan</th>
                      <th className="p-2.5">Trust Badge</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allUsers.map(u => {
                      const isVerified = Boolean(u.verified || u.isVerifiedSeller);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 flex items-center gap-2">
                            <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                            <div>
                              <span className="font-semibold block text-slate-900 dark:text-white">{u.name}</span>
                              <span className="text-[10px] text-slate-400">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-2.5 capitalize">{u.role}</td>
                          <td className="p-2.5">{u.district}</td>
                          <td className="p-2.5 capitalize">{u.activePlan}</td>
                          <td className="p-2.5">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unverified</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {u.isSuspended ? (
                              <span className="text-rose-600 font-bold">Suspended</span>
                            ) : (
                              <span className="text-emerald-600">Active</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right space-x-1.5">
                            <button
                              onClick={() => handleToggleUserVerification(u)}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                                isVerified
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                              }`}
                              title={isVerified ? 'Revoke verified seller status' : 'Grant verified trusted seller badge'}
                            >
                              {isVerified ? 'Revoke Verified' : 'Grant Verified'}
                            </button>
                            <button
                              onClick={() => handleToggleUserSuspension(u)}
                              className={`px-2 py-1 rounded text-[11px] font-bold ${
                                u.isSuspended ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Revenue & Monetization */}
          {activeTab === 'revenue' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Mobile Money & Subscription Transactions
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {tx.userName} · {tx.purpose.replace('_', ' ')}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Ref: {tx.reference} · {tx.provider} ({tx.phoneNumber})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 block">
                          UGX {tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payment transactions recorded yet.
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Audit Log */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform Moderation Audit Trail
              </h3>
              <div className="space-y-1.5">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white mr-2">[{log.action}]</span>
                      <span className="text-slate-600 dark:text-slate-300">{log.details}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-4">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
