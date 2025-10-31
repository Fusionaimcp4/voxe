"use client";

import React from "react";
import { getCRMFormFields } from "@/lib/integrations/crm-providers";

interface CustomCRMConfigFormProps {
  configuration: any;
  onChange: (config: any) => void;
  disabled?: boolean;
}

export function CustomCRMConfigForm({ configuration, onChange, disabled }: CustomCRMConfigFormProps) {
  const formFields = getCRMFormFields('CUSTOM');

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...configuration,
      [fieldName]: value,
    });
  };

  return (
    <div className="space-y-5">
      {formFields.map((field) => {
        const value = configuration[field.name] ?? field.defaultValue ?? '';

        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              {field.label}
              {field.validation.required && <span className="text-red-400 ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={disabled}
                className="w-full rounded-2xl bg-zinc-800 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100"
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
                className="w-full rounded-2xl bg-zinc-800 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 h-32 resize-none font-mono text-sm"
              />
            ) : (
              <input
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                className="w-full rounded-2xl bg-zinc-800 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100"
              />
            )}

            {field.helpText && (
              <p className="text-xs text-zinc-500 mt-1">{field.helpText}</p>
            )}
          </div>
        );
      })}

      {/* Additional Information */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mt-6">
        <p className="text-blue-400 text-sm mb-2 font-medium">
          ℹ️ Custom CRM Integration Guide:
        </p>
        <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
          <li><strong>API Base URL:</strong> The root endpoint of your CRM's API</li>
          <li><strong>Auth Type:</strong> Choose how your API authenticates requests</li>
          <li><strong>Credentials:</strong> Enter auth details as JSON (e.g., {`{"api_key": "xxx"}`})</li>
        </ul>
        
        <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-300 font-medium mb-1">Example Credentials JSON:</p>
          <pre className="text-xs text-zinc-400 overflow-x-auto">
{`{
  "api_key": "your-api-key-here",
  "username": "your-username",
  "password": "your-password"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

