"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { X, MessageSquare, Database, Edit3, Save, RotateCcw } from "lucide-react";
import { notifications } from "@/lib/notifications";

interface SystemMessage {
  id: string;
  demoId: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  demo: {
    businessName: string;
    slug: string;
  };
}

export default function SystemMessagesPage() {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSystemMessages();
  }, []);

  const fetchSystemMessages = async () => {
    try {
      const response = await fetch('/api/dashboard/system-messages');
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch system messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: SystemMessage) => {
    setSelectedMessage(message);
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setSelectedMessage(null);
    setIsEditing(false);
    setEditContent('');
  };

  const handleEditMessage = () => {
    setIsEditing(true);
  };

  const handleSaveMessage = async () => {
    if (!selectedMessage) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/system-messages/${selectedMessage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          content: editContent
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the message in the local state
        setMessages(prev => prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { ...msg, content: editContent, version: msg.version + 1, updatedAt: new Date().toISOString() }
            : msg
        ));
        
        // Update the selected message
        setSelectedMessage(prev => prev ? { ...prev, content: editContent, version: prev.version + 1, updatedAt: new Date().toISOString() } : null);
        
        setIsEditing(false);
        notifications.success('System message updated successfully!');
      } else {
        notifications.error(`Failed to update: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save message:', error);
      notifications.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(selectedMessage?.content || '');
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
        </div>
        
        {/* Messages Skeleton */}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            System Messages
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage your AI system message templates
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center min-h-[48px] flex items-center justify-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-4"
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{message.demo.businessName}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Version {message.version}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    message.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {message.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleViewMessage(message)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    View Content
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Created: {new Date(message.createdAt).toLocaleDateString()} • 
                Updated: {new Date(message.updatedAt).toLocaleDateString()}
              </div>
              
              <div className="text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {message.content.substring(0, 200)}...
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">No System Messages</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You haven't created any demos yet. System messages are generated automatically when you create demos.
            </p>
            <Link
              href="/dashboard/userdemo"
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
            >
              <MessageSquare className="w-5 h-5" />
              Create Your First Demo
            </Link>
          </div>
        )}
      </motion.div>

      {/* Modal for viewing/editing message content */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedMessage.demo.businessName}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Version {selectedMessage.version}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {!isEditing ? (
                  <button
                    onClick={handleEditMessage}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Message
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveMessage}
                      disabled={saving}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[70vh] min-h-[500px] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Enter system message content..."
                />
              ) : (
                <div className="w-full h-[70vh] min-h-[500px] overflow-y-auto">
                  <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedMessage.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
