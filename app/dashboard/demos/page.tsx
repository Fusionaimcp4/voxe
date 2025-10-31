"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, ExternalLink, Trash2, Settings, MessageSquare, Zap, X, Eye } from "lucide-react";
import { notifications } from "@/lib/notifications";

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

export default function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
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

  useEffect(() => {
    fetchDemos();
  }, []);

  const fetchDemos = async () => {
    try {
      const response = await fetch('/api/dashboard/demos');
      const data = await response.json();
      
      if (response.ok) {
        setDemos(data.demos);
      }
    } catch (error) {
      console.error('Failed to fetch demos:', error);
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
        setDemos(prev => prev.filter(d => d.id !== deleteModal.demo!.id));
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
      console.error('Failed to delete demo:', error);
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

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
        </div>
        
        {/* Demos Skeleton */}
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
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Your support chats
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage and monitor your AI support chats
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/userdemo"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create New</span>
            <span className="sm:hidden">New Demo</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center min-h-[48px] flex items-center justify-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Demos List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-4"
      >
        {demos.length > 0 ? (
          demos.map((demo) => (
            <div
              key={demo.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{demo.businessName}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{demo.businessUrl}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(demo.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                    Active
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={demo.demoUrl}
                      target="_blank"
                      className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Demo
                    </Link>
                    <button
                      onClick={() => handleDeleteDemo(demo)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <span className="text-slate-500 dark:text-slate-400">Demo URL:</span>
                  <div className="text-slate-700 dark:text-slate-300 mt-1 break-all text-xs">{demo.demoUrl}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <span className="text-slate-500 dark:text-slate-400">Workflows:</span>
                  <div className="text-slate-700 dark:text-slate-300 mt-1">{demo.workflows.length}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <span className="text-slate-500 dark:text-slate-400">System Message:</span>
                  <div className="text-slate-700 dark:text-slate-300 mt-1">Active</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/workflows`}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Manage Workflows
                </Link>
                <Link
                  href={`/dashboard/system-messages`}
                  className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Edit System Message
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Plus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">No Demos Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first AI support demo to get started with LocalBox.
            </p>
            <Link
              href="/dashboard/userdemo"
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Create Your First Demo
            </Link>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Demo</h2>
              <button
                onClick={cancelDeleteDemo}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                disabled={deleteModal.isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-400 font-medium mb-2">⚠️ This action cannot be undone!</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                  This will permanently delete:
                </p>
                <ul className="text-slate-600 dark:text-slate-400 text-sm mt-2 ml-4 list-disc">
                  <li>The demo and all its data</li>
                  <li>Associated n8n workflow</li>
                  <li>System message files</li>
                  <li>Demo page files</li>
                  <li>Chatwoot inbox and bot</li>
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Expected: <span className="text-slate-700 dark:text-slate-300">{deleteModal.demo?.businessName}</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={cancelDeleteDemo}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-h-[48px]"
                disabled={deleteModal.isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDemo}
                disabled={deleteModal.isDeleting || deleteModal.domainName !== deleteModal.demo?.businessName}
                className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 min-h-[48px]"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Demo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
