"use client";

import React from "react";
import { getCRMFormFields } from "@/lib/integrations/crm-providers";

interface ChatwootConfigFormProps {
  configuration: any;
  onChange: (config: any) => void;
  disabled?: boolean;
}

export function ChatwootConfigForm({ configuration, onChange, disabled }: ChatwootConfigFormProps) {
  const formFields = getCRMFormFields('CHATWOOT');

  const handleFieldChange = (fieldName: string, value: any) => {
    const keys = fieldName.split('.');
    const newConfig = { ...configuration };
    
    // Navigate to nested field
    let obj: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    obj[lastKey] = value;
    
    onChange(newConfig);
  };

  const getFieldValue = (fieldName: string) => {
    const keys = fieldName.split('.');
    let value: any = configuration;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  return (
    <div className="space-y-5">
      {formFields.map((field) => {
        const value = getFieldValue(field.name) ?? field.defaultValue ?? '';

        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {field.label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  disabled={disabled}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{field.helpText}</span>
              </label>
            ) : field.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 h-32 resize-none"
              />
            ) : (
              <input
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
              />
            )}

            {field.helpText && field.type !== 'checkbox' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{field.helpText}</p>
            )}
          </div>
        );
      })}

      {/* Additional Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
        <p className="text-blue-700 dark:text-blue-400 text-sm mb-2 font-medium">
          ℹ️ How to get your Chatwoot credentials:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li><strong>Base URL:</strong> Your Chatwoot installation URL (e.g., https://app.chatwoot.com)</li>
          <li><strong>Account ID:</strong> Found in Settings → Account → Account Details</li>
          <li><strong>API Token:</strong> Go to Profile Settings → Access Token → Copy Token</li>
        </ul>
        <a
          href="https://www.chatwoot.com/docs/product/channels/api/client-apis"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs mt-2 inline-block"
        >
          View Chatwoot API Documentation →
        </a>
      </div>
    </div>
  );
}

