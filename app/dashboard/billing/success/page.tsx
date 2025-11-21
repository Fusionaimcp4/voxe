"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const { data: session } = useSession();

  useEffect(() => {
    // Track referral purchase (client-side)
    if (typeof window !== 'undefined' && (window as any).ReferralRocket && session?.user?.email) {
      try {
        // Get amount from URL params if available (from Stripe redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        // ReferralRocket widget automatically tracks purchases when the widget is loaded
        // If the widget provides a specific API, we can call it here
        if ((window as any).ReferralRocket.trackPurchase) {
          (window as any).ReferralRocket.trackPurchase({
            email: session.user.email,
            // Amount and orderId can be fetched from session if needed
          });
        }
      } catch (error) {
        console.error('Failed to track referral purchase:', error);
      }
    }
  }, [session]);

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


