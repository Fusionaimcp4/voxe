"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function AdminSecurityPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupMessage, setSetupMessage] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);

  const [verificationCode, setVerificationCode] = useState("");
  const [isLoadingVerify, setIsLoadingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");

  const [isLoadingDisable, setIsLoadingDisable] = useState(false);
  const [disableError, setDisableError] = useState("");
  const [disableMessage, setDisableMessage] = useState("");
  const [disableCode, setDisableCode] = useState("");

  // Redirect if not authenticated or not admin/super_admin
  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      router.push("/dashboard?error=Access Denied"); // Redirect to dashboard or login
    }
  }, [session, status, router]);

  const handleSetup2FA = async () => {
    setIsLoadingSetup(true);
    setSetupError("");
    setSetupMessage("");
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate 2FA setup");
      }
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setTotpSecret(data.secret);
      setSetupMessage("Scan the QR code with your authenticator app and enter the code below to enable 2FA.");
    } catch (err: any) {
      setSetupError(err.message || "An error occurred during 2FA setup.");
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingVerify(true);
    setVerifyError("");
    setVerifyMessage("");

    if (!totpSecret) {
      setVerifyError("2FA setup not initiated. Please generate a QR code first.");
      setIsLoadingVerify(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret: totpSecret, code: verificationCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enable 2FA");
      }
      setVerifyMessage(data.message || "2FA enabled successfully!");
      setQrCodeDataUrl(null);
      setTotpSecret(null);
      setVerificationCode("");
      await update(); // Update session to reflect 2FA enabled
    } catch (err: any) {
      setVerifyError(err.message || "An error occurred while enabling 2FA.");
    } finally {
      setIsLoadingVerify(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDisable(true);
    setDisableError("");
    setDisableMessage("");

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disable 2FA");
      }
      setDisableMessage(data.message || "2FA disabled successfully!");
      setDisableCode("");
      await update(); // Update session to reflect 2FA disabled
    } catch (err: any) {
      setDisableError(err.message || "An error occurred while disabling 2FA.");
    } finally {
      setIsLoadingDisable(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="w-full max-w-md bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 text-center">
          <p className="text-zinc-400">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  if (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN') {
    return null; // Should be redirected by middleware, but fallback
  }

  const is2FAEnabled = !!session.user?.totpSecret;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Security Settings</h1>
          <p className="text-xl text-zinc-400">Manage Two-Factor Authentication for your account.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-8"
        >
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
            <h2 className="text-2xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
            <p className="text-zinc-400 mb-6">
              {is2FAEnabled ? (
                "2FA is currently ENABLED. You will be required to enter a code from your authenticator app when logging in."
              ) : (
                "2FA is currently DISABLED. Enable it for enhanced account security."
              )}
            </p>

            {!is2FAEnabled && (
              <div className="space-y-4">
                <button
                  onClick={handleSetup2FA}
                  disabled={isLoadingSetup}
                  className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSetup ? "Generating Setup..." : "Setup 2FA"}
                </button>
                {setupError && <p className="text-red-400 text-sm mt-2">{setupError}</p>}

                {qrCodeDataUrl && totpSecret && (
                  <div className="bg-zinc-800/50 rounded-2xl p-6 mt-6 border border-zinc-700">
                    <h3 className="text-xl font-semibold mb-3">Scan QR Code</h3>
                    <p className="text-zinc-400 mb-4">Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy). Then, enter the 6-digit code below to enable 2FA.</p>
                    <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                      <Image src={qrCodeDataUrl} alt="2FA QR Code" width={200} height={200} />
                    </div>
                    <p className="text-zinc-400 text-center font-mono break-all mb-4">Secret: {totpSecret}</p>

                    <form onSubmit={handleEnable2FA} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-2">Verification Code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 text-center text-xl tracking-widest"
                          placeholder="------"
                          maxLength={6}
                        />
                      </div>
                      {verifyError && <p className="text-red-400 text-sm mt-2">{verifyError}</p>}
                      {verifyMessage && <p className="text-green-400 text-sm mt-2">{verifyMessage}</p>}
                      <button
                        type="submit"
                        disabled={isLoadingVerify || verificationCode.length !== 6}
                        className="px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                      >
                        {isLoadingVerify ? "Enabling 2FA..." : "Enable 2FA"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {is2FAEnabled && (
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Disable 2FA</h3>
                <p className="text-zinc-400 mb-4">To disable 2FA, enter a current 6-digit code from your authenticator app and confirm.</p>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 text-center text-xl tracking-widest"
                    placeholder="------"
                    maxLength={6}
                  />
                </div>
                {disableError && <p className="text-red-400 text-sm mt-2">{disableError}</p>}
                {disableMessage && <p className="text-green-400 text-sm mt-2">{disableMessage}</p>}
                <button
                  type="submit"
                  disabled={isLoadingDisable || disableCode.length !== 6}
                  className="px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isLoadingDisable ? "Disabling 2FA..." : "Disable 2FA"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
