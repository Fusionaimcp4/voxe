"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Settings, 
  Play, 
  Square, 
  RotateCcw, 
  ChevronRight, 
  Eye, 
  FileText, 
  ArrowLeft,
  Clock,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Circle,
  Pause,
  X
} from "lucide-react";
import { notifications } from "@/lib/notifications";

interface Workflow {
  id: string;
  demoId: string;
  n8nWorkflowId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';
  configuration: {
    aiModel?: string;
    confidenceThreshold?: number;
    escalationRules?: any[];
    externalIntegrations?: any[];
    timingThresholds?: {
      assigneeThreshold?: number; // seconds to wait after human response when assigned to agent
      teamThreshold?: number; // seconds to wait when assigned to team
      escalationThreshold?: number; // seconds before escalating to supervisor
      escalationContact?: string; // supervisor name for escalation
      escalationMessage?: string; // custom message for escalation notification
    };
  };
  createdAt: string;
  updatedAt: string;
  demo: {
    businessName: string;
    slug: string;
    demoUrl: string;
  };
}

interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  inactiveWorkflows: number;
  errorWorkflows: number;
}

interface FusionModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  isActive: boolean;
  supportsJsonMode: boolean;
  supportsToolUse: boolean;
  supportsVision: boolean;
  contextLength: number;
  inputCost: number;
  outputCost: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    inactiveWorkflows: 0,
    errorWorkflows: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [timingThresholds, setTimingThresholds] = useState({
    assigneeThreshold: 300, // 5 minutes default
    teamThreshold: 100, // ~1.7 minutes default
    escalationThreshold: 1800, // 30 minutes default
    escalationContact: '',
    escalationMessage: ''
  });
  const [availableModels, setAvailableModels] = useState<FusionModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [switchingModel, setSwitchingModel] = useState(false);
  const [helpdeskAgents, setHelpdeskAgents] = useState<Array<{id: string, name: string, email: string}>>([]);

  useEffect(() => {
    fetchWorkflows();
    fetchAvailableModels();
    fetchHelpdeskAgents();
  }, []);

  const fetchHelpdeskAgents = async () => {
    try {
      const response = await fetch('/api/dashboard/integrations/chatwoot/agents');
      const data = await response.json();
      if (response.ok && data.agents) {
        setHelpdeskAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to fetch helpdesk agents:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/dashboard/workflows');
      const data = await response.json();
      
      if (response.ok) {
        setWorkflows(data.workflows);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('/api/dashboard/models');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch available models:', error);
    }
  };

  const handleWorkflowAction = async (workflowId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      console.log(`🔄 ${action} workflow ${workflowId}...`);
      
      const response = await fetch(`/api/dashboard/workflows/${workflowId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Workflow ${action} successful:`, data);
        // Refresh workflows after action
        fetchWorkflows();
        notifications.success(`Workflow ${action} successful!`);
      } else {
        console.error(`❌ Workflow ${action} failed:`, data);
        notifications.error(`Failed to ${action} workflow: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`💥 Failed to ${action} workflow:`, error);
      notifications.error(`Failed to ${action} workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'INACTIVE': return <Pause className="w-4 h-4 text-slate-400" />;
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'INACTIVE': return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'ERROR': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'PENDING': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const handleOpenConfiguration = (workflow: Workflow) => {
    // Set current timing thresholds from workflow configuration
    const currentThresholds = {
      assigneeThreshold: workflow.configuration.timingThresholds?.assigneeThreshold ?? 300,
      teamThreshold: workflow.configuration.timingThresholds?.teamThreshold ?? 100,
      escalationThreshold: workflow.configuration.timingThresholds?.escalationThreshold ?? 1800,
      escalationContact: workflow.configuration.timingThresholds?.escalationContact ?? '',
      escalationMessage: workflow.configuration.timingThresholds?.escalationMessage ?? ''
    };
    setTimingThresholds(currentThresholds);
    setSelectedModel(workflow.configuration.aiModel || '');
    setSelectedWorkflow(workflow);
  };

  const handleModelSwitch = async () => {
    if (!selectedWorkflow || !selectedModel) return;
    
    setSwitchingModel(true);
    try {
      const response = await fetch(`/api/dashboard/workflows/${selectedWorkflow.id}/switch-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          model: selectedModel
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        notifications.success(data.message);
        // Refresh workflows to show updated model
        fetchWorkflows();
        setSelectedWorkflow(null);
      } else {
        notifications.error(`Failed to switch model: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
      notifications.error(`Failed to switch model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSwitchingModel(false);
    }
  };

  const handleSaveTimingThresholds = async () => {
    if (!selectedWorkflow) return;
    
    try {
      const response = await fetch(`/api/dashboard/workflows/${selectedWorkflow.id}/timing-thresholds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          assigneeThreshold: timingThresholds.assigneeThreshold,
          teamThreshold: timingThresholds.teamThreshold,
          escalationThreshold: timingThresholds.escalationThreshold,
          escalationContact: timingThresholds.escalationContact,
          escalationMessage: timingThresholds.escalationMessage
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        notifications.success(data.message);
        // Refresh workflows to show updated thresholds
        fetchWorkflows();
        setSelectedWorkflow(null);
      } else {
        notifications.error(`Failed to save timing thresholds: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save timing thresholds:', error);
      notifications.error(`Failed to save timing thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatSecondsToMinutes = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
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
        
        {/* Workflows Skeleton */}
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
        className="hidden sm:block"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Workflow Management
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Control and monitor your AI support workflows
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>

        {/* Stats Grid - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalWorkflows}</h3>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Settings className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Total Workflows</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeWorkflows}</h3>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Active</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactiveWorkflows}</h3>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Pause className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Inactive</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errorWorkflows}</h3>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Errors</p>
          </div>
        </motion.div>

        {/* Workflows List - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          {workflows.length > 0 ? (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{workflow.demo.businessName}</h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{workflow.demo.slug}</p>
                  </div>
                </div>
                
                {/* Configuration Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                    <span className="text-slate-500 dark:text-slate-400 block text-xs font-medium mb-1">AI Model</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {workflow.configuration.aiModel 
                        ? availableModels.find(m => m.id === workflow.configuration.aiModel)?.name || workflow.configuration.aiModel
                        : 'Not set'
                      }
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                    <span className="text-slate-500 dark:text-slate-400 block text-xs font-medium mb-1">Assignee Wait</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {workflow.configuration.timingThresholds?.assigneeThreshold 
                        ? formatSecondsToMinutes(workflow.configuration.timingThresholds.assigneeThreshold)
                        : '5m'
                      }
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                    <span className="text-slate-500 dark:text-slate-400 block text-xs font-medium mb-1">Team Wait</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {workflow.configuration.timingThresholds?.teamThreshold 
                        ? formatSecondsToMinutes(workflow.configuration.timingThresholds.teamThreshold)
                        : '1m 40s'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {workflow.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleWorkflowAction(workflow.id, 'stop')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleWorkflowAction(workflow.id, 'start')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => handleWorkflowAction(workflow.id, 'restart')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart
                  </button>
                  <button
                    onClick={() => handleOpenConfiguration(workflow)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                </div>
                
                {/* Demo Links */}
                <div className="flex gap-2">
                  <Link
                    href={workflow.demo.demoUrl}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Demo
                  </Link>
                  <Link
                    href={`/dashboard/workflows/${workflow.id}/logs`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Logs
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">No Workflows Found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Workflows are created automatically when you create demos. Create your first demo to get started.
              </p>
              <Link
                href="/dashboard/userdemo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Create Your First Demo
              </Link>
            </div>
          )}
        </motion.div>

      {/* Workflow Configuration Modal - Mobile Optimized */}
      <AnimatePresence>
        {selectedWorkflow && (
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configure Workflow</h2>
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                <div>
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
    AI Model
  </label>
  <select 
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100"
  >
    <option value="">Select a model...</option>
    {availableModels
      .filter((model) => model.provider.toLowerCase() === 'openai') // only OpenAI models
      .map((model) => (
        <option key={model.id} value={model.id}>
          {model.name} ({model.provider})
        </option>
      ))
    }
  </select>
  {selectedModel && (
    <div className="mt-2 flex justify-end">
      <button
        onClick={handleModelSwitch}
        disabled={switchingModel || selectedModel === selectedWorkflow?.configuration.aiModel}
        className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {switchingModel ? 'Switching...' : 'Switch Model'}
      </button>
    </div>
  )}
</div>
                  
                  {/* Timing Thresholds Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hold AI Response Timing</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Configure how long to wait before the Hold AI responds in different scenarios.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Assignee Threshold
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="60"
                          max="1800"
                          step="30"
                          value={timingThresholds.assigneeThreshold}
                          onChange={(e) => setTimingThresholds(prev => ({ ...prev, assigneeThreshold: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px] font-medium">
                          {formatSecondsToMinutes(timingThresholds.assigneeThreshold)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Wait time after human response when assigned to specific agent</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Team Threshold
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="30"
                          max="600"
                          step="15"
                          value={timingThresholds.teamThreshold}
                          onChange={(e) => setTimingThresholds(prev => ({ ...prev, teamThreshold: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px] font-medium">
                          {formatSecondsToMinutes(timingThresholds.teamThreshold)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Wait time when assigned to a team</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Escalation Threshold
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="300"
                          max="7200"
                          step="60"
                          value={timingThresholds.escalationThreshold}
                          onChange={(e) => setTimingThresholds(prev => ({ ...prev, escalationThreshold: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px] font-medium">
                          {formatSecondsToMinutes(timingThresholds.escalationThreshold)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Wait time before escalating to supervisor</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Escalation Contact
                    </label>
                    <div className="space-y-3">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setTimingThresholds(prev => ({ ...prev, escalationContact: e.target.value }));
                          }
                        }}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Quick select from helpdesk agents...</option>
                        {helpdeskAgents.map((agent) => (
                          <option key={agent.id} value={agent.name}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={timingThresholds.escalationContact}
                        onChange={(e) => setTimingThresholds(prev => ({ ...prev, escalationContact: e.target.value }))}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100"
                        placeholder="Or enter supervisor name manually (e.g., Jon Monark)"
                      />
                      {helpdeskAgents.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          No helpdesk agents found. Add agents in Integrations → Helpdesk Setup.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Escalation Message
                    </label>
                    <textarea
                      value={timingThresholds.escalationMessage}
                      onChange={(e) => setTimingThresholds(prev => ({ ...prev, escalationMessage: e.target.value }))}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-4 py-3 text-slate-900 dark:text-slate-100 h-24"
                      placeholder="Enter custom message to include in supervisor notification..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTimingThresholds}
                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Save Configuration
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