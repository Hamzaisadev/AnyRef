'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { createBrowserClientInstance } from '@/lib/supabaseBrowser';

interface MfaFactor {
  id: string;
  factor_type: string;
  status: 'verified' | 'unverified';
  friendly_name?: string;
  created_at: string;
}

export default function StaffMfaPage() {
  const supabase = createBrowserClientInstance();

  const [loading, setLoading] = useState(true);
  const [currentAal, setCurrentAal] = useState<'aal1' | 'aal2'>('aal1');
  const [factors, setFactors] = useState<MfaFactor[]>([]);

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [secretCode, setSecretCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Status feedback
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  async function fetchMfaStatus() {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: aalData, error: aalErr } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aalErr && aalData) {
        setCurrentAal(aalData.currentLevel === 'aal2' ? 'aal2' : 'aal1');
      }

      const { data: factorData, error: factorErr } =
        await supabase.auth.mfa.listFactors();
      if (!factorErr && factorData) {
        setFactors((factorData.totp || []) as MfaFactor[]);
      }
    } catch {
      setErrorMsg('Failed to retrieve MFA status.');
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setEnrolling(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Anyref Admin',
        friendlyName: 'Staff Authenticator',
      });

      if (error || !data) {
        throw new Error(error?.message || 'Could not initiate TOTP enrollment');
      }

      setEnrollFactorId(data.id);
      setQrCodeData(data.totp.qr_code);
      setSecretCode(data.totp.secret);
    } catch (err: any) {
      setErrorMsg(err.message || 'Enrollment error');
      setEnrolling(false);
    }
  }

  async function handleVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollFactorId || !totpCode || totpCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit TOTP code.');
      return;
    }

    setVerifying(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code: totpCode.trim(),
      });

      if (error) {
        throw new Error(error.message || 'Verification failed. Please check the code and try again.');
      }

      setSuccessMsg('Authenticator app successfully enrolled! AAL2 is now active for this session.');
      setEnrolling(false);
      setEnrollFactorId(null);
      setQrCodeData(null);
      setSecretCode(null);
      setTotpCode('');
      await fetchMfaStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function handleUnenroll(factorId: string) {
    if (!confirm('Are you sure you want to remove this authenticator factor? Administrative access requires AAL2 MFA in production.')) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setSuccessMsg('Factor removed successfully.');
      await fetchMfaStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove factor');
    }
  }

  async function copySecret() {
    if (!secretCode) return;
    await navigator.clipboard.writeText(secretCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-tight font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Staff Multi-Factor Authentication (MFA)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Enforce TOTP authenticator requirements (AAL2) to protect administrative panels and operations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMfaStatus}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-sm font-medium flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-300 text-sm font-medium flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Assurance Level Card */}
      <div className="p-6 bg-[#0E111C] rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              currentAal === 'aal2'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            {currentAal === 'aal2' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-tight font-bold text-lg text-white">
                Current Session Level:{' '}
                <span className={currentAal === 'aal2' ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentAal.toUpperCase()}
                </span>
              </h2>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  currentAal === 'aal2'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {currentAal === 'aal2' ? 'Enforced & Verified' : 'Standard Session'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentAal === 'aal2'
                ? 'Your session is authenticated with secondary factor verification. Administrative operations are fully permitted.'
                : 'AAL2 is required for production staff actions. Enroll an authenticator app below to elevate assurance.'}
            </p>
          </div>
        </div>

        {!enrolling && factors.length === 0 && (
          <button
            type="button"
            onClick={startEnrollment}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Enroll Authenticator App</span>
          </button>
        )}
      </div>

      {/* Enrollment Flow Card */}
      {enrolling && qrCodeData && (
        <div className="p-6 bg-[#0E111C] rounded-2xl border border-primary/30 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5 text-white">
              <QrCode className="w-5 h-5 text-primary" />
              <h3 className="font-tight font-bold text-lg">Scan QR Code in Authenticator</h3>
            </div>
            <button
              type="button"
              onClick={() => setEnrolling(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code display */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl max-w-xs mx-auto">
              <img
                src={qrCodeData}
                alt="TOTP Enrollment QR Code"
                className="w-48 h-48 object-contain"
              />
              <span className="text-[11px] text-slate-700 font-sans mt-2 font-medium">
                Scan with Google Authenticator or 1Password
              </span>
            </div>

            {/* Secret key and verification form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Manual Entry Key (Secret)
                </label>
                <div className="flex items-center space-x-2">
                  <code className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 select-all flex-1">
                    {secretCode}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Copy Secret"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyEnrollment} className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    disabled={verifying}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-primary w-40"
                  />
                  <button
                    type="submit"
                    disabled={verifying || totpCode.length !== 6}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm &amp; Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Factors List */}
      <div className="bg-[#0E111C] rounded-2xl border border-slate-800/80 p-6 space-y-4">
        <h3 className="font-tight font-bold text-base text-white">
          Configured Authentication Factors
        </h3>

        {factors.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            No authenticator app currently enrolled. Enroll an app above to secure your staff account.
          </div>
        ) : (
          <div className="space-y-3">
            {factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-white">
                        {f.friendly_name || 'TOTP Authenticator'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase font-bold">
                        {f.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {f.id.slice(0, 18)}... • Enrolled: {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnenroll(f.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Remove factor"
                  aria-label="Remove factor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
