"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Save, 
  Eye, 
  History, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Code,
  Settings,
  Clock,
  User,
  GitBranch,
  Download,
  Upload,
  Lock,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { validateTemplateStructure, testTemplateCustomization, extractSectionContent, replaceSectionContent } from '@/lib/template-validation';
import { parseTemplateSections, type SystemMessageSection } from '@/lib/system-message-sections';

interface SystemMessageVersion {
  id: string;
  version: number;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
  changeLog?: string;
}

interface SystemMessageTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  isActive: boolean;
  versions: SystemMessageVersion[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminSystemMessagesPage() {
  const [template, setTemplate] = useState<SystemMessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history'>('edit');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [changeLog, setChangeLog] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSectionType, setSelectedSectionType] = useState<'PROTECTED' | 'EDITABLE'>('PROTECTED');
  const [sectionContent, setSectionContent] = useState('');
  const [validationResults, setValidationResults] = useState<any>(null);
  const [parsedSections, setParsedSections] = useState<SystemMessageSection[]>([]);

  useEffect(() => {
    fetchSystemMessageTemplate();
  }, []);

  const fetchSystemMessageTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/system-messages');
      const data = await response.json();
      
      if (response.ok) {
        setTemplate(data.template);
        setDraftContent(data.template.content);
        // Parse sections from template
        const sections = parseTemplateSections(data.template.content);
        setParsedSections(sections);
      } else {
        setError(data.error || 'Failed to fetch system message template');
        toast.error('Failed to fetch system message template', { description: data.error });
      }
    } catch (error) {
      setError('Failed to fetch system message template');
      toast.error('Failed to fetch system message template');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setDraftContent(value);
    setHasUnsavedChanges(value !== template?.content);
    
    // Re-parse sections when content changes
    const sections = parseTemplateSections(value);
    setParsedSections(sections);
    
    // Validate template structure
    const validation = validateTemplateStructure(value);
    setValidationResults(validation);
  };

  const handleValidateTemplate = () => {
    if (!draftContent) return;
    
    const validation = validateTemplateStructure(draftContent);
    const testResults = testTemplateCustomization(draftContent);
    
    // Debug logging
    console.log('Validation results:', validation);
    console.log('Test results:', testResults);
    console.log('Test results keys:', Object.keys(testResults));
    console.log('Test results values:', Object.values(testResults));
    
    setValidationResults({
      ...validation,
      testResults
    });
    
    // Debug the final validation results
    console.log('Final validation results:', {
      ...validation,
      testResults
    });
    
    if (validation.isValid && testResults.success) {
      toast.success('Template validation passed');
    } else {
      toast.error('Template validation failed', {
        description: validation.missingSections.length > 0 
          ? `Missing sections: ${validation.missingSections.join(', ')}`
          : `Test errors: ${testResults.errors.join(', ')}`
      });
    }
  };

  const handleEditSection = (sectionId: string, sectionType: 'PROTECTED' | 'EDITABLE') => {
    if (!draftContent) return;
    
    // Find the section by ID
    const section = parsedSections.find(s => s.id === sectionId && s.type === sectionType);
    
    if (!section) {
      toast.error(`Section "${sectionId}" not found in template`);
      return;
    }
    
    // Map section IDs to display titles
    const sectionTitles: Record<string, string> = {
      core_role: 'Core Role Instructions',
      kb_usage: 'Knowledge Base Usage Guidelines',
      calendar_booking: 'Calendar Booking',
      information_received: 'Information You Receive',
      escalation_rules: 'Escalation Rules',
      output_format: 'Output Format',
      voice_pov: 'Voice & POV',
      business_knowledge: 'Business Knowledge',
    };
    
    setSelectedSection(sectionTitles[sectionId] || sectionId);
    setSelectedSectionId(sectionId);
    setSelectedSectionType(sectionType);
    setSectionContent(section.content);
    setShowSectionEditor(true);
  };

  const handleSaveSection = () => {
    if (!draftContent || !selectedSectionId) return;
    
    try {
      // Replace the section content in the template
      // Find the section markers and replace the content between them
      const startMarker = `[${selectedSectionType}_START:${selectedSectionId}]`;
      const endMarker = `[${selectedSectionType}_END:${selectedSectionId}]`;
      
      // Escape special regex characters in markers
      const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match the entire section including markers
      const regex = new RegExp(
        `${escapedStart}[\\s\\S]*?${escapedEnd}`,
        'g'
      );
      
      // Check if section exists
      if (!regex.test(draftContent)) {
        toast.error(`Section "${selectedSection}" not found in template`);
        return;
      }
      
      // Replace with new content (preserve markers, update content)
      const updatedContent = draftContent.replace(
        regex,
        `${startMarker}\n${sectionContent.trim()}\n${endMarker}`
      );
      
      setDraftContent(updatedContent);
      setHasUnsavedChanges(true);
      
      // Re-parse sections to update the UI
      const sections = parseTemplateSections(updatedContent);
      setParsedSections(sections);
      
      // Reset section editor state
      setShowSectionEditor(false);
      setSelectedSection('');
      setSelectedSectionId('');
      setSelectedSectionType('PROTECTED');
      setSectionContent('');
      
      toast.success(`Section "${selectedSection}" updated successfully`);
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(`Failed to update section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveDraft = async () => {
    if (!template) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: draftContent,
          changeLog: 'Draft saved'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Draft saved successfully');
        setHasUnsavedChanges(false);
        await fetchSystemMessageTemplate(); // Refresh to get updated version
      } else {
        toast.error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!template) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-messages/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: draftContent,
          changeLog: changeLog || 'Published new version'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('System message template published successfully');
        setHasUnsavedChanges(false);
        setShowPublishDialog(false);
        setChangeLog('');
        await fetchSystemMessageTemplate();
      } else {
        toast.error(data.error || 'Failed to publish template');
      }
    } catch (error) {
      toast.error('Failed to publish template');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/system-messages/rollback/${versionId}`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Rolled back to previous version');
        await fetchSystemMessageTemplate();
      } else {
        toast.error(data.error || 'Failed to rollback');
      }
    } catch (error) {
      toast.error('Failed to rollback');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPreview = () => {
    if (!draftContent) return <div className="text-slate-500">No content to preview</div>;
    
    // Simple markdown rendering for preview
    const html = draftContent
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-slate-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6 text-slate-900">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4 text-slate-900">$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong class="text-slate-900">$1</strong>')
      .replace(/^\*(.*)\*/gim, '<em class="text-slate-900">$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-900">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-900">$2</li>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-100 p-4 rounded-md overflow-x-auto"><code class="text-slate-900">$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 px-1 rounded text-slate-900">$1</code>')
      .replace(/\n/g, '<br>');

    return (
      <div 
        className="prose max-w-none text-slate-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading system message template...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchSystemMessageTemplate} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">System Message Editor</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage the master AI system message template used for demo creation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchSystemMessageTemplate} variant="outline" disabled={loading} className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleValidateTemplate}
            variant="outline"
            className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button 
            onClick={handleSaveDraft} 
            disabled={saving || !hasUnsavedChanges}
            variant="outline"
            className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => setShowPublishDialog(true)} 
            disabled={saving || !hasUnsavedChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Version</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  v{template?.versions?.find(v => v.isPublished)?.version || 'N/A'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Versions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {template?.versions?.length || 0}
                </p>
              </div>
              <History className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Published</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {template?.versions?.find(v => v.isPublished)?.publishedAt 
                    ? formatDate(template.versions.find(v => v.isPublished)!.publishedAt!)
                    : 'Never'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
                <Badge className={template?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {template?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${validationResults.isValid ? 'text-green-600' : 'text-red-600'}`} />
              Template Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationResults.missingSections.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Missing Critical Sections:</h4>
                  <ul className="list-disc list-inside text-red-700">
                    {validationResults.missingSections.map((section: string) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResults.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="list-disc list-inside text-yellow-700">
                    {validationResults.warnings.map((warning: string) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.testResults && (
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-3 rounded-lg ${validationResults.testResults.testResults?.kbMerge ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${validationResults.testResults.testResults?.kbMerge ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${validationResults.testResults.testResults?.kbMerge ? 'text-green-800' : 'text-red-800'}`}>
                        KB Merge
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${validationResults.testResults.testResults?.urlInjection ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${validationResults.testResults.testResults?.urlInjection ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${validationResults.testResults.testResults?.urlInjection ? 'text-green-800' : 'text-red-800'}`}>
                        URL Injection
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${validationResults.testResults.testResults?.variableReplacement ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${validationResults.testResults.testResults?.variableReplacement ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${validationResults.testResults.testResults?.variableReplacement ? 'text-green-800' : 'text-red-800'}`}>
                        Variables
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Editor - Organized by Protected and Editable */}
      <Card className="bg-white border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100">Section Editor</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Edit individual sections. All sections are editable by admin.
              </p>
            </div>
            {parsedSections.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700">
                {parsedSections.filter(s => s.type === 'PROTECTED').length} Protected • {parsedSections.filter(s => s.type === 'EDITABLE').length} Editable
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Protected Sections */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              Protected Sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {parsedSections
                .filter(s => s.type === 'PROTECTED')
                .map((section) => {
                  const sectionTitles: Record<string, string> = {
                    core_role: 'Core Role Instructions',
                    kb_usage: 'Knowledge Base Usage Guidelines',
                    calendar_booking: 'Calendar Booking',
                    information_received: 'Information You Receive',
                    escalation_rules: 'Escalation Rules',
                    output_format: 'Output Format',
                  };
                  
                  return (
                    <Button
                      key={section.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSection(section.id, 'PROTECTED')}
                      className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50 text-xs px-3 py-2 h-auto justify-start"
                    >
                      <Settings className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-left truncate">
                        {sectionTitles[section.id] || section.id}
                      </span>
                    </Button>
                  );
                })}
            </div>
          </div>

          {/* Editable Sections */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-slate-500" />
              Editable Sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {parsedSections
                .filter(s => s.type === 'EDITABLE')
                .map((section) => {
                  const sectionTitles: Record<string, string> = {
                    voice_pov: 'Voice & POV',
                    business_knowledge: 'Business Knowledge',
                    faqs: 'FAQs',
                    custom_instructions: 'Custom Instructions',
                  };
                  
                  return (
                    <Button
                      key={section.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSection(section.id, 'EDITABLE')}
                      className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50 text-xs px-3 py-2 h-auto justify-start"
                    >
                      <Edit3 className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-left truncate">
                        {sectionTitles[section.id] || section.id}
                      </span>
                    </Button>
                  );
                })}
            </div>
          </div>

          {parsedSections.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No sections found. Template may not have section markers.</p>
              <p className="text-xs mt-1">Sections are marked with [PROTECTED_START:id] and [EDITABLE_START:id]</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Card className="bg-white border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">System Message Template</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 gap-1 p-1">
              <TabsTrigger value="edit" className="flex items-center gap-2 bg-white text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                <Code className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 bg-white text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 bg-white text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content" className="text-slate-700 dark:text-slate-300">
                    System Message Content
                  </Label>
                  <Textarea
                    id="content"
                    value={draftContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Enter the system message template content..."
                    className="min-h-[600px] font-mono text-sm bg-white text-slate-900 border-slate-300 focus:border-slate-400 placeholder:text-slate-500"
                  />
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">You have unsaved changes</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="border border-slate-200 rounded-lg p-6 min-h-[600px] bg-white">
                {renderPreview()}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                {template?.versions?.map((version) => (
                  <Card key={version.id} className="bg-white border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={version.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                                v{version.version}
                              </Badge>
                              {version.isPublished && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  Published
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {formatDate(version.createdAt)}
                            </p>
                            {version.changeLog && (
                              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                {version.changeLog}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!version.isPublished && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRollback(version.id)}
                              disabled={saving}
                              className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Rollback
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDraftContent(version.content);
                              setActiveTab('edit');
                            }}
                            className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Publish New Version
            </DialogTitle>
            <DialogDescription>
              Publishing will make this version the active template used for all new demo creations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="changeLog">Change Log</Label>
              <Textarea
                id="changeLog"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                placeholder="Describe what changed in this version..."
                className="bg-white text-slate-900 border-slate-300 focus:border-slate-400 placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
              disabled={saving}
              className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Publishing...' : 'Publish Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Editor Dialog */}
      <Dialog open={showSectionEditor} onOpenChange={setShowSectionEditor}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSectionType === 'PROTECTED' ? (
                <Lock className="h-5 w-5 text-slate-500" />
              ) : (
                <Edit3 className="h-5 w-5 text-slate-500" />
              )}
              Edit Section: {selectedSection}
              <Badge className={selectedSectionType === 'PROTECTED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                {selectedSectionType}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Edit the content of the {selectedSection} section. Changes will be applied to the draft.
              {selectedSectionType === 'PROTECTED' && (
                <span className="block mt-1 text-amber-600">
                  ⚠️ This is a protected section. Changes affect core AI functionality.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col">
              <Label htmlFor="sectionContent" className="mb-2">Section Content</Label>
              <Textarea
                id="sectionContent"
                value={sectionContent}
                onChange={(e) => setSectionContent(e.target.value)}
                placeholder="Enter section content..."
                className="flex-1 min-h-[400px] font-mono text-sm bg-white text-slate-900 border-slate-300 focus:border-slate-400 placeholder:text-slate-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                {sectionContent.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSectionEditor(false);
                setSelectedSection('');
                setSelectedSectionId('');
                setSectionContent('');
              }}
              className="bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSection}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
