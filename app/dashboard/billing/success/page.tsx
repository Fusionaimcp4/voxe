"use client";

import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl border p-6 text-center">
        <div className="text-2xl font-semibold mb-2">Payment Successful</div>
        <div className="text-slate-600 dark:text-slate-400 mb-6">Your payment was processed. Your balance/plan will reflect shortly.</div>
        <div className="flex gap-3 justify-center">
          <Link className="px-4 py-2 bg-slate-900 text-white rounded" href="/dashboard/billing">Go to Billing</Link>
          <Link className="px-4 py-2 bg-blue-600 text-white rounded" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}


