import { requireAdmin } from '@/services/session';
import { AdminService } from '@/services/adminService';
import { AlertTriangle, ShieldAlert, FileText, Eye, CheckCircle2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    userId?: string;
    reason?: string;
  }>;
}

export default async function AdminAbuseReviewPage({ searchParams }: PageProps) {
  const profile = await requireAdmin();
  const params = await searchParams;

  let reviewedContent: { brands: unknown[]; entries: unknown[] } | null = null;
  let reviewError: string | null = null;

  if (params.userId && params.reason) {
    try {
      reviewedContent = await AdminService.conductAbuseReview(
        { id: profile.id, role: profile.role, status: profile.status },
        params.userId,
        params.reason
      );
    } catch (err: unknown) {
      reviewError = err instanceof Error ? err.message : 'Failed to conduct review.';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span>Abuse & Takedown Review Queue</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Admins have zero regular RLS access to private user brands, templates, and reference images.
          Accessing user content requires an explicit, justified reason that is permanently recorded in the immutable audit log.
        </p>
      </div>

      {/* Review Initiation Form */}
      <div className="p-6 rounded-2xl bg-[#0F111E] border border-slate-800 shadow-sm max-w-2xl">
        <form method="GET" className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="userId" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target User UUID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              defaultValue={params.userId || ''}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reason" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Investigation Reason / DMCA Notice ID
            </label>
            <textarea
              id="reason"
              name="reason"
              required
              rows={3}
              defaultValue={params.reason || ''}
              placeholder="e.g. DMCA notice #1049 received regarding copyright infringement in poster assets."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Submitting this form immediately appends an <strong>abuse_review_conducted</strong> event to the audit log with your Staff ID, IP, and reason.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Audit & Review User Content</span>
          </button>
        </form>
      </div>

      {reviewError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {reviewError}
        </div>
      )}

      {/* Review Results */}
      {reviewedContent && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Audit record logged. Disclosing user content for User ID: {params.userId}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Brands */}
            <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Created Brands ({reviewedContent.brands.length})</span>
              </h2>
              <pre className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 font-mono overflow-auto max-h-96">
                {JSON.stringify(reviewedContent.brands, null, 2)}
              </pre>
            </div>

            {/* User Entries */}
            <div className="p-5 rounded-2xl bg-[#0F111E] border border-slate-800 space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Saved Entries & Prompts ({reviewedContent.entries.length})</span>
              </h2>
              <pre className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 font-mono overflow-auto max-h-96">
                {JSON.stringify(reviewedContent.entries, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
