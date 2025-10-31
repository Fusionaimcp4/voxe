"use client"

import { Button } from "@/components/ui/button"
import { Inbox, MessageSquare, Mail, MessageCircle } from "lucide-react"

export function SharedInboxSection() {
  const channels = [
    { name: "Chat Widget", icon: <MessageSquare className="w-5 h-5 text-blue-500" /> },
    { name: "Email", icon: <Mail className="w-5 h-5 text-gray-500" /> },
    { name: "WhatsApp", icon: <div className="w-5 h-5 bg-green-500 rounded-full" /> }, // Placeholder icon
    { name: "Messenger", icon: <MessageCircle className="w-5 h-5 text-purple-500" /> },
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center px-5">
        {/* Left Column: Text Content */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 mb-6">
            <Inbox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Unified Inbox</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Centralize all your inbound messages
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            All your inbound conversations from all channels go into one collaborative inbox. Your team can access, manage,
            and respond to messages efficiently.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {channels.map((channel) => (
              <div key={channel.name} className="flex items-center gap-3">
                {channel.icon}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{channel.name}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">+ 8 other channels</p>
          
        </div>

        {/* Right Column: Video */}
        <div>
          <video
            className="rounded-lg shadow-2xl"
            width="100%"
            height="auto"
            autoPlay
            loop
            muted
            playsInline
            src="/images/inbox-av1.webm"
          />
        </div>
      </div>
    </section>
  )
}
