"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link" // Import Link for client-side navigation
import Image from "next/image"
import { ContactModal } from "./contact-modal"
import { useSession, signOut } from "next-auth/react"

export function Header() {
  const { data: session, status } = useSession()
  
  const navItems = [
    { name: "Platform", href: "#features-section" },
    { name: "Features", href: "#features-section" },
    { name: "Pricing", href: "/pricing-page" },
   
    { name: "Integration", href: "/integration-process" },
    { name: "Cost & Savings", href: "/cost-savings" },
  ]

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle anchor links (starting with #)
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1) // Remove '#' from href
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
    // For page links (like /integration-process), let Next.js handle navigation
  }

  return (
    <header className="w-full py-3 sm:py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-1 sm:gap-2">
            <span className="text-slate-900 dark:text-white text-lg sm:text-xl font-semibold flex items-center gap-1">
  <Image
    src="/logos/boxlogo512x512.png"
    alt="Voxe Logo"
    width={48}
    height={48}
    className="inline-block align-middle sm:w-5 sm:h-5"
  />
  Voxe
</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Welcome, {session.user?.name}</span>
                <Link href="/dashboard">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-medium">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  onClick={() => signOut()}
                  variant="outline"
                  className="px-4 py-2 rounded-full font-medium"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/signin">
                  <Button variant="outline" className="px-4 py-2 rounded-full font-medium">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-slate-900 dark:text-white min-h-[44px] min-w-[44px]">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border text-foreground h-[80vh]">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                    className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white justify-start text-lg py-3 min-h-[44px] flex items-center"
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Authentication */}
                <div className="border-t border-border pt-6 mt-4">
                  {session ? (
                    <div className="flex flex-col gap-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Welcome, {session.user?.name}</span>
                      <Link href="/dashboard">
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium min-h-[48px]">
                          Dashboard
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => signOut()}
                        variant="outline"
                        className="w-full px-6 py-3 rounded-full font-medium min-h-[48px]"
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link href="/auth/signin">
                        <Button variant="outline" className="w-full px-6 py-3 rounded-full font-medium min-h-[48px]">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/signup">
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium min-h-[48px]">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  <ContactModal>
                    <Button className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-full font-medium shadow-sm min-h-[48px]">
                      Request a Demo
                    </Button>
                  </ContactModal>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}