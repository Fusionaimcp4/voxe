"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/sign-in-form";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Loading fallback component
function SignUpLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 sm:p-8 text-center">
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

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5" />
          
          <div className="relative p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8">
            {/* Logo */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/logos/boxlogo512x512.png"
                  alt="Voxe Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-2xl sm:text-3xl font-semibold text-zinc-100">
                  Voxe
                </span>
              </Link>
            </div>

            {/* Success/Error Messages */}
            {(message || error) && (
              <div className="mb-6">
                {message && (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400 text-sm">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert className="border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-zinc-800/50 h-12 sm:h-14">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 text-sm sm:text-base min-h-[44px]"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 text-sm sm:text-base min-h-[44px]"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <SignInForm onSuccess={() => router.push('/dashboard')} />
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <SignUpForm onSuccess={() => router.push('/auth/signin')} />
              </TabsContent>
            </Tabs>

            {/* Back to Home Link */}
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpPageContent />
    </Suspense>
  );
}