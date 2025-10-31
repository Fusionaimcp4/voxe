"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const searchParams = useSearchParams();
  
  // Get message and error from URL parameters
  const message = searchParams.get('message');
  const error = searchParams.get('error');
  
  // Set initial tab based on message type
  React.useEffect(() => {
    if (message && message.includes('Registration successful')) {
      setActiveTab('signin');
    }
  }, [message]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] mx-4 p-0 bg-zinc-900 border border-zinc-800">
        <DialogTitle asChild>
          <VisuallyHidden>Authentication</VisuallyHidden>
        </DialogTitle>
        
        <div className="relative overflow-hidden rounded-lg">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5" />
          
          <div className="relative p-4 sm:p-6 pt-6 sm:pt-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <Image
                  src="/logos/boxlogo512x512.png"
                  alt="Voxe Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-2xl font-semibold text-zinc-100">
                  Voxe
                </span>
              </div>
            </div>

            {/* Success/Error Messages */}
            {(message || error) && (
              <div className="mb-6">
                {message && (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert className="border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Tabs
              defaultValue={defaultTab}
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-zinc-800/50">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="signin" className="mt-0">
                    <SignInForm onSuccess={onClose} />
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <SignUpForm onSuccess={onClose} />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}