"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  Settings, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw,
  Link as LinkIcon, Plus, Edit2, Zap, X, Database
} from "lucide-react";
import { notifications } from "@/lib/notifications";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string | null;
  wordCount?: number | null;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

interface WorkflowLink {
  id: string;
  workflowId: string;
  priority: number;
  retrievalLimit: number;
  similarityThreshold: number;
  isActive: boolean;
  workflow: {
    id: string;
    n8nWorkflowId: string | null;
    status: string;
    demo: {
      businessName: string;
      slug: string;
    };
  };
}

interface Workflow {
  id: string;
  n8nWorkflowId: string | null;
  status: string;
  demo: {
    id: string;
    businessName: string;
    slug: string;
  };
}

interface KnowledgeBaseDetail {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
}

export default function KnowledgeBaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setResolvedParams(resolved);
      } catch (error) {
        console.error('Error resolving params:', error);
      }
    };
    resolveParams();
  }, [params]);
  const [kb, setKb] = useState<KnowledgeBaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [workflowLinks, setWorkflowLinks] = useState<WorkflowLink[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    workflowId: '',
    priority: 1,
    retrievalLimit: 5,
    similarityThreshold: 0.4,
  });

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchKB();
    }
  }, [resolvedParams?.id]);

  useEffect(() => {
    // Auto-refresh only while documents are processing
    if (!kb?.documents) return;
    
    const hasProcessingDocs = kb.documents.some(
      doc => doc.status === 'PENDING' || doc.status === 'PROCESSING'
    );
    
    if (!hasProcessingDocs) return;
    
    const interval = setInterval(() => {
      fetchKB();
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [kb?.documents]);

  const fetchKB = async () => {
    if (!resolvedParams?.id) return;
    
    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response:', await response.text());
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (data.knowledgeBase) {
        setKb(data.knowledgeBase);
        setSettingsForm({
          name: data.knowledgeBase.name,
          description: data.knowledgeBase.description || '',
          isActive: data.knowledgeBase.isActive,
        });
      }
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchKB();
      } else {
        const error = await response.json();
        notifications.error(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      notifications.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PROCESSING': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDeleteDocument = async (docId: string) => {
    const confirmed = await notifications.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingDocId(docId);
    try {
      const response = await fetch(`/api/dashboard/documents/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchKB();
      } else {
        const error = await response.json();
        notifications.error(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      notifications.error('Delete failed. Please try again.');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleReprocessDocument = async (docId: string) => {
    const confirmed = await notifications.confirm('Reprocess this document? This will regenerate chunks and embeddings.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/documents/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprocess' }),
      });

      if (response.ok) {
        notifications.success('Document reprocessing started');
        await fetchKB();
      } else {
        const error = await response.json();
        notifications.error(`Reprocess failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Reprocess failed:', error);
      notifications.error('Reprocess failed. Please try again.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      if (response.ok) {
        notifications.success('Settings saved successfully');
        setShowSettings(false);
        await fetchKB();
      } else {
        const error = await response.json();
        notifications.error(`Save failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Save settings failed:', error);
      notifications.error('Save failed. Please try again.');
    }
  };

  const handleDeleteKB = async () => {
    const confirmed = await notifications.confirm('Are you sure you want to delete this knowledge base? This will delete all documents and cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/dashboard/knowledge-bases';
      } else {
        const error = await response.json();
        notifications.error(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      notifications.error('Delete failed. Please try again.');
    }
  };

  // Workflow link management
  const fetchWorkflowLinks = async () => {
    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}/workflow-links`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowLinks(data.links || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflow links:', error);
    }
  };

  const fetchAvailableWorkflows = async () => {
    try {
      const response = await fetch('/api/dashboard/workflows');
      if (response.ok) {
        const data = await response.json();
        setAvailableWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const handleOpenLinkModal = () => {
    fetchAvailableWorkflows();
    setShowLinkModal(true);
  };

  const handleLinkWorkflow = async () => {
    if (!linkForm.workflowId) {
      notifications.warning('Please select a workflow');
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}/link-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkForm),
      });

      if (response.ok) {
        notifications.success('Workflow linked successfully!');
        setShowLinkModal(false);
        setLinkForm({
          workflowId: '',
          priority: 1,
          retrievalLimit: 5,
          similarityThreshold: 0.4,
        });
        await fetchWorkflowLinks();
      } else {
        const error = await response.json();
        notifications.error(`Link failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Link failed:', error);
      notifications.error('Link failed. Please try again.');
    }
  };

  const handleUnlinkWorkflow = async (workflowId: string) => {
    const confirmed = await notifications.confirm('Are you sure you want to unlink this workflow?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/dashboard/knowledge-bases/${resolvedParams?.id}/unlink-workflow?workflowId=${workflowId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        notifications.success('Workflow unlinked successfully!');
        await fetchWorkflowLinks();
      } else {
        const error = await response.json();
        notifications.error(`Unlink failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Unlink failed:', error);
      notifications.error('Unlink failed. Please try again.');
    }
  };

  const handleToggleLinkActive = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/knowledge-bases/${resolvedParams?.id}/workflow-links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, isActive: !isActive }),
      });

      if (response.ok) {
        await fetchWorkflowLinks();
      } else {
        const error = await response.json();
        notifications.error(`Update failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Update failed:', error);
      notifications.error('Update failed. Please try again.');
    }
  };

  // Fetch workflow links on mount
  useEffect(() => {
    if (kb) {
      fetchWorkflowLinks();
    }
  }, [kb]);

  if (!resolvedParams || loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 mb-4"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
            </div>
          ))}
        </div>
        
        {/* Upload Zone Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-12 mx-auto mb-4"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">Knowledge Base Not Found</h2>
          <Link href="/dashboard/knowledge-bases" className="text-emerald-500 hover:underline">
            ← Back to Knowledge Bases
          </Link>
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
        className="space-y-4"
      >
        <Link
          href="/dashboard/knowledge-bases"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Knowledge Bases
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{kb.name}</h1>
            {kb.description && (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{kb.description}</p>
            )}
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Documents</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{kb.totalDocuments}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Chunks</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{kb.totalChunks}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Tokens</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{(kb.totalTokens / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Status</p>
          <p className={`text-lg font-semibold ${kb.isActive ? 'text-green-500' : 'text-slate-500'}`}>
            {kb.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Upload Documents</h3>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            dragActive 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50'}`}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-emerald-500' : 'text-slate-500'}`} />
          <h4 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
            {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </h4>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Supported formats: PDF, DOCX, TXT, MD, CSV, JSON (max 10MB)
          </p>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md,.csv,.json"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-block cursor-pointer shadow-lg shadow-emerald-500/25 min-h-[48px] flex items-center justify-center"
          >
            Select File
          </label>
        </div>
      </motion.div>

      {/* Documents List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Documents ({kb.documents.length})</h3>
        
        {kb.documents.length > 0 ? (
          <div className="space-y-3">
            {kb.documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="w-8 h-8 text-emerald-500" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">{doc.originalName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">{doc.fileType.toUpperCase()}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc._count.chunks} chunks</span>
                        {doc.wordCount && (
                          <>
                            <span>•</span>
                            <span>{doc.wordCount.toLocaleString()} words</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">{doc.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(doc.status === 'COMPLETED' || doc.status === 'FAILED') && (
                        <button 
                          onClick={() => handleReprocessDocument(doc.id)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                          title="Reprocess document"
                        >
                          <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingDocId === doc.id}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group disabled:opacity-50"
                        title="Delete document"
                      >
                        <Trash2 className={`w-5 h-5 text-slate-400 group-hover:text-red-500 ${deletingDocId === doc.id ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
                {doc.processingError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    Error: {doc.processingError}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No documents yet. Upload your first document to get started.</p>
          </div>
        )}
      </motion.div>

      {/* Workflow Assignment Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Linked Workflows ({workflowLinks.length})</h3>
          <button
            onClick={handleOpenLinkModal}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            Link Workflow
          </button>
        </div>

        {workflowLinks.length > 0 ? (
          <div className="space-y-3">
            {workflowLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${link.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">{link.workflow.demo.businessName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Priority: {link.priority}
                        </span>
                        <span>•</span>
                        <span>Limit: {link.retrievalLimit} chunks</span>
                        <span>•</span>
                        <span>Threshold: {link.similarityThreshold}</span>
                        {link.workflow.n8nWorkflowId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">{link.workflow.n8nWorkflowId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLinkActive(link.id, link.isActive)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        link.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {link.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleUnlinkWorkflow(link.workflowId)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                      title="Unlink workflow"
                    >
                      <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <LinkIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">No workflows linked yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Link this knowledge base to a workflow to make it available for RAG.</p>
          </div>
        )}
      </motion.div>

      {/* Link Workflow Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Link Workflow</h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Workflow Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Select Workflow</label>
                <select
                  value={linkForm.workflowId}
                  onChange={(e) => setLinkForm({ ...linkForm, workflowId: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                >
                  <option value="">Choose a workflow...</option>
                  {availableWorkflows
                    .filter(wf => !workflowLinks.some(link => link.workflowId === wf.id))
                    .map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.demo.businessName} {workflow.n8nWorkflowId ? `(workflow: ${workflow.n8nWorkflowId})` : ''}
                      </option>
                    ))
                  }
                </select>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {availableWorkflows.length === 0 ? 'No workflows available' : `${availableWorkflows.filter(wf => !workflowLinks.some(link => link.workflowId === wf.id)).length} workflows available`}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Priority
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">(lower = higher priority)</span>
                </label>
                <input
                  type="number"
                  value={linkForm.priority}
                  onChange={(e) => setLinkForm({ ...linkForm, priority: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Retrieval Limit */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Retrieval Limit
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">(max chunks to return)</span>
                </label>
                <input
                  type="number"
                  value={linkForm.retrievalLimit}
                  onChange={(e) => setLinkForm({ ...linkForm, retrievalLimit: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Similarity Threshold */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Similarity Threshold
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">(0.3 = loose, 0.7 = strict)</span>
                </label>
                <input
                  type="number"
                  value={linkForm.similarityThreshold}
                  onChange={(e) => setLinkForm({ ...linkForm, similarityThreshold: parseFloat(e.target.value) || 0.4 })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Loose (more results)</span>
                  <span>Strict (fewer, more relevant)</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">About these settings:</p>
                    <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                      <li>• <strong>Priority:</strong> When multiple KBs are linked, lower numbers are searched first</li>
                      <li>• <strong>Limit:</strong> Maximum number of relevant chunks to return to the AI</li>
                      <li>• <strong>Threshold:</strong> Minimum similarity score (0.4-0.5 recommended)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full sm:flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkWorkflow}
                disabled={!linkForm.workflowId}
                className="w-full sm:flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 min-h-[48px]"
              >
                Link Workflow
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Knowledge Base Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                  placeholder="My Knowledge Base"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors resize-none text-slate-900 dark:text-slate-100"
                  placeholder="Describe this knowledge base..."
                  rows={3}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Active Status</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Enable or disable this knowledge base</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settingsForm.isActive}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Stats (Read-only) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Documents</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kb?.totalDocuments || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Chunks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kb?.totalChunks || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tokens</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{((kb?.totalTokens || 0) / 1000).toFixed(1)}K</p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold mb-3 text-red-500">Danger Zone</h3>
                <button
                  onClick={handleDeleteKB}
                  className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-h-[48px]"
                >
                  Delete Knowledge Base
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full sm:flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="w-full sm:flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 min-h-[48px]"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

