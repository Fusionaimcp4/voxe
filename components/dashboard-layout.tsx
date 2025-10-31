"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Determine if this is an admin page AND user has admin role
  const isAdminPage = pathname.startsWith("/admin");
  const hasAdminRole = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const isAdmin = isAdminPage && hasAdminRole;
  
  // Check if this is a dashboard page (not landing page, auth pages, etc.)
  const isDashboardPage = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  // If it's not a dashboard page, render children without sidebar
  if (!isDashboardPage) {
    return <>{children}</>;
  }

  // If user tries to access admin pages without admin role, redirect to user dashboard
  if (isAdminPage && !hasAdminRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don't have permission to access admin features. Please contact your administrator if you believe this is an error.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}
