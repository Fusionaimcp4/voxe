"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertCircle, Plus, Settings, BarChart3, MessageSquare, ChevronRight, Eye, Trash2, X } from "lucide-react";
import { notifications } from "@/lib/notifications";
import { logger } from "@/lib/logger";

interface DashboardStats {
  totalDemos: number;
  activeWorkflows: number;
  totalContacts: number;
}

interface Demo {
  id: string;
  slug: string;
  businessName: string;
  businessUrl: string;
  demoUrl: string;
  systemMessageFile: string;
  createdAt: string;
  workflows: Array<{
    id: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalDemos: 0,
    activeWorkflows: 0,
    totalContacts: 0,
  });
  const [recentDemos, setRecentDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    demo: Demo | null;
    domainName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    demo: null,
    domainName: '',
    isDeleting: false
  });
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentDemos(data.recentDemos);
      }
    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDemo = (demo: Demo) => {
    setDeleteModal({
      isOpen: true,
      demo,
      domainName: '',
      isDeleting: false
    });
  };

  const confirmDeleteDemo = async () => {
    if (!deleteModal.demo || !deleteModal.domainName) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch(`/api/dashboard/demos/${deleteModal.demo.slug}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: deleteModal.domainName
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Remove demo from local state
        setRecentDemos(prev => prev.filter(d => d.id !== deleteModal.demo!.id));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalDemos: prev.totalDemos - 1
        }));

        // Close modal
        setDeleteModal({
          isOpen: false,
          demo: null,
          domainName: '',
          isDeleting: false
        });

        notifications.success(data.message);
      } else {
        notifications.error(`Failed to delete demo: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Failed to delete demo:', error);
      notifications.error(`Failed to delete demo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const cancelDeleteDemo = () => {
    setDeleteModal({
      isOpen: false,
      demo: null,
      domainName: '',
      isDeleting: false
    });
  };

  const handleResendVerification = async () => {
    if (!session?.user?.id) return;

    setIsResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok) {
        notifications.success(data.message || 'Verification email sent.');
        await updateSession(); // Re-fetch session to update isVerified status immediately
      } else {
        notifications.error(`Failed to resend verification email: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Failed to resend verification email:', error);
      notifications.error(`Failed to resend verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResendingVerification(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Mobile-First Loading State */}
        <div className="px-4 py-6 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
              </div>
            ))}
          </div>
          
          {/* Actions Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Email Verification Banner */}
      {session?.user?.id && !session.user.isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
                Email verification required
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                Your email address is not verified. Please check your inbox for a verification link.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResendingVerification ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden sm:block"
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Your Dashboard
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Manage your AI support demos and workflows
        </p>
      </motion.div>

        {/* Quick Stats - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalDemos}</h3>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Your support chats</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activeWorkflows}</h3>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Settings className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Active Workflows</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalContacts}</h3>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Total Contacts</p>
          </div>
        </motion.div>

        {/* Usage Dashboard */}

        {/* Quick Actions - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <Link
            href="/dashboard/userdemo"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <Plus className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Create New Demo</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Generate a new AI support demo for your business
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/dashboard/system-messages"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">System Messages</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Manage your AI system message templates
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/dashboard/workflows"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                <Settings className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Workflow Control</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Start, stop, and monitor your AI workflows
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/dashboard/integrations"
            className="block bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl">
                <Settings className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Integrations</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Connect external services and APIs
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Recent support chats</h3>
              <Link
                href="/dashboard/demos"
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
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{demo.businessUrl}</p>
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
                      <button
                        onClick={() => handleDeleteDemo(demo)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No demos yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">Create your first demo to get started!</p>
                  <Link
                    href="/dashboard/userdemo"
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

      {/* Delete Confirmation Modal - Mobile Optimized */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-red-500 dark:text-red-400">Delete Demo</h2>
                  <button
                    onClick={cancelDeleteDemo}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    disabled={deleteModal.isDeleting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ This action cannot be undone!</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                      This will permanently delete:
                    </p>
                    <ul className="text-slate-500 dark:text-slate-500 text-sm ml-4 space-y-1">
                      <li>• The demo and all its data</li>
                      <li>• Associated n8n workflow</li>
                      <li>• System message files</li>
                      <li>• Demo page files</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Type the domain name to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={deleteModal.domainName}
                      onChange={(e) => setDeleteModal(prev => ({ ...prev, domainName: e.target.value }))}
                      placeholder={deleteModal.demo?.businessName}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100"
                      disabled={deleteModal.isDeleting}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Expected: <span className="text-slate-700 dark:text-slate-300 font-medium">{deleteModal.demo?.businessName}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={cancelDeleteDemo}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    disabled={deleteModal.isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteDemo}
                    disabled={deleteModal.isDeleting || deleteModal.domainName !== deleteModal.demo?.businessName}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteModal.isDeleting ? 'Deleting...' : 'Delete Demo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}