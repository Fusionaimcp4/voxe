"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, X, Plus, UserPlus, Settings2, AlertCircle } from "lucide-react";
import { notifications } from "@/lib/notifications";

interface HelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userTier: string;
  agentLimit: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  chatwootUserId: number;
  inboxIds: number[];
}

interface Inbox {
  id: number;
  name: string;
}

export function HelpdeskModal({
  isOpen,
  onClose,
  userEmail,
  userTier,
  agentLimit,
}: HelpdeskModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Agent form state
  const [agentName, setAgentName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  // Password validation helper
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least 1 number (0-9)';
    }
    if (!/[ !@#$%^&*()_+\-=[\]{}|';:"/\\.,`<>?:~']/.test(pwd)) {
      return 'Password must contain at least 1 special character (!@#$%^&*()_+-=[]{}|";:,.<>?)';
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch agents
      const agentsRes = await fetch('/api/dashboard/integrations/chatwoot/agents');
      const agentsData = await agentsRes.json();
      if (agentsRes.ok) {
        setAgents(agentsData.agents || []);
      }

      // Fetch inboxes
      const inboxesRes = await fetch('/api/dashboard/integrations/chatwoot/inboxes');
      const inboxesData = await inboxesRes.json();
      if (inboxesRes.ok) {
        setInboxes(inboxesData.inboxes || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    setError('');
    
    if (!agentName.trim()) {
      setError('Agent name is required');
      notifications.error('Agent name is required');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      notifications.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      notifications.error('Passwords do not match');
      return;
    }

    if (agents.length >= agentLimit && agentLimit !== -1) {
      setError(`You have reached your tier limit of ${agentLimit} agent(s)`);
      notifications.error(`You have reached your tier limit of ${agentLimit} agent(s)`);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/dashboard/integrations/chatwoot/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentName,
          password,
          userEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notifications.success('Agent created in Chatwoot! Please assign them to an inbox in the Chatwoot UI.');
        setAgentName('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        await fetchData();
        setActiveTab('manage');
      } else {
        const errorMsg = data.error || 'Failed to create agent';
        setError(errorMsg);
        notifications.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to create agent. Please try again.';
      setError(errorMsg);
      notifications.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleInbox = async (agentId: string, inboxId: number, currentInboxes: number[]) => {
    const isAssigned = currentInboxes.includes(inboxId);
    
    try {
      const response = await fetch('/api/dashboard/integrations/chatwoot/assign-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          inboxId,
          action: isAssigned ? 'remove' : 'add',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isAssigned) {
          notifications.success('Agent removed from inbox');
        } else {
          notifications.success('Agent added to inbox');
        }
        await fetchData();
      } else {
        notifications.error(data.error || 'Failed to update inbox assignment');
      }
    } catch (error) {
      console.error('Failed to toggle inbox:', error);
      notifications.error('Failed to update inbox assignment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Helpdesk Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create Agent
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'manage'
                ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Manage Collaborators
            </div>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : activeTab === 'create' ? (
          // Create Agent Tab
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Create New Helpdesk Agent
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Create a new Chatwoot agent account. Agents can be assigned to inboxes in the Manage Collaborators tab.
              </p>
            </div>

            {/* Tier Limit Warning */}
            {agents.length >= agentLimit && agentLimit !== -1 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                      Tier Limit Reached
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Your {userTier} tier allows {agentLimit} agent(s). 
                      You currently have {agents.length} agent(s).
                      {userTier !== 'ENTERPRISE' && ' Upgrade to add more agents.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="John Doe"
                  disabled={creating || (agents.length >= agentLimit && agentLimit !== -1)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  This will be the display name in Chatwoot
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(''); // Clear error when user types
                  }}
                  placeholder="Enter password"
                  disabled={creating || (agents.length >= agentLimit && agentLimit !== -1)}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border rounded-xl focus:outline-none transition-colors text-slate-900 dark:text-slate-100 disabled:opacity-50 ${
                    error ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-emerald-500'
                  }`}
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Must be at least 8 characters with 1 number and 1 special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(''); // Clear error when user types
                  }}
                  placeholder="Re-enter password"
                  disabled={creating || (agents.length >= agentLimit && agentLimit !== -1)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-blue-700 dark:text-blue-400 text-sm mb-2 font-medium">
                ℹ️ What happens next?
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>A new Chatwoot agent account will be created</li>
                <li>The agent email will be generated using plus-addressing</li>
                <li>You can assign the agent to inboxes in the Manage Collaborators tab</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onClose}
                disabled={creating}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={creating || (agents.length >= agentLimit && agentLimit !== -1)}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 min-h-[48px]"
              >
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </div>
        ) : (
          // Manage Collaborators Tab
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Manage Collaborators
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assign agents to inboxes. Toggle checkboxes to add or remove agents from inboxes.
              </p>
            </div>

            {agents.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No Agents Yet
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Create your first agent in the Create Agent tab.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Agent
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {agent.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {agent.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Assign to Inboxes:
                      </p>
                      {inboxes.map((inbox) => (
                        <label
                          key={inbox.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2"
                        >
                          <input
                            type="checkbox"
                            checked={agent.inboxIds.includes(inbox.id)}
                            onChange={() => handleToggleInbox(
                              agent.id,
                              inbox.id,
                              agent.inboxIds
                            )}
                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-900 dark:text-slate-100">
                            {inbox.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

