"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Settings, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Eye, 
  Shield, 
  ArrowLeft,
  Activity,
  UserPlus,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalDemos: number;
  totalUsers: number;
  totalWorkflows: number;
  totalContacts: number;
  activeWorkflows: number;
}

interface Demo {
  id: string;
  slug: string;
  businessName: string;
  businessUrl: string;
  demoUrl: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDemos: 0,
    totalUsers: 0,
    totalWorkflows: 0,
    totalContacts: 0,
    activeWorkflows: 0,
  });
  const [recentDemos, setRecentDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not admin/super_admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      router.push("/dashboard?error=Access Denied");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentDemos(data.recentDemos);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="px-4 py-6 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
              </div>
            ))}
          </div>
          
          {/* Actions Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden sm:block"
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Manage LocalBox system, users, and demos
        </p>
      </motion.div>

        {/* Stats Grid - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalDemos}</h3>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Total Demos</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</h3>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Users</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalWorkflows}</h3>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Settings className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Workflows</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalContacts}</h3>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <MessageSquare className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Contacts</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeWorkflows}</h3>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Active</p>
          </div>
        </motion.div>

        {/* Quick Actions - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <Link
            href="/admin/onboard"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <Plus className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Create Demo</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Create a new AI support demo
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Manage Users</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  View and manage user accounts
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/admin/system-messages"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                <MessageSquare className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">System Messages</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Manage AI system messages
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/admin/dashboard/security"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Security Settings</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Configure 2FA and security options
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        </motion.div>

        {/* Recent Demos - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Demos</h3>
              <Link
                href="/admin/demos"
                className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentDemos.length > 0 ? (
                recentDemos.map((demo) => (
                  <div
                    key={demo.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{demo.businessName}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{demo.user.name} • {demo.user.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{new Date(demo.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={demo.demoUrl}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Demo
                      </Link>
                      <Link
                        href={`/admin/demos/${demo.slug}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No demos found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">Create your first demo to get started!</p>
                  <Link
                    href="/admin/onboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Demo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
}