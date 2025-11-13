"use client";

import { Twitter, Github, Linkedin, MessageCircle, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { footerLinkGroups, socialLinks, footerConfig } from "@/data/footerLinks";

const iconMap = {
  Twitter,
  Github,
  Linkedin,
  MessageCircle,
};

export function FooterSection() {
  return (
    <footer className="w-full bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Divider with gradient */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      
      {/* Main footer content */}
      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-5 py-16 md:py-20">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Brand Block - Takes up more space */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start gap-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/logos/boxlogo512x512.svg"
                  alt="Voxe Logo"
                  width={48}
                  height={48}
                  className="inline-block align-middle group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <span className="text-foreground text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Voxe
              </span>
            </Link>
            
            <div className="space-y-3">
              <p className="text-muted-foreground text-base font-medium leading-relaxed text-center lg:text-left max-w-md">
                {footerConfig.tagline}
              </p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  <Zap className="w-3 h-3" />
                  Unlimited AI
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  <Shield className="w-3 h-3" />
                  Hosted
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  <Globe className="w-3 h-3" />
                  No Lock-in
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerLinkGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h3 className="text-foreground text-sm font-semibold leading-5 tracking-wide uppercase">
                  {group.title}
                </h3>
                <div className="flex flex-col gap-3">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-2 text-muted-foreground text-sm font-normal leading-5 hover:text-foreground transition-all duration-200"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.label}
                      </span>
                      {link.external && (
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter/CTA Section */}
        <div className="border-t border-border/50 pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-foreground text-lg font-semibold mb-2">
                Ready to own your support stack?
              </h4>
              <p className="text-muted-foreground text-sm">
                Join teams already saving 60-80% on support costs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2">
                  Try Free Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-6 py-3 border border-border text-foreground rounded-lg font-medium text-sm hover:bg-muted/50 transition-colors duration-200">
                  Talk to Sales
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <p className="text-muted-foreground text-sm font-medium">Follow our journey</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const IconComponent = iconMap[social.icon as keyof typeof iconMap];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                >
                  <IconComponent className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 w-full border-t border-border/50 bg-muted/30">
        <div className="w-full max-w-[1320px] mx-auto px-5 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{footerConfig.copyright}</span>
              <div className="hidden sm:block w-px h-4 bg-border"></div>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>{footerConfig.microcopy}</span>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}