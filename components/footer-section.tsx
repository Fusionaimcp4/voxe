"use client"

import { Twitter, Github, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function FooterSection() {
  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-[70px]">
      {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
        <div className="flex gap-3 items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            
          <span className="text-foreground text-xl font-semibold flex items-center gap-2">
  <Image
    src="/logos/boxlogo512x512.svg"
    alt="Voxe Logo"
    width={60}
    height={60}
    className="inline-block align-middle"
  />
  Voxe
</span>
          </Link>
        </div>
        <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">
          AI-support without per-seat or per-resolution fees
        </p>
        <div className="flex justify-start items-start gap-3">
          <a href="#" aria-label="Twitter" className="w-4 h-4 flex items-center justify-center">
            <Twitter className="w-full h-full text-muted-foreground" />
          </a>
          <a href="#" aria-label="GitHub" className="w-4 h-4 flex items-center justify-center">
            <Github className="w-full h-full text-muted-foreground" />
          </a>
          <a href="#" aria-label="LinkedIn" className="w-4 h-4 flex items-center justify-center">
            <Linkedin className="w-full h-full text-muted-foreground" />
          </a>
        </div>
      </div>
      {/* Right Section: Legal Links */}
      <div className="grid grid-cols-1 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Legal</h3>
          <div className="flex flex-col justify-end items-start gap-2">
            <a href="/privacy" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
