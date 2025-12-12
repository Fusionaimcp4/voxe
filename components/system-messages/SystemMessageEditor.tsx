"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, RefreshCw, X } from "lucide-react";
import ProtectedSection from "./ProtectedSection";
import EditableSection from "./EditableSection";
import { notifications } from "@/lib/notifications";

interface WorkflowFeatures {
  hasKnowledgeBase: boolean;
  hasCalendar: boolean;
}

interface SystemMessageData {
  id: string;
  demoId: string;
  features: WorkflowFeatures;
  protectedSections: Record<string, string | null>;
  editableSections: Record<string, string>;
  preview: string;
  version: number;
  updatedAt: string;
}

interface SystemMessageEditorProps {
  messageId: string;
  businessName: string;
  onClose: () => void;
}

export default function SystemMessageEditor({
  messageId,
  businessName,
  onClose,
}: SystemMessageEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [data, setData] = useState<SystemMessageData | null>(null);
  const [editableContent, setEditableContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMessageData();
  }, [messageId]);

  const fetchMessageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/system-messages/${messageId}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
        setEditableContent(result.editableSections || {});
      } else {
        notifications.error(result.error || "Failed to load system message");
      }
    } catch (error) {
      console.error("Error fetching system message:", error);
      notifications.error("Failed to load system message");
    } finally {
      setLoading(false);
    }
  };

  const handleEditableChange = (id: string, content: string) => {
    setEditableContent((prev) => ({
      ...prev,
      [id]: content,
    }));
  };

  const handleSaveAll = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/system-messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editableContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        notifications.success("System message updated successfully");
        // Refresh data to get updated preview
        await fetchMessageData();
      } else {
        notifications.error(result.error || "Failed to update system message");
      }
    } catch (error) {
      console.error("Error saving system message:", error);
      notifications.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const validateEditableSection = (content: string): { valid: boolean; error?: string } => {
    // Check for forbidden patterns
    const forbiddenPatterns = [
      { pattern: /```json\s*\{[\s\S]*"output"[\s\S]*\}/i, message: "Cannot include JSON output format rules" },
      { pattern: /calendar.*tool/i, message: "Cannot reference calendar tools" },
      { pattern: /knowledge.*base.*context.*tool/i, message: "Cannot reference knowledge base tools" },
      { pattern: /escalation.*rules/i, message: "Cannot modify escalation rules" },
      { pattern: /\[PROTECTED_START:/i, message: "Cannot inject protected section markers" },
      { pattern: /\[PROTECTED_END:/i, message: "Cannot inject protected section markers" },
      { pattern: /\[EDITABLE_START:/i, message: "Cannot inject editable section markers" },
      { pattern: /\[EDITABLE_END:/i, message: "Cannot inject editable section markers" },
    ];

    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(content)) {
        return { valid: false, error: message };
      }
    }

    return { valid: true };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
            <span className="text-slate-700 dark:text-slate-300">Loading system message...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8">
          <p className="text-slate-700 dark:text-slate-300">Failed to load system message</p>
        </div>
      </div>
    );
  }

  const hasChanges = JSON.stringify(editableContent) !== JSON.stringify(data.editableSections);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 pr-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {businessName} - System Message
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Version {data.version} • Last updated {new Date(data.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Preview
                </>
              )}
            </button>
            {hasChanges && (
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save All Changes"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Preview Mode */}
        {showPreview && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Preview (Full Generated Message)
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-[400px] overflow-y-auto">
              <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                {data.preview}
              </pre>
            </div>
          </div>
        )}

        {/* Features Status */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Enabled Features
          </h3>
          <div className="flex flex-wrap gap-3">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                data.features.hasKnowledgeBase
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              Knowledge Base: {data.features.hasKnowledgeBase ? "Enabled" : "Disabled"}
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                data.features.hasCalendar
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              Calendar: {data.features.hasCalendar ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        

        {/* Editable Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Editable Sections
          </h3>
          {Object.entries(editableContent).map(([id, content]) => {
            const sectionTitles: Record<string, string> = {
              business_knowledge: "Business Knowledge",
              voice_pov: "Voice & POV",
              faqs: "FAQs",
              custom_instructions: "Custom Instructions",
            };

            return (
              <EditableSection
                key={id}
                id={id}
                title={sectionTitles[id] || id}
                content={content}
                onChange={handleEditableChange}
                validation={validateEditableSection}
              />
            );
          })}
        </div>
        {/* Protected Sections */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Protected Sections
          </h3>
          {Object.entries(data.protectedSections).map(([id, content]) => {
            if (content === null) return null; // Skip disabled sections

            const sectionTitles: Record<string, string> = {
              core_role: "Core Role Instructions",
              kb_usage: "Knowledge Base Usage Guidelines",
              calendar_booking: "Calendar Booking",
              escalation_rules: "Escalation Rules",
              output_format: "Output Format",
            };

            return (
              <ProtectedSection
                key={id}
                id={id}
                title={sectionTitles[id] || id}
                content={content}
                visible={true}
                locked={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

