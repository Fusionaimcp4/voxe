"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Crown,
  Zap,
  Database,
  FileText,
  Link as LinkIcon,
  BarChart3
} from 'lucide-react';
import { SubscriptionTier } from '@/lib/generated/prisma';

interface TierLimits {
  maxDemos: number;
  maxWorkflows: number;
  maxKnowledgeBases: number;
  maxDocuments: number;
  maxIntegrations: number;
  maxHelpdeskAgents: number;
  apiCallsPerMonth: number;
  documentSizeLimit: number;
  chunkSize: number;
  maxChunksPerDocument: number;
}

interface TierLimitsData {
  [key: string]: TierLimits;
}

const tierConfig = {
  FREE: {
    label: 'Free',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    icon: <Zap className="w-4 h-4" />
  },
  STARTER: {
    label: 'Starter',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    icon: <Crown className="w-4 h-4" />
  },
  TEAM: {
    label: 'Team',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: <Crown className="w-4 h-4" />
  },
  BUSINESS: {
    label: 'Business',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: <Crown className="w-4 h-4" />
  },
  ENTERPRISE: {
    label: 'Enterprise',
    color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900 dark:to-orange-900 dark:text-amber-300',
    icon: <Crown className="w-4 h-4" />
  }
};

export default function TierLimitsManagement() {
  const [tierLimits, setTierLimits] = useState<TierLimitsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTierLimits();
  }, []);

  const fetchTierLimits = async () => {
    try {
      const response = await fetch('/api/admin/tier-limits');
      const data = await response.json();
      
      if (response.ok) {
        setTierLimits(data.tierLimits);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch tier limits' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch tier limits' });
    } finally {
      setLoading(false);
    }
  };

  const updateTierLimits = async (tier: string, limits: TierLimits) => {
    setSaving(tier);
    try {
      const response = await fetch('/api/admin/tier-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, limits })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Tier limits updated for ${tier}` });
        setTierLimits(prev => ({ ...prev, [tier]: limits }));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update tier limits' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update tier limits' });
    } finally {
      setSaving(null);
    }
  };

  const resetTierLimits = async (tier: string) => {
    setSaving(tier);
    try {
      const response = await fetch('/api/admin/tier-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Tier limits reset to defaults for ${tier}` });
        setTierLimits(prev => ({ ...prev, [tier]: data.limits }));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset tier limits' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset tier limits' });
    } finally {
      setSaving(null);
    }
  };

  const handleLimitChange = (tier: string, field: keyof TierLimits, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setTierLimits(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: numValue
      }
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === -1) return 'Unlimited';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Tier Limits Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure usage limits for each subscription tier
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`font-medium ${
            message.type === 'success' 
              ? 'text-emerald-800 dark:text-emerald-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Tier Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(tierLimits)
          .filter(([tier]) => tierConfig.hasOwnProperty(tier))
          .map(([tier, limits], index) => {
            const config = tierConfig[tier as keyof typeof tierConfig];
            
            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
              >
                {/* Tier Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetTierLimits(tier)}
                      disabled={saving === tier}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      title="Reset to defaults"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateTierLimits(tier, limits)}
                      disabled={saving === tier}
                      className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors disabled:opacity-50"
                      title="Save changes"
                    >
                      {saving === tier ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Limits Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <BarChart3 className="w-4 h-4 inline mr-1" />
                        Demos
                      </label>
                      <input
                        type="number"
                        value={limits.maxDemos === -1 ? '' : limits.maxDemos}
                        onChange={(e) => handleLimitChange(tier, 'maxDemos', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <Settings className="w-4 h-4 inline mr-1" />
                        Workflows
                      </label>
                      <input
                        type="number"
                        value={limits.maxWorkflows === -1 ? '' : limits.maxWorkflows}
                        onChange={(e) => handleLimitChange(tier, 'maxWorkflows', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <Database className="w-4 h-4 inline mr-1" />
                        Knowledge Bases
                      </label>
                      <input
                        type="number"
                        value={limits.maxKnowledgeBases === -1 ? '' : limits.maxKnowledgeBases}
                        onChange={(e) => handleLimitChange(tier, 'maxKnowledgeBases', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Documents
                      </label>
                      <input
                        type="number"
                        value={limits.maxDocuments === -1 ? '' : limits.maxDocuments}
                        onChange={(e) => handleLimitChange(tier, 'maxDocuments', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <LinkIcon className="w-4 h-4 inline mr-1" />
                        Integrations
                      </label>
                      <input
                        type="number"
                        value={limits.maxIntegrations === -1 ? '' : limits.maxIntegrations}
                        onChange={(e) => handleLimitChange(tier, 'maxIntegrations', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <Crown className="w-4 h-4 inline mr-1" />
                        Helpdesk Agents
                      </label>
                      <input
                        type="number"
                        value={limits.maxHelpdeskAgents === -1 ? '' : limits.maxHelpdeskAgents}
                        onChange={(e) => handleLimitChange(tier, 'maxHelpdeskAgents', e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Zap className="w-4 h-4 inline mr-1" />
                      API Calls/Month
                    </label>
                    <input
                      type="number"
                      value={limits.apiCallsPerMonth === -1 ? '' : limits.apiCallsPerMonth}
                      onChange={(e) => handleLimitChange(tier, 'apiCallsPerMonth', e.target.value)}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Document Size Limit
                    </label>
                    <input
                      type="number"
                      value={limits.documentSizeLimit === -1 ? '' : Math.round(limits.documentSizeLimit / (1024 * 1024))}
                      onChange={(e) => handleLimitChange(tier, 'documentSizeLimit', e.target.value ? (parseInt(e.target.value) * 1024 * 1024).toString() : '0')}
                      placeholder="MB"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Current: {formatBytes(limits.documentSizeLimit)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Usage Notes</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Leave fields empty or set to -1 for unlimited</li>
          <li>• Changes take effect immediately</li>
          <li>• Document size limit is in MB (will be converted to bytes)</li>
          <li>• Cache is automatically cleared when limits are updated</li>
        </ul>
      </div>
    </div>
  );
}
