"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { Plus, Link as LinkIcon, Calendar, Database, Zap, Webhook, Users, Settings, Trash2, Power, MessageCircle, Copy, Check, X, ChevronDown, Crown, Lock, Headphones } from "lucide-react";
import { CRMConfigModal } from "@/components/integrations/CRMConfigModal";
import { HelpdeskModal } from "@/components/integrations/HelpdeskModal";
import { CRMConfiguration } from "@/lib/integrations/types";
import { notifications } from "@/lib/notifications";

interface Integration {
  id: string;
  name: string;
  type: 'CALENDAR' | 'DATABASE' | 'API' | 'WEBHOOK' | 'CRM';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  configuration: any;
  isActive: boolean;
  createdAt: string;
}

interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  errorIntegrations: number;
}

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    inactiveIntegrations: 0,
    errorIntegrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showChatScriptModal, setShowChatScriptModal] = useState(false);
  const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [widgetPosition, setWidgetPosition] = useState<'left' | 'right'>('right');
  const [widgetType, setWidgetType] = useState<'standard' | 'expanded_bubble'>('standard');
  const [availableChats, setAvailableChats] = useState<Array<{id: string, name: string, websiteToken: string, baseUrl: string}>>([]);

  const userTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE';
  const isPaidUser = userTier !== 'FREE';

  useEffect(() => {
    fetchIntegrations();
    fetchAvailableChats();
  }, []);

  const fetchAvailableChats = async () => {
    try {
      const response = await fetch('/api/dashboard/demos');
      const data = await response.json();
      
      if (response.ok && data.demos) {
        // Transform demo data to chat format
        const chats = data.demos.map((demo: any) => ({
          id: demo.id,
          name: demo.businessName,
          websiteToken: demo.chatwootWebsiteToken,
          baseUrl: 'https://chatwoot.mcp4.ai' // Default Chatwoot base URL
        })).filter((chat: any) => chat.websiteToken); // Only include demos with website tokens
        
        setAvailableChats(chats);
        if (chats.length > 0) {
          setSelectedChat(chats[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch available chats:', error);
      // Fallback to empty array if API fails
      setAvailableChats([]);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/dashboard/integrations');
      const data = await response.json();
      
      if (response.ok) {
        setIntegrations(data.integrations);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = (type: string) => {
    setSelectedIntegrationType(type);
    if (type === 'CRM') {
      setShowCRMModal(true);
    } else if (type === 'CHAT_WIDGET') {
      // Check if user is paid before allowing access
      if (!isPaidUser) {
        // Redirect to pricing page instead of showing modal
        window.location.href = '/pricing';
        return;
      }
      setShowChatScriptModal(true);
    } else if (type === 'HELPDESK') {
      setShowHelpdeskModal(true);
    } else {
      // For other types, show a "coming soon" message
      notifications.info(`${type} integration coming soon!`);
    }
  };

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    if (integration.type === 'CRM') {
      setShowCRMModal(true);
    } else {
      notifications.info(`Editing ${integration.type} integration coming soon!`);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    const confirmed = await notifications.confirm('Are you sure you want to delete this integration? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchIntegrations();
      } else {
        const error = await response.json();
        notifications.error(`Failed to delete integration: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete integration:', error);
      notifications.error('Failed to delete integration. Please try again.');
    }
  };

  const handleToggleActive = async (integrationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        await fetchIntegrations();
      } else {
        const error = await response.json();
        notifications.error(`Failed to update integration: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle integration status:', error);
      notifications.error('Failed to update integration. Please try again.');
    }
  };

  const handleSaveCRM = async (name: string, configuration: CRMConfiguration) => {
    try {
      let response;

      if (editingIntegration) {
        // Update existing integration
        response = await fetch(`/api/dashboard/integrations/${editingIntegration.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            configuration,
          }),
        });
      } else {
        // Create new integration
        response = await fetch('/api/dashboard/integrations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            type: 'CRM',
            configuration,
          }),
        });
      }

      if (response.ok) {
        await fetchIntegrations();
        setShowCRMModal(false);
        setEditingIntegration(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save integration');
      }
    } catch (error) {
      console.error('Failed to save CRM integration:', error);
      throw error;
    }
  };

  const handleCloseCRMModal = () => {
    setShowCRMModal(false);
    setEditingIntegration(null);
  };

  const handleCloseChatScriptModal = () => {
    setShowChatScriptModal(false);
    setCopied(false);
    setWidgetPosition('right');
    setWidgetType('standard');
    if (availableChats.length > 0) {
      setSelectedChat(availableChats[0].id);
    }
  };

  const handleCopyScript = async () => {
    const selectedChatData = availableChats.find(chat => chat.id === selectedChat);
    if (!selectedChatData) return;

    const script = `<script>
  window.chatwootSettings = {"position":"${widgetPosition}","type":"${widgetType}","launcherTitle":"Chat with us"};
  (function(d,t) {
    var BASE_URL = "${selectedChatData.baseUrl}";
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = BASE_URL + "/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload = function() {
      window.chatwootSDK.run({
        websiteToken: '${selectedChatData.websiteToken}',
        baseUrl: BASE_URL
      });
    };
  })(document,"script");
</script>`;

    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy script:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = script;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'INACTIVE': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      case 'ERROR': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALENDAR': return <Calendar className="w-6 h-6 text-blue-500" />;
      case 'DATABASE': return <Database className="w-6 h-6 text-purple-500" />;
      case 'API': return <Zap className="w-6 h-6 text-orange-500" />;
      case 'WEBHOOK': return <Webhook className="w-6 h-6 text-indigo-500" />;
      case 'CRM': return <Users className="w-6 h-6 text-emerald-500" />;
      case 'CHAT_WIDGET': return <MessageCircle className="w-6 h-6 text-cyan-500" />;
      case 'HELPDESK': return <Headphones className="w-6 h-6 text-rose-500" />;
      default: return <LinkIcon className="w-6 h-6 text-slate-500" />;
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
        
        {/* Integrations Skeleton */}
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              External Integrations
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              userTier === 'FREE' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
              userTier === 'PRO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              userTier === 'PRO_PLUS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
              'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900 dark:to-orange-900 dark:text-amber-300'
            }`}>
              {userTier === 'PRO_PLUS' ? 'PRO+' : userTier}
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Connect external services to enhance your AI workflows
            {!isPaidUser && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                • Some features require PRO+ plans
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleAddIntegration('CRM')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Integration</span>
            <span className="sm:hidden">Add</span>
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
          <h3 className="text-2xl font-bold text-blue-500 mb-2">{stats.totalIntegrations}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Integrations</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-green-500 mb-2">{stats.activeIntegrations}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-slate-500 mb-2">{stats.inactiveIntegrations}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Inactive</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-red-500 mb-2">{stats.errorIntegrations}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Errors</p>
        </div>
      </motion.div>

      {/* Available Integration Types */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Available Integrations</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { type: 'CRM', name: 'CRM Integration', description: 'Connect Chatwoot, Salesforce, HubSpot, or custom CRM systems', available: true, tier: 'FREE' },
            { type: 'CHAT_WIDGET', name: 'Chat Widget Script', description: 'Get the embeddable chat script for your website', available: isPaidUser, tier: 'PRO', requiresUpgrade: !isPaidUser },
            { type: 'HELPDESK', name: 'Helpdesk Setup', description: 'Create and manage Chatwoot helpdesk agents and assignments', available: true, tier: 'FREE' },
            { type: 'DATABASE', name: 'Database Integration', description: 'Connect to PostgreSQL, MySQL, MongoDB, or other databases', available: false, tier: 'PRO_PLUS' },
            { type: 'API', name: 'API Integration', description: 'Connect to REST APIs, GraphQL endpoints, or custom services', available: false, tier: 'PRO_PLUS' },
            { type: 'WEBHOOK', name: 'Webhook Integration', description: 'Set up custom webhooks for real-time notifications', available: false, tier: 'PRO_PLUS' },
          ].map((integration) => (
            <div
              key={integration.type}
              className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all ${
                integration.available 
                  ? 'hover:border-emerald-500/50 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10' 
                  : 'opacity-60'
              }`}
              onClick={() => integration.available && handleAddIntegration(integration.type)}
            >
              <div className="flex items-center gap-3 mb-4">
                {getTypeIcon(integration.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {integration.name}
                    </h4>
                    {integration.requiresUpgrade && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full">
                        <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{integration.tier}+</span>
                      </div>
                    )}
                    {!integration.available && !integration.requiresUpgrade && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">(Coming Soon)</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{integration.description}</p>
              
              {integration.requiresUpgrade && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Upgrade to {integration.tier} to unlock</span>
                  </div>
                  <Link 
                    href="/pricing" 
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    <Crown className="w-3 h-3" />
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Integrations List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-6"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Integrations</h3>
        
        {integrations.length > 0 ? (
          integrations.map((integration) => {
            const status = integration.isActive ? 'ACTIVE' : 'INACTIVE';
            const crmProvider = integration.type === 'CRM' ? integration.configuration?.provider : null;
            
            return (
              <div
                key={integration.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(integration.type)}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{integration.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {integration.type}
                        {crmProvider && ` - ${crmProvider}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <button
                      onClick={() => handleToggleActive(integration.id, integration.isActive)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Power className="w-3 h-3" />
                      {integration.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditIntegration(integration)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      Configure
                    </button>
                    <button
                      onClick={() => handleDeleteIntegration(integration.id)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Created: {new Date(integration.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <LinkIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">No Integrations Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Connect external services to enhance your AI workflows and automate more tasks.
            </p>
            <button
              onClick={() => handleAddIntegration('CRM')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Add Your First Integration
            </button>
          </div>
        )}
      </motion.div>

      {/* Chat Widget Script Modal */}
      {showChatScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-cyan-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Chat Widget Script
                </h2>
              </div>
              <button
                onClick={handleCloseChatScriptModal}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-slate-600 dark:text-slate-400">
                Configure your chat widget and copy the script to embed it on your website.
              </p>

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chat Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Chat
                  </label>
                  {availableChats.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedChat}
                        onChange={(e) => setSelectedChat(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 appearance-none"
                      >
                        {availableChats.map((chat) => (
                          <option key={chat.id} value={chat.id}>
                            {chat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400">
                      No chats available. Create a demo first.
                    </div>
                  )}
                </div>

                {/* Widget Position */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Widget Bubble Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWidgetPosition('left')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        widgetPosition === 'left'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => setWidgetPosition('right')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        widgetPosition === 'right'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>

                {/* Widget Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Widget Bubble Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWidgetType('standard')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        widgetType === 'standard'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setWidgetType('expanded_bubble')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        widgetType === 'expanded_bubble'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Expanded Bubble
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Script Display */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Generated Script</h3>
                  {availableChats.length > 0 ? (
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Script
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-3 py-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Script
                    </button>
                  )}
                </div>
                {availableChats.length > 0 ? (
                  <pre className="text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap bg-white dark:bg-slate-800 p-3 rounded-lg border">
{`<script>
  window.chatwootSettings = {"position":"${widgetPosition}","type":"${widgetType}","launcherTitle":"Chat with us"};
  (function(d,t) {
    var BASE_URL = "${availableChats.find(chat => chat.id === selectedChat)?.baseUrl || 'https://chatwoot.mcp4.ai'}";
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = BASE_URL + "/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload = function() {
      window.chatwootSDK.run({
        websiteToken: '${availableChats.find(chat => chat.id === selectedChat)?.websiteToken || ''}',
        baseUrl: BASE_URL
      });
    };
  })(document,"script");
</script>`}
                  </pre>
                ) : (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border text-slate-500 dark:text-slate-400 text-sm">
                    Create a demo first to generate the chat widget script.
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Implementation Instructions</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Paste the script before the closing &lt;/body&gt; tag</li>
                  <li>• The chat widget will appear in the {widgetPosition} corner</li>
                  <li>• The script loads asynchronously and won't block your page</li>
                  <li>• Customize the position and appearance using chatwootSettings</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseChatScriptModal}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CRM Integration Modal */}
      <CRMConfigModal
        isOpen={showCRMModal}
        onClose={handleCloseCRMModal}
        onSave={handleSaveCRM}
        existingIntegration={editingIntegration ? {
          id: editingIntegration.id,
          name: editingIntegration.name,
          configuration: editingIntegration.configuration,
        } : undefined}
      />

      {/* Helpdesk Modal */}
      <HelpdeskModal
        isOpen={showHelpdeskModal}
        onClose={() => setShowHelpdeskModal(false)}
        userEmail={session?.user?.email || ''}
        userTier={userTier}
        agentLimit={userTier === 'FREE' ? 1 : userTier === 'PRO' ? 3 : userTier === 'PRO_PLUS' ? 5 : -1}
      />
    </div>
  );
}
