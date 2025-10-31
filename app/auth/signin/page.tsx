"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";

// Component that handles search params
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    
    // Handle messages/errors here if needed
  }, [searchParams]);

  return (
    <AuthModal 
      isOpen={true} 
      onClose={() => router.push('/')} 
      defaultTab="signin" 
    />
  );
}

// Loading fallback component
function SignInLoading() {
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

// Main page component
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}