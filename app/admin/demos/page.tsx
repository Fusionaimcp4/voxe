"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Eye,
  Settings,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  User,
  Building,
  Zap,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Demo {
  id: string;
  slug: string;
  businessName: string;
  businessUrl: string;
  demoUrl: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    subscriptionTier: string;
  };
  workflows: Array<{
    id: string;
    status: string;
  }>;
}

export default function AdminDemosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      router.push('/dashboard?error=Access Denied');
      return;
    }

    fetchDemos();
  }, [session, status, router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDemos(demos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDemos(
        demos.filter(
          (demo) =>
            demo.businessName.toLowerCase().includes(query) ||
            demo.slug.toLowerCase().includes(query) ||
            demo.user.email.toLowerCase().includes(query) ||
            (demo.user.name && demo.user.name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, demos]);

  const fetchDemos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/demos');
      if (!response.ok) {
        throw new Error('Failed to fetch demos');
      }
      const data = await response.json();
      setDemos(data.demos || []);
      setFilteredDemos(data.demos || []);
    } catch (err) {
      console.error('Failed to fetch demos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load demos');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      STARTER: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      TEAM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      BUSINESS: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      ENTERPRISE: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900 dark:to-orange-900 dark:text-amber-300'
    };
    return colors[tier] || colors.FREE;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading demos...</p>
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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">All Demos</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage all platform demos and their configurations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDemos} variant="outline" disabled={loading}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Demos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{demos.length}</p>
              </div>
              <Zap className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Demos</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {demos.filter(d => d.workflows.some(w => w.status === 'ACTIVE')).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Filtered Results</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{filteredDemos.length}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Search className="h-5 w-5" />
            Search Demos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by business name, slug, or user email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Demos List */}
      {filteredDemos.length === 0 ? (
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              {searchQuery ? 'No demos found matching your search' : 'No demos found'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDemos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="bg-white border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                              {demo.businessName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                                {demo.slug}
                              </code>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getTierColor(demo.user.subscriptionTier)}>
                            {demo.user.subscriptionTier}
                          </Badge>
                          {demo.workflows.some(w => w.status === 'ACTIVE') && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{demo.user.name || 'No name'}</span>
                          <span className="text-slate-400">•</span>
                          <span>{demo.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(demo.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Building className="w-4 h-4" />
                          <a
                            href={demo.businessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                          >
                            {demo.businessUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Zap className="w-4 h-4" />
                          <span>{demo.workflows.length} workflow{demo.workflows.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[200px]">
                      <Link
                        href={demo.demoUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Demo
                      </Link>
                      <Link
                        href={`/admin/demos/${demo.slug}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

