'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, DollarSign, Zap, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ActivityLog {
  id: number;
  timestamp: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  llm_provider_cost: string;
  neuroswitch_fee: string;
  response_time: number;
  fallback_reason?: string;
  request_model: string;
  api_key_id?: number;
  api_key_name?: string;
}

interface UsageMetrics {
  user: {
    id: number;
    email: string;
    display_name: string;
  };
  metrics: {
    spend: number;
    tokens: number;
    requests: number;
  };
  activity: ActivityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLogs: number;
    limit: number;
  };
}

interface ActivityLogsProps {
  userId: string;
}

export function ActivityLogs({ userId }: ActivityLogsProps) {
  const [activityData, setActivityData] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(`/api/dashboard/fusion/usage?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle error response from API
      if (data.error && data.data) {
        // API returned error but with fallback data
        setActivityData(data.data);
      } else if (data.error) {
        // API returned error without fallback data
        throw new Error(data.error);
      } else {
        // Normal successful response
        setActivityData(data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
      toast({
        title: 'Error',
        description: 'Failed to load activity logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [userId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCost = (cost: string | number) => {
    const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;
    return `$${costNum.toFixed(6)}`;
  };

  const formatResponseTime = (time: number) => {
    return `${(time * 1000).toFixed(0)}ms`;
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'anthropic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'google':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModelBadgeColor = (model: string) => {
    if (model.includes('gpt-4')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (model.includes('gpt-3.5')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (model.includes('claude')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Activity Logs
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Loading your API usage activity...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Activity Logs
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Error loading activity logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchActivityLogs} variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activityData) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Activity Logs
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            No activity data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No API activity found for this user.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg sm:text-xl">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              Activity Logs
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Your API usage activity and performance metrics
            </CardDescription>
          </div>
          <Button
            onClick={fetchActivityLogs}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Spend</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCost(activityData.metrics?.spend || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tokens</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {(activityData.activity || []).reduce((sum, log) => sum + (log.prompt_tokens || 0) + (log.completion_tokens || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Requests</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{activityData.metrics?.requests || 0}</p>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Timestamp
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Provider / Model
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Tokens
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Cost
                </th>
                <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Response Time
                </th>
              </tr>
            </thead>
            <tbody>
              {(activityData.activity || []).map((log) => (
                <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100 break-words">{formatTimestamp(log.timestamp)}</span>
                      {log.fallback_reason && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs mt-1 w-fit bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                          Fallback: {log.fallback_reason}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 sm:py-agawa px-1 sm:px-2">
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-[10px] sm:text-xs w-fit ${getProviderBadgeColor(log.provider)}`}>
                        {log.provider}
                      </Badge>
                      <Badge className={`text-[10px] sm:text-xs w-fit ${getModelBadgeColor(log.model)}`}>
                        {log.model}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{(log.prompt_tokens + log.completion_tokens).toLocaleString()}</span>
                      <span className="text-[10px] sm:text-xs text-slate- Суtext-slate-400">
                        {log.prompt_tokens} → {log.completion_tokens}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{formatCost(log.llm_provider_cost)}</span>
                      {parseFloat(log.neuroswitch_fee) > 0 && (
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          Fee: {formatCost(log.neuroswitch_fee)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatResponseTime(log.response_time)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {activityData.pagination && (
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Showing {(activityData.activity || []).length} of {activityData.pagination.totalLogs} logs
            {activityData.pagination.totalPages > 1 && (
              <span> • Page {activityData.pagination.currentPage} of {activityData.pagination.totalPages}</span>
            )}
          </div>
        )}

        {/* Empty State */}
        {(!activityData.activity || activityData.activity.length === 0) && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No Activity Yet</p>
            <p className="text-sm">Your API usage will appear here once you start making requests.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
