"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Save, X, AlertCircle } from "lucide-react";
import { notifications } from "@/lib/notifications";

interface EditableSectionProps {
  id: string;
  title: string;
  content: string;
  onChange: (id: string, content: string) => void;
  onSave?: (id: string, content: string) => Promise<boolean>;
  validation?: (content: string) => { valid: boolean; error?: string };
  characterLimit?: number;
}

export default function EditableSection({
  id,
  title,
  content: initialContent,
  onChange,
  onSave,
  validation,
  characterLimit,
}: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleEdit = () => {
    setIsEditing(true);
    setValidationError(null);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setIsEditing(false);
    setValidationError(null);
  };

  const handleSave = async () => {
    // Validate content
    if (validation) {
      const result = validation(content);
      if (!result.valid) {
        setValidationError(result.error || "Invalid content");
        return;
      }
    }

    // Check character limit
    if (characterLimit && content.length > characterLimit) {
      setValidationError(`Content exceeds ${characterLimit} characters`);
      return;
    }

    setValidationError(null);
    setSaving(true);

    try {
      if (onSave) {
        const success = await onSave(id, content);
        if (success) {
          setIsEditing(false);
          onChange(id, content);
          notifications.success(`${title} updated successfully`);
        } else {
          notifications.error(`Failed to update ${title}`);
        }
      } else {
        onChange(id, content);
        setIsEditing(false);
        notifications.success(`${title} updated successfully`);
      }
    } catch (error) {
      console.error("Error saving section:", error);
      notifications.error(`Failed to update ${title}`);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setValidationError(null);
    
    // Real-time validation
    if (validation) {
      const result = validation(newContent);
      if (!result.valid) {
        setValidationError(result.error || "Invalid content");
      }
    }
  };

  const characterCount = content.length;
  const isOverLimit = characterLimit ? characterCount > characterLimit : false;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !!validationError || isOverLimit}
              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full min-h-[200px] p-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder={`Enter ${title.toLowerCase()}...`}
            />
            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  {validationError}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {characterLimit && (
                  <span className={isOverLimit ? "text-red-600 dark:text-red-400" : ""}>
                    {characterCount} / {characterLimit} characters
                  </span>
                )}
                {!characterLimit && <span>{characterCount} characters</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {content || <span className="text-slate-400 italic">No content</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

