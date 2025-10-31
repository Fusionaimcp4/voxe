"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, CheckCircle, XCircle, DollarSign, Star, Crown, Zap } from 'lucide-react';

interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  isPopular: boolean;
  ctaText: string;
  ctaHref: string;
  stripeMonthlyPriceId?: string; // New: Stripe Price ID for monthly subscriptions
  stripeYearlyPriceId?: string;  // New: Stripe Price ID for yearly subscriptions
  annualDiscountPercentage?: number; // Add annualDiscountPercentage
}

const tierOrder: SubscriptionTier[] = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];

export default function AdminPricingPage() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPricingPlans(data); // Corrected: Directly use data as it's the array of plans
    } catch (err: any) {
      console.error('Failed to fetch pricing plans:', err);
      setError(err.message || 'Failed to fetch pricing plans');
      toast.error('Failed to fetch pricing plans', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (planId: string, field: keyof PricingPlan, value: any) => {
    setPricingPlans(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { ...plan, [field]: value }
          : plan
      )
    );
  };

  const handleFeatureChange = (planId: string, featureIndex: number, value: string) => {
    setPricingPlans(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { 
              ...plan, 
              features: plan.features.map((feature, index) => 
                index === featureIndex ? value : feature
              )
            }
          : plan
      )
    );
  };

  const addFeature = (planId: string) => {
    setPricingPlans(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { ...plan, features: [...plan.features, ''] }
          : plan
      )
    );
  };

  const removeFeature = (planId: string, featureIndex: number) => {
    setPricingPlans(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { 
              ...plan, 
              features: plan.features.filter((_, index) => index !== featureIndex)
            }
          : plan
      )
    );
  };

  const handleSave = async (planId: string) => {
    setSaving(true);
    setError(null);
    try {
      const plan = pricingPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const response = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          period: plan.period,
          description: plan.description,
          features: plan.features.filter(f => f.trim() !== ''),
          isPopular: plan.isPopular,
          ctaText: plan.ctaText,
          ctaHref: plan.ctaHref,
          stripeMonthlyPriceId: plan.stripeMonthlyPriceId, // Include new monthly ID
          stripeYearlyPriceId: plan.stripeYearlyPriceId,   // Include new yearly ID
          annualDiscountPercentage: plan.annualDiscountPercentage, // Include annualDiscountPercentage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      toast.success(`Pricing plan for ${plan.tier} updated successfully!`);
      await fetchPricingPlans(); // Re-fetch to ensure data is up to date
    } catch (err: any) {
      console.error(`Failed to save pricing plan:`, err);
      setError(err.message || `Failed to save pricing plan`);
      toast.error(`Failed to save pricing plan`, { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'STARTER':
        return <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'TEAM':
        return <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'BUSINESS':
        return <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'ENTERPRISE':
        return <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'STARTER':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'TEAM':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'BUSINESS':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'ENTERPRISE':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      default:
        return 'bg-emerald-50 dark:bg-emerald-900/20';
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Pricing Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tierOrder.map(tier => (
            <Card key={tier} className="animate-pulse">
              <CardHeader>
                <CardTitle className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="p-4 rounded-xl flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-800 dark:text-red-200">Error: {error}</span>
          <Button onClick={fetchPricingPlans} variant="outline" className="ml-auto">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-6 space-y-6 text-slate-900"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Pricing Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage pricing plans and features for all subscription tiers
          </p>
        </div>
        <Button onClick={fetchPricingPlans} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pricingPlans
          .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
          .map((plan) => (
            <Card key={plan.id} className="relative bg-white border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTierColor(plan.tier)}`}>
                    {getTierIcon(plan.tier)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-slate-900">{plan.name}</CardTitle>
                    <p className="text-sm text-slate-600">{plan.tier}</p>
                  </div>
                  {plan.isPopular && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full">
                      <Star className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Popular</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-name`} className="text-slate-900">Plan Name</Label>
                    <Input
                      id={`${plan.id}-name`}
                      value={plan.name}
                      onChange={(e) => handleInputChange(plan.id, 'name', e.target.value)}
                      placeholder="Plan name"
                      className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-price`} className="text-slate-900">Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id={`${plan.id}-price`}
                        type="number"
                        value={plan.price}
                        onChange={(e) => handleInputChange(plan.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="pl-10 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-currency`} className="text-slate-900">Currency</Label>
                    <Input
                      id={`${plan.id}-currency`}
                      value={plan.currency}
                      onChange={(e) => handleInputChange(plan.id, 'currency', e.target.value)}
                      placeholder="USD"
                      className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-period`} className="text-slate-900">Period</Label>
                    <Input
                      id={`${plan.id}-period`}
                      value={plan.period}
                      onChange={(e) => handleInputChange(plan.id, 'period', e.target.value)}
                      placeholder="month, year, forever, contact us"
                      className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-description`} className="text-slate-900">Description</Label>
                  <Textarea
                    id={`${plan.id}-description`}
                    value={plan.description}
                    onChange={(e) => handleInputChange(plan.id, 'description', e.target.value)}
                    placeholder="Plan description"
                    rows={2}
                    className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                  />
                </div>

                {/* CTA Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-ctaText`} className="text-slate-900">CTA Text</Label>
                    <Input
                      id={`${plan.id}-ctaText`}
                      value={plan.ctaText}
                      onChange={(e) => handleInputChange(plan.id, 'ctaText', e.target.value)}
                      placeholder="Get Started"
                      className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-ctaHref`} className="text-slate-900">CTA Link</Label>
                    <Input
                      id={`${plan.id}-ctaHref`}
                      value={plan.ctaHref}
                      onChange={(e) => handleInputChange(plan.id, 'ctaHref', e.target.value)}
                      placeholder="/dashboard/userdemo"
                      className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Stripe Price ID */}
                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-stripeMonthlyPriceId`} className="text-slate-900">Stripe Monthly Price ID</Label>
                  <Input
                    id={`${plan.id}-stripeMonthlyPriceId`}
                    value={plan.stripeMonthlyPriceId || ''}
                    onChange={(e) => handleInputChange(plan.id, 'stripeMonthlyPriceId', e.target.value)}
                    placeholder="Monthly price ID (e.g., price_month_123)"
                    className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-600">Use the monthly recurring Price ID from the plan's LIVE product.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-stripeYearlyPriceId`} className="text-slate-900">Stripe Yearly Price ID</Label>
                  <Input
                    id={`${plan.id}-stripeYearlyPriceId`}
                    value={plan.stripeYearlyPriceId || ''}
                    onChange={(e) => handleInputChange(plan.id, 'stripeYearlyPriceId', e.target.value)}
                    placeholder="Yearly price ID (e.g., price_year_123)"
                    className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-600">Use the yearly recurring Price ID from the plan's LIVE product.</p>
                </div>

                {/* Annual Discount Percentage */}
                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-annualDiscountPercentage`} className="text-slate-900">Annual Discount (%)</Label>
                  <Input
                    id={`${plan.id}-annualDiscountPercentage`}
                    type="number"
                    value={plan.annualDiscountPercentage ?? 0}
                    onChange={(e) => handleInputChange(plan.id, 'annualDiscountPercentage', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Popular Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${plan.id}-popular`} className="text-slate-900">Mark as Popular</Label>
                  <Switch
                    id={`${plan.id}-popular`}
                    checked={plan.isPopular}
                    onCheckedChange={(checked) => handleInputChange(plan.id, 'isPopular', checked)}
                  />
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-900">Features</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFeature(plan.id)}
                    >
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(plan.id, index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="flex-1 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(plan.id, index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSave(plan.id)}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Success Message */}
      {!error && pricingPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-emerald-800 dark:text-emerald-200">Pricing plans loaded successfully</span>
        </motion.div>
      )}
    </motion.div>
  );
}
