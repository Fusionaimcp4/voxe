"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Plus, 
  Users, 
  Shield, 
  ArrowLeft,
  Home,
  Workflow,
  Database,
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
  DollarSign
} from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if user has admin privileges based on their role
  const hasAdminRole = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const userNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      description: "Overview and stats"
    },
    {
      name: "Workflows",
      href: "/dashboard/workflows",
      icon: Workflow,
      description: "Manage AI workflows"
    },
    {
      name: "System Messages",
      href: "/dashboard/system-messages",
      icon: MessageSquare,
      description: "AI message templates"
    },
    {
      name: "Knowledge Bases",
      href: "/dashboard/knowledge-bases",
      icon: Database,
      description: "Document management"
    },
    {
      name: "Integrations",
      href: "/dashboard/integrations",
      icon: Settings,
      description: "External connections"
    },
    {
      name: "Usage",
      href: "/dashboard/usage",
      icon: DollarSign,
      description: "API usage and analytics"
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: DollarSign,
      description: "Plan, balance, transactions"
    }
  ];

  const adminNavItems = [
    {
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3,
      description: "System overview"
    },
    {
      name: "Create Demo",
      href: "/admin/onboard",
      icon: Plus,
      description: "Create new demo"
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: Users,
      description: "User management"
    },
    {
      name: "System Messages",
      href: "/admin/system-messages",
      icon: MessageSquare,
      description: "Global message templates"
    },
    {
      name: "Security Settings",
      href: "/admin/dashboard/security",
      icon: Shield,
      description: "2FA and security"
    },
    {
      name: "Tier Limits",
      href: "/admin/dashboard/tier-limits",
      icon: Settings,
      description: "Manage subscription limits"
    },
    {
      name: "Pricing Plans",
      href: "/admin/dashboard/pricing",
      icon: DollarSign,
      description: "Manage pricing and plans"
    }
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
          {/* Logo/Brand */}
          <div className="flex items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logos/boxlogo512x512.svg"
                  alt="Voxe Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isAdmin ? "Admin" : "Voxe"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAdmin ? "System Management" : "AI Support Platform"}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-emerald-500" : ""}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 text-emerald-500" />}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
            <Link
              href={isAdmin ? "/admin/onboard" : "/dashboard/userdemo"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isAdmin ? "Create Demo" : "New support chat"}
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isAdmin && hasAdminRole && (
                <Link
                  href="/admin/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  User
                </Link>
              )}
              <button
                onClick={() => {
                  // Handle sign out
                  window.location.href = "/api/auth/signout";
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {isAdmin ? "Admin" : "Dashboard"}
            </h1>
          </div>
          <Link
            href={isAdmin ? "/admin/onboard" : "/dashboard/userdemo"}
            className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mobileMenuOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className={`lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: mobileMenuOpen ? 0 : -300 }}
          exit={{ x: -300 }}
          className="w-80 sm:w-96 h-full bg-white dark:bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/logos/boxlogo512x512.svg"
                    alt="Voxe Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {isAdmin ? "Admin" : "Voxe"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin ? "System Management" : "AI Support Platform"}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-2 mb-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* User Info */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {session?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {!isAdmin && hasAdminRole && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <Shield className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    User Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = "/api/auth/signout";
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
