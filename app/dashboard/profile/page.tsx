"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Lock, Shield, Info, Save, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { notifications } from '@/lib/notifications';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  has2FA: boolean;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    has2FA: boolean;
    secret?: string;
    qrCodeDataUrl?: string;
    otpauthUrl?: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  useEffect(() => {
    loadProfile();
    load2FAStatus();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/dashboard/profile');
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile(data.user);
      setName(data.user.name || '');
      setCompany(data.user.company || '');
      setAvatarUrl(data.user.avatarUrl || '');
    } catch (error) {
      notifications.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const load2FAStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/profile/2fa');
      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus(data);
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('profile');
    try {
      const response = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, avatarUrl: avatarUrl || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile({ ...profile!, ...data.user });
      await updateSession(); // Update session to reflect changes
      notifications.success('Profile updated successfully');
    } catch (error: any) {
      notifications.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      notifications.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      notifications.error('Password must be at least 8 characters');
      return;
    }

    setSaving('password');
    try {
      const response = await fetch('/api/dashboard/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      notifications.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      notifications.error(error.message || 'Failed to change password');
    } finally {
      setSaving(null);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFactorStatus?.secret) {
      // Load 2FA setup
      try {
        const response = await fetch('/api/dashboard/profile/2fa');
        if (response.ok) {
          const data = await response.json();
          setTwoFactorStatus(data);
          setShow2FASetup(true);
        }
      } catch (error) {
        notifications.error('Failed to load 2FA setup');
      }
      return;
    }

    // Verify and enable
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      notifications.error('Please enter a valid 6-digit code');
      return;
    }

    setSaving('2fa-enable');
    try {
      const response = await fetch('/api/dashboard/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          secret: twoFactorStatus.secret,
          code: twoFactorCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enable 2FA');
      }

      notifications.success('2FA enabled successfully');
      await updateSession(); // Update session
      await load2FAStatus();
      setShow2FASetup(false);
      setTwoFactorCode('');
    } catch (error: any) {
      notifications.error(error.message || 'Failed to enable 2FA');
    } finally {
      setSaving(null);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      notifications.error('Please enter a valid 6-digit code');
      return;
    }

    setSaving('2fa-disable');
    try {
      const response = await fetch('/api/dashboard/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          code: twoFactorCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable 2FA');
      }

      notifications.success('2FA disabled successfully');
      await updateSession(); // Update session
      await load2FAStatus();
      setTwoFactorCode('');
    } catch (error: any) {
      notifications.error(error.message || 'Failed to disable 2FA');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-6">
        <p className="text-red-600 dark:text-red-400">Failed to load profile</p>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Profile Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your account information and security settings
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                  placeholder="Your company name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter a URL to your profile picture
                </p>
                {avatarUrl && (
                  <div className="mt-2">
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving === 'profile'}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving === 'profile' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Change Password
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100 pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={saving === 'password' || !currentPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving === 'password' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Two-Factor Authentication */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              {twoFactorStatus?.has2FA ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Disabled</span>
                </div>
              )}
            </div>

            {twoFactorStatus?.has2FA ? (
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  2FA is currently enabled. Enter your 2FA code to disable it.
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100 text-center text-xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving === '2fa-disable' || twoFactorCode.length !== 6}
                  className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving === '2fa-disable' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Disable 2FA
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {show2FASetup && twoFactorStatus?.qrCodeDataUrl ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Scan this QR code with your authenticator app:
                        </p>
                        <div className="flex justify-center">
                          <img
                            src={twoFactorStatus.qrCodeDataUrl}
                            alt="2FA QR Code"
                            className="w-48 h-48 border-2 border-slate-300 dark:border-slate-600 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Or enter this secret manually:
                        </p>
                        <code className="block w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                          {twoFactorStatus.secret}
                        </code>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Enter verification code from your app
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100 text-center text-xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleEnable2FA}
                          disabled={saving === '2fa-enable' || twoFactorCode.length !== 6}
                          className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {saving === '2fa-enable' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enabling...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Enable 2FA
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShow2FASetup(false);
                            setTwoFactorCode('');
                            load2FAStatus();
                          }}
                          className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Protect your account with two-factor authentication. You'll need an authenticator app like Google Authenticator or Authy.
                    </p>
                    <button
                      onClick={handleEnable2FA}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Enable 2FA
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Account Info */}
        <div className="lg:col-span-1">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Account Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Subscription Tier
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {profile.subscriptionTier}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Account Status
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {profile.subscriptionStatus}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Email Verified
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {profile.isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Verified</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600 dark:text-red-400">Not Verified</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Member Since
                </label>
                <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>

              {profile.lastLoginAt && (
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Last Login
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {new Date(profile.lastLoginAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Role
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {profile.role}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

