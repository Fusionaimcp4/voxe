"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Database, FileText, Zap, AlertCircle, X } from "lucide-react";
import { notifications } from "@/lib/notifications";

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  isActive: boolean;
  createdAt: string;
  documentCount: number;
  workflowCount: number;
}

interface KBStats {
  total: number;
  active: number;
  totalDocuments: number;
  totalTokens: number;
}

export default function KnowledgeBasesPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [stats, setStats] = useState<KBStats>({
    total: 0,
    active: 0,
    totalDocuments: 0,
    totalTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch('/api/dashboard/knowledge-bases');
      const data = await response.json();
      
      if (response.ok) {
        setKnowledgeBases(data.knowledgeBases);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKB = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/dashboard/knowledge-bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        await fetchKnowledgeBases();
        setShowCreateModal(false);
      } else {
        const error = await response.json();
        notifications.error(`Failed to create knowledge base: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      notifications.error('Failed to create knowledge base. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          ))}
        </div>
        
        {/* Knowledge Bases Skeleton */}
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
            Knowledge Bases
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage your AI-powered document libraries
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Knowledge Base</span>
            <span className="sm:hidden">Create KB</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center min-h-[48px] flex items-center justify-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <Database className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="text-2xl font-bold text-blue-500 mb-2">{stats.total}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Knowledge Bases</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <Zap className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="text-2xl font-bold text-green-500 mb-2">{stats.active}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <FileText className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="text-2xl font-bold text-purple-500 mb-2">{stats.totalDocuments}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <AlertCircle className="w-8 h-8 text-orange-500 mb-3" />
          <h3 className="text-2xl font-bold text-orange-500 mb-2">{(stats.totalTokens / 1000).toFixed(1)}K</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Tokens</p>
        </div>
      </motion.div>

      {/* Knowledge Bases List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Knowledge Bases</h3>
        
        {knowledgeBases.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {knowledgeBases.map((kb) => (
              <Link
                key={kb.id}
                href={`/dashboard/knowledge-bases/${kb.id}`}
                className="block"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <Database className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      kb.isActive 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {kb.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-slate-900 dark:text-slate-100">
                    {kb.name}
                  </h4>
                  
                  {kb.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {kb.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Documents</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{kb.totalDocuments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Chunks</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{kb.totalChunks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Workflows</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{kb.workflowCount}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">No Knowledge Bases Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Create your first knowledge base to start adding documents and powering your AI workflows with custom knowledge.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Create Your First Knowledge Base
            </button>
          </div>
        )}
      </motion.div>

      {/* Create KB Modal */}
      {showCreateModal && (
        <CreateKBModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKB}
        />
      )}
    </div>
  );
}

// Create Knowledge Base Modal Component
function CreateKBModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      notifications.warning('Please enter a name');
      return;
    }

    setCreating(true);
    try {
      await onCreate(name, description);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Knowledge Base</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            disabled={creating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100"
              placeholder="e.g., Product Documentation, Customer Support, Technical Guides"
              maxLength={100}
              required
              disabled={creating}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {name.length}/100 characters
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100 h-24 resize-none"
              placeholder="What kind of information will this knowledge base contain?"
              maxLength={500}
              disabled={creating}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {description.length}/500 characters
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Knowledge Base
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

