"use client";

import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import { Suspense } from "react";

// Loading fallback component
function SignUpLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded mb-4"></div>
          <div className="h-4 bg-zinc-700 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-zinc-800 rounded-2xl"></div>
            <div className="h-12 bg-zinc-800 rounded-2xl"></div>
            <div className="h-12 bg-zinc-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();

  return (
    <Suspense fallback={<SignUpLoading />}>
      <AuthModal 
        isOpen={true} 
        onClose={() => router.push('/')} 
        defaultTab="signup" 
      />
    </Suspense>
  );
}