"use client";

import React, { useState } from "react";
import { Lock, ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProtectedSectionProps {
  id: string;
  title: string;
  content: string | null;
  visible?: boolean;
  locked?: boolean;
}

export default function ProtectedSection({
  id,
  title,
  content,
  visible = true,
  locked = true,
}: ProtectedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!visible || !content) {
    return null;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {locked && (
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg z-10">
              This section is protected to ensure AI functionality remains intact. 
              Core logic, tool usage, and formatting rules cannot be modified.
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {content}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

