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
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Text Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 ">
            <Inbox className="w-6 h-6" />
            <h3 className="font-semibold">Shared Inbox</h3>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Centralize all your inbound messages
          </h2>
          <p className="text-lg text-muted-foreground">
            All your inbound conversations from all channels go into one collaborative inbox. Your team can access, manage,
            and respond to messages efficiently.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {channels.map((channel) => (
              <div key={channel.name} className="flex items-center gap-3">
                {channel.icon}
                <span className="font-medium text-foreground">{channel.name}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">+ 8 other channels</p>
          
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
