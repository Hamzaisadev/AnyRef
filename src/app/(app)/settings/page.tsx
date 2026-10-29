'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  User,
  CreditCard,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  role: string;
  status: string;
  plan_id: string;
  tos_version?: string | null;
  tos_accepted_at?: string | null;
  age_confirmed_at?: string | null;
}

interface DeletionStatus {
  isPendingDeletion: boolean;
  deletionRequestedAt: string | null;
  daysRemaining: number | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [processingDeletion, setProcessingDeletion] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  async function loadAccountData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/account');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load account settings');
      }
      const data = await res.json();
      setProfile(data.profile);
      setDeletionStatus(data.deletionStatus);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    try {
      setExporting(true);
      setError(null);
      setExportSuccess(false);

      const res = await fetch('/api/account/export');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to export account data');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `anyref-export-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleRequestDeletion() {
    if (deleteConfirmationInput !== 'DELETE') return;

    try {
      setProcessingDeletion(true);
      setError(null);

      const res = await fetch('/api/account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to schedule account deletion');
      }

      const data = await res.json();
      setDeletionStatus(data.deletionStatus);
      setShowDeleteModal(false);
      setDeleteConfirmationInput('');
      await loadAccountData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setProcessingDeletion(false);
    }
  }

  async function handleCancelDeletion() {
    try {
      setProcessingDeletion(true);
      setError(null);

      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to restore account');
      }

      const data = await res.json();
      setDeletionStatus(data.deletionStatus);
      await loadAccountData();
    } catch (err: any) {
      setError(err.message || 'Failed to restore account');
    } finally {
      setProcessingDeletion(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-layout-layer font-medium">Loading settings...</p>
      </div>
    );
  }

  const isOwner = profile?.role === 'owner';
  const isPendingDeletion = deletionStatus?.isPendingDeletion ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-tight font-bold text-ink tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-layout-layer mt-1">
          Manage your profile, data portability, and privacy settings.
        </p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start space-x-3 text-danger text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-danger/10 text-danger/70 hover:text-danger"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Account Deletion Pending Alert Banner */}
      {isPendingDeletion && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-amber-500">
                Account Scheduled for Deletion
              </h2>
              <p className="text-xs text-ink/80 mt-0.5">
                Your account is currently in a 14-day grace period with{' '}
                <strong className="font-semibold text-amber-500">
                  {deletionStatus?.daysRemaining ?? 14} days remaining
                </strong>
                . During this time, your brands and entries remain intact.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelDeletion}
            disabled={processingDeletion}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs disabled:opacity-50"
          >
            {processingDeletion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Restore Account</span>
          </button>
        </div>
      )}

      {/* Section 1: Profile & Plan */}
      <section className="bg-surface rounded-2xl border border-border-subtle p-6 space-y-6 shadow-2xs">
        <div className="flex items-center space-x-3 border-b border-border-subtle pb-4">
          <User className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-ink">Profile Information</h2>
            <p className="text-xs text-layout-layer">Your Anyref identity and plan privileges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle space-y-1">
            <span className="text-xs text-layout-layer font-medium">Email Address</span>
            <p className="text-sm font-mono font-medium text-ink">{profile?.email || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle space-y-1">
            <span className="text-xs text-layout-layer font-medium">Account Role</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium capitalize text-ink">
                {profile?.role || 'User'}
              </span>
              {isOwner && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                  Owner
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle space-y-1">
            <span className="text-xs text-layout-layer font-medium">Current Membership</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-ink">
                {profile?.plan_id || 'Free'} Plan
              </span>
              <a
                href="/billing"
                className="text-xs text-primary hover:underline font-medium inline-flex items-center space-x-1"
              >
                <CreditCard className="w-3 h-3" />
                <span>View Billing</span>
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle space-y-1">
            <span className="text-xs text-layout-layer font-medium">Terms & Privacy Acceptance</span>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {profile?.tos_version
                  ? `Accepted (${profile.tos_version})`
                  : 'Accepted on registration'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Data Portability (Export) */}
      <section className="bg-surface rounded-2xl border border-border-subtle p-6 space-y-6 shadow-2xs">
        <div className="flex items-center space-x-3 border-b border-border-subtle pb-4">
          <Download className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-ink">Data Portability (GDPR / CCPA)</h2>
            <p className="text-xs text-layout-layer">
              Export your personal data and creative assets in machine-readable JSON format
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl space-y-1">
            <p className="text-sm text-ink font-medium">Download Complete User Archive</p>
            <p className="text-xs text-layout-layer leading-relaxed">
              Includes all configured brands (tones, wordmarks, color palettes), prompt templates,
              slot definitions, winner tags, and linked reference asset paths.
            </p>
          </div>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-hover hover:bg-surface-active text-ink border border-border-subtle hover:border-primary/40 transition-all duration-150 shadow-2xs disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-primary" />
            )}
            <span>{exporting ? 'Generating Export...' : 'Export All Data'}</span>
          </button>
        </div>

        {exportSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Export generated successfully. Download started!</span>
          </div>
        )}
      </section>

      {/* Section 3: Danger Zone */}
      <section className="bg-surface rounded-2xl border border-danger/25 p-6 space-y-6 shadow-2xs">
        <div className="flex items-center space-x-3 border-b border-danger/20 pb-4">
          <Shield className="w-5 h-5 text-danger" />
          <div>
            <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
            <p className="text-xs text-layout-layer">
              Permanent actions and account deletion requests
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold text-ink">Delete Account</p>
            <p className="text-xs text-layout-layer leading-relaxed">
              Requesting account deletion immediately schedules your account for removal. A 14-day
              grace period is provided during which you may restore your account before all stored
              assets, brands, and templates are permanently deleted.
            </p>
            {isOwner && (
              <p className="text-xs text-amber-500 font-medium mt-1">
                Note: The platform owner cannot delete their account directly. Transfer platform
                ownership first.
              </p>
            )}
          </div>

          <div>
            {isPendingDeletion ? (
              <button
                onClick={handleCancelDeletion}
                disabled={processingDeletion}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-2xs disabled:opacity-50"
              >
                {processingDeletion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Cancel Deletion</span>
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isOwner}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-danger text-white hover:bg-danger/90 transition-all duration-150 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Confirmation Modal for Account Deletion */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-surface rounded-2xl border border-border-subtle max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 id="delete-dialog-title" className="text-base font-bold text-ink">
                  Request Account Deletion
                </h3>
                <p className="text-xs text-layout-layer mt-1 leading-relaxed">
                  Are you sure you want to schedule your account for deletion? You will enter a{' '}
                  <strong>14-day grace period</strong> during which you can cancel at any time.
                  After 14 days, all your data will be permanently purged.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-delete-input" className="text-xs font-medium text-ink block">
                Type <strong className="text-danger font-mono">DELETE</strong> below to confirm:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-muted text-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-danger"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
                disabled={processingDeletion}
                className="px-4 py-2 rounded-xl text-xs font-medium text-layout-layer hover:text-ink hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={deleteConfirmationInput !== 'DELETE' || processingDeletion}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-danger text-white hover:bg-danger/90 disabled:opacity-40 transition-colors shadow-2xs"
              >
                {processingDeletion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
