'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, FileText, Lock } from 'lucide-react';

interface OnboardResponse {
  slug: string;
  business: string;
  url: string;
  system_message_file: string;
  demo_url: string;
  chatwoot: {
    inbox_id: number;
    website_token: string;
  };
  workflow_duplication?: 'success' | 'failed';
  agent_bot?: {
    id: number | string;
    access_token: string;
  };
  bot_setup_skipped?: boolean;
  reason?: string;
  suggested_steps?: string[];
  notes?: {
    chatwoot_bot: string;
    n8n_webhook: string;
    http_nodes_auth: string;
  };
  created_at: string;
}

export default function OnboardPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Main form state
  const [formData, setFormData] = useState({
    business_url: '',
    business_name: '',
    primary_color: '#0ea5e9',
    secondary_color: '#38bdf8',
    logo_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        business_url: formData.business_url,
        ...(formData.business_name && { business_name: formData.business_name }),
        ...(formData.primary_color && { primary_color: formData.primary_color }),
        ...(formData.secondary_color && { secondary_color: formData.secondary_color }),
        ...(formData.logo_url && { logo_url: formData.logo_url })
      };

      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin-authenticated', 'true');
        setLoginData({ username: '', password: '' });
      } else {
        const data = await response.json();
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin-authenticated');
    setResult(null);
    setError(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => handleLoginInputChange('username', e.target.value)}
                  placeholder="Enter username"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => handleLoginInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  required
                  className="mt-1"
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-4xl font-bold">Business Demo Onboarding</h1>
              <p className="text-muted-foreground text-lg">
                Create AI-powered demo customer support chatbot with your platform knowledge base.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Onboard New Business</CardTitle>
            <CardDescription>
              Generate a knowledge base from a website and create a demo landing page with Chatwoot integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="business_url">Business URL *</Label>
                  <Input
                    id="business_url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.business_url}
                    onChange={(e) => handleInputChange('business_url', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="business_name">Business Name (optional)</Label>
                  <Input
                    id="business_name"
                    placeholder="Auto-detected from URL"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">Logo URL (optional)</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Demo...
                  </>
                ) : (
                  'Create Business Demo'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Demo Created Successfully!</CardTitle>
              <CardDescription>
                Your business demo has been generated and is ready for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Business</Label>
                  <p className="font-mono">{result.business}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
                  <p className="font-mono">{result.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Chatwoot Inbox ID</Label>
                  <p className="font-mono">{result.chatwoot.inbox_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Website Token</Label>
                  <p className="font-mono text-xs">{result.chatwoot.website_token}</p>
                </div>
                {result.workflow_duplication && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">n8n Workflow Status</Label>
                    <p className="font-mono">{result.workflow_duplication === 'success' ? '✅ Duplication Triggered' : '❌ Duplication Failed'}</p>
                  </div>
                )}
                {result.agent_bot && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Agent Bot ID</Label>
                      <p className="font-mono">{result.agent_bot.id}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bot Access Token</Label>
                      <p className="font-mono text-xs break-all">{result.agent_bot.access_token}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Demo URL</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono flex-1">{result.demo_url}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/demo/${result.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Demo
                    </a>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Direct link: <a href={`/demo/${result.slug}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">/demo/{result.slug}</a>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">System Message File</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono flex-1">{result.system_message_file}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/system-message/n8n_System_Message_${result.business}`} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      View File
                    </a>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Direct link: <a href={`/system-message/n8n_System_Message_${result.business}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">/system-message/n8n_System_Message_{result.business}</a>
                </div>
              </div>

              {result.bot_setup_skipped && (
                <Alert>
                  <AlertDescription>
                    <strong>Bot Setup Skipped:</strong> {result.reason}
                    <br />
                    <strong>Manual Steps:</strong> {result.suggested_steps?.join(', ')}
                    {result.agent_bot && (
                      <div className="mt-2">
                        <strong>Note:</strong> Agent bot was created (ID: {result.agent_bot.id}) but assignment to inbox failed. 
                        You can manually assign it in the Chatwoot admin interface.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {result.notes && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-2 text-green-800">Automation Success:</h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Chatwoot Bot:</strong> {result.notes.chatwoot_bot}</p>
                    <p><strong>n8n Webhook:</strong> {result.notes.n8n_webhook}</p>
                    <p><strong>HTTP Authentication:</strong> {result.notes.http_nodes_auth}</p>
                  </div>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">This demo shows how an AI assistant can</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {result.workflow_duplication === 'success' ? (
                    <>
                      <li>✅ n8n workflow duplication request sent successfully</li>
                      <li>✅ System message and bot configuration triggered</li>
                      <li>✅ Webhook automation initiated for "{result.slug}"</li>
                      <li>✅ Chatwoot bot created and assigned to inbox</li>
                      <li>Test the demo URL to ensure the chat widget works end-to-end</li>
                    </>
                  ) : (
                    <>
                      <li>Provide consistent, accurate, and friendly support.</li>
                      <li>Reduce response times and improve customer satisfaction."</li>
                      <li>Scale with your team — available 24/7.</li>
                      <li>This demo shows how an AI assistant can</li>
                    </>
                  )}
                </ol>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Raw JSON Response:</strong>
                <pre className="mt-2 whitespace-pre-wrap font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
