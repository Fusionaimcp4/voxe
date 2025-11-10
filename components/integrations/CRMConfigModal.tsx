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
  onRefresh?: () => Promise<void>; // Optional callback to refresh integrations list
  hasChatvoxeIntegration?: boolean; // Whether user already has an active CHATVOXE integration
}

export function CRMConfigModal({ isOpen, onClose, onSave, existingIntegration, onRefresh, hasChatvoxeIntegration = false }: CRMConfigModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<CRMProvider>(
    existingIntegration?.configuration.provider || 'CHATWOOT'
  );
  const [configuration, setConfiguration] = useState<Partial<CRMConfiguration>>(
    existingIntegration?.configuration || {}
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);
  const [provisioningSuccess, setProvisioningSuccess] = useState<string | null>(null);

  const providerInfo = getCRMProvider(selectedProvider);
  const allProviders = getAllCRMProviders();

  // Update state when existingIntegration changes (e.g., after Voxe helpdesk creation)
  React.useEffect(() => {
    if (existingIntegration) {
      setSelectedProvider(existingIntegration.configuration.provider || 'CHATWOOT');
      setConfiguration(existingIntegration.configuration || {});
    } else {
      // Reset to defaults when no existing integration
      setSelectedProvider('CHATWOOT');
      setConfiguration({});
    }
    // Reset error states when integration changes
    setError(null);
    setTestResult(null);
    setProvisioningError(null);
    setProvisioningSuccess(null);
  }, [existingIntegration]);

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

  const handleCreateVoxeHelpdesk = async () => {
    setIsProvisioning(true);
    setProvisioningError(null);
    setProvisioningSuccess(null);
    setError(null);

    try {
      const response = await fetch('/api/helpdesk/create-voxe-helpdesk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.status === 'exists') {
        setProvisioningError(result.message || 'You already have a Chatwoot integration.');
        setIsProvisioning(false);
        return;
      }

      if (result.status === 'error') {
        setProvisioningError(result.error || 'Failed to create chatvoxe Helpdesk');
        setIsProvisioning(false);
        return;
      }

      if (result.status === 'partial_success') {
        setProvisioningError(result.message || 'Account created but API token needs to be set manually.');
        setIsProvisioning(false);
        return;
      }

      if (result.status === 'success') {
        // Refresh integrations list to get the newly created integration
        if (onRefresh) {
          await onRefresh();
        }

        // Auto-populate form with the created account details
        setSelectedProvider('CHATWOOT');
        setConfiguration({
          baseUrl: 'https://chatvoxe.mcp4.ai',
          accountId: result.account_id,
          ...(result.api_token && { apiKey: result.api_token }), // Auto-populate API token if retrieved
          provider: 'CHATWOOT',
        });

        // The integration is already saved by the backend, so we don't need to call onSave()
        // Show success message with detailed instructions if API token was not retrieved
        if (result.api_token) {
          setProvisioningSuccess(result.message || `✅ Your chatvoxe Helpdesk has been created and configured successfully with ${result.tier || 'your'} tier limits. Your API token has been automatically retrieved and saved.`);
          // Close modal after a short delay since everything is set up
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          // Show detailed instructions for getting the API token
          const instructionsMessage = result.message || `✅ Your chatvoxe Helpdesk has been created successfully with ${result.tier || 'your'} tier limits.\n\n📧 Next Steps:\n1. Check your email for the Chatwoot invitation\n2. Click the invitation link and set your password\n3. Log in to your admin account\n4. Go to Profile Settings → Access Token\n5. Copy your API token and paste it below`;
          setProvisioningSuccess(instructionsMessage);
          // Don't close modal - let user enter API token manually
          // Note: After refresh, the existingIntegration should be set by the parent component
        }
      }
    } catch (err) {
      setProvisioningError(err instanceof Error ? err.message : 'Failed to create chatvoxe Helpdesk');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Automatically set integration name to the provider name
      // For existing integrations, keep the existing name; for new ones, use provider name
      const integrationName = existingIntegration?.name || providerInfo.name;
      
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
            {existingIntegration ? 'Edit' : 'Add'} Helpdesk Setup
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
          {/* Create Voxe Helpdesk Button */}
          {!existingIntegration && !hasChatvoxeIntegration && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Create chatvoxe Helpdesk
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically provision a hosted Chatwoot workspace on chatvoxe
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateVoxeHelpdesk}
                disabled={isProvisioning || isSaving}
                className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 font-medium flex items-center justify-center gap-2"
              >
                {isProvisioning ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Setting up your chatvoxe Helpdesk... please wait.</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>Create chatvoxe Helpdesk</span>
                  </>
                )}
              </button>
              {provisioningSuccess && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="text-green-700 dark:text-green-400 text-sm whitespace-pre-line">
                    {provisioningSuccess.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < provisioningSuccess.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              {provisioningError && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-700 dark:text-red-400 text-sm">{provisioningError}</p>
                </div>
              )}
            </div>
          )}

          {/* Helpdesk Provider Selection */}
          {!existingIntegration && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Helpdesk Provider <span className="text-red-500">*</span>
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
                    disabled={isSaving || isProvisioning}
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
                disabled={isSaving || isProvisioning}
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
            disabled={isTesting || isSaving || isProvisioning || !['CHATWOOT', 'CUSTOM'].includes(selectedProvider)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 min-h-[48px]"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isProvisioning}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isProvisioning || !['CHATWOOT', 'CUSTOM'].includes(selectedProvider)}
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

