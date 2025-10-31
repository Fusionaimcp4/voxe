"use client";

import React, { useState } from "react";
import { CRMProvider, CRMConfiguration, TestConnectionResponse } from "@/lib/integrations/types";
import { getCRMProvider, getCRMFormFields, getAllCRMProviders } from "@/lib/integrations/crm-providers";
import { ChatwootConfigForm } from "./ChatwootConfigForm";
import { CustomCRMConfigForm } from "./CustomCRMConfigForm";

interface CRMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, configuration: CRMConfiguration) => Promise<void>;
  existingIntegration?: {
    id: string;
    name: string;
    configuration: CRMConfiguration;
  };
}

export function CRMConfigModal({ isOpen, onClose, onSave, existingIntegration }: CRMConfigModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<CRMProvider>(
    existingIntegration?.configuration.provider || 'CHATWOOT'
  );
  const [integrationName, setIntegrationName] = useState(existingIntegration?.name || '');
  const [configuration, setConfiguration] = useState<Partial<CRMConfiguration>>(
    existingIntegration?.configuration || {}
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providerInfo = getCRMProvider(selectedProvider);
  const allProviders = getAllCRMProviders();

  const handleProviderChange = (provider: CRMProvider) => {
    setSelectedProvider(provider);
    setConfiguration({});
    setTestResult(null);
    setError(null);
  };

  const handleConfigurationChange = (config: Partial<CRMConfiguration>) => {
    setConfiguration(config);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CRM',
          configuration: {
            ...configuration,
            provider: selectedProvider,
          },
        }),
      });

      const result = await response.json();
      setTestResult(result);

      if (!result.success) {
        setError(result.error || result.message);
      }
    } catch (err) {
      setError('Failed to test connection');
      setTestResult({
        success: false,
        message: 'Failed to test connection',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!integrationName.trim()) {
      setError('Integration name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(integrationName, {
        ...configuration,
        provider: selectedProvider,
      } as CRMConfiguration);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save integration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {existingIntegration ? 'Edit' : 'Add'} CRM Integration
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Integration Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Integration Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
              placeholder="My Chatwoot Integration"
              disabled={isSaving}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              A friendly name to identify this integration
            </p>
          </div>

          {/* CRM Provider Selection */}
          {!existingIntegration && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                CRM Provider <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedProvider === provider.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    disabled={isSaving}
                  >
                    <div className="text-2xl mb-2">{provider.icon}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{provider.name}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                {providerInfo.description}
              </p>
            </div>
          )}

          {/* Provider-Specific Configuration Form */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
              {providerInfo.name} Configuration
            </h3>
            
            {selectedProvider === 'CHATWOOT' && (
              <ChatwootConfigForm
                configuration={configuration}
                onChange={handleConfigurationChange}
                disabled={isSaving}
              />
            )}
            
            {selectedProvider === 'CUSTOM' && (
              <CustomCRMConfigForm
                configuration={configuration}
                onChange={handleConfigurationChange}
                disabled={isSaving}
              />
            )}
            
            {!['CHATWOOT', 'CUSTOM'].includes(selectedProvider) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                  🚧 {providerInfo.name} integration is coming soon!
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`border rounded-xl p-4 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {testResult.success ? '✓ ' : '✗ '}{testResult.message}
              </p>
              {testResult.details && testResult.success && (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {testResult.details.accountInfo && (
                    <p>Account: {testResult.details.accountInfo.name || testResult.details.accountInfo.id}</p>
                  )}
                  {testResult.details.features && (
                    <p>Features: {testResult.details.features.join(', ')}</p>
                  )}
                </div>
              )}
              {testResult.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{testResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving || !['CHATWOOT', 'CUSTOM'].includes(selectedProvider)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 min-h-[48px]"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !integrationName.trim() || !['CHATWOOT', 'CUSTOM'].includes(selectedProvider)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              {isSaving ? 'Saving...' : (existingIntegration ? 'Update' : 'Save') + ' Integration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

