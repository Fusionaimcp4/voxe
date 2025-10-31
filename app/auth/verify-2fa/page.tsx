"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Component that handles search params
function Verify2FAForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();

  const callbackUrl = searchParams.get('callbackUrl') || "/dashboard";

  useEffect(() => {
    if (session?.user?.id && !session?.user?.totpRequired) {
      // If user is already authenticated and 2FA is not required, redirect
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    if (!session?.user?.id) {
      setError("User session not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid 2FA code.");
      }

      setMessage(data.message || "2FA code verified successfully.");
      setCode("");
      // After successful 2FA verification, update the session to reflect that 2FA is no longer required
      await update(); // This will re-fetch session and trigger JWT/Session callbacks
      router.push(callbackUrl);

    } catch (err: any) {
      setError(err.message || "An error occurred during 2FA verification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 text-center">
        <p className="text-zinc-400">Loading session... or not authenticated.</p>
        <Link href="/auth/signin" className="text-emerald-400 hover:text-emerald-300 mt-4 block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-zinc-400">Please enter the 6-digit code from your authenticator app.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 text-center text-xl tracking-widest"
            placeholder="------"
            maxLength={6}
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
          disabled={isLoading || code.length !== 6}
          className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-zinc-400">
          Having trouble?{" "}
          <Link
            href="/auth/signin?error=Please try logging in again."
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function Verify2FALoading() {
  return (
    <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-zinc-400">Loading...</p>
      </div>
      <div className="space-y-6">
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
export default function Verify2FAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={<Verify2FALoading />}>
          <Verify2FAForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
