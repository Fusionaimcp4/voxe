"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Component that handles search params
function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const uidParam = searchParams.get('uid');
    if (tokenParam && uidParam) {
      setToken(tokenParam);
      setUserId(uidParam);
    } else {
      setError("Invalid or missing password reset link parameters.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (!token || !userId) {
      setError("Invalid reset request. Please use the link from your email.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setMessage(data.message || "Password reset successfully. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
      // Optionally redirect to sign-in after a short delay
      setTimeout(() => {
        router.push("/auth/signin?message=Password reset successfully. Please sign in with your new password.");
      }, 3000);

    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
        <p className="text-zinc-400">Enter and confirm your new password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            New Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500"
            placeholder="Confirm new password"
          />
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !token || !userId}
          className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Resetting password...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-zinc-400">
          <Link
            href="/auth/signin"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
        <p className="text-zinc-400">Loading...</p>
      </div>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded mb-2"></div>
          <div className="h-12 bg-zinc-800 rounded-2xl"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded mb-2"></div>
          <div className="h-12 bg-zinc-800 rounded-2xl"></div>
        </div>
        <div className="h-12 bg-zinc-800 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  );
}

// Main page component
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={<ResetPasswordLoading />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
