"use client"

import React, { useState, useEffect } from "react"
import { ArrowRight, Bot, Network, Shield } from "lucide-react"
import Image from "next/image"

export function ValuePropositionSection() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)

  useEffect(() => {
    const messages = [
      { text: "How much time do I have for my order return?", sender: "liya", delay: 1000 },
      { text: "Hi Liya! You can return your purchase within 7 days.", sender: "bot", delay: 2000 },
      { text: "That's what I needed! Thx", sender: "Liya", delay: 2000 }
    ]

    let currentIndex = 0
    let timeoutIds: NodeJS.Timeout[] = []

    const showMessage = () => {
      if (currentIndex < messages.length) {
        setVisibleMessages(currentIndex + 1)
        const timeout = setTimeout(() => {
          currentIndex++
          if (currentIndex < messages.length) {
            showMessage()
          } else {
            // Loop back to start after a delay
            setTimeout(() => {
              currentIndex = 0
              setVisibleMessages(0)
              setTimeout(showMessage, 2000)
            }, 2000)
          }
        }, messages[currentIndex].delay)
        timeoutIds.push(timeout)
      }
    }

    const initialTimeout = setTimeout(showMessage, 100)
    timeoutIds.push(initialTimeout)

    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [])

  return (
    <section className="w-full px-5 py-16 md:py-24 relative overflow-hidden -mt-20 md:-mt-32 bg-slate-50/30 dark:bg-slate-900/30">
      {/* Light Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-transparent to-slate-100 dark:from-slate-950 dark:via-transparent dark:to-slate-900" />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Text Content (Left on large screens) */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI-Powered Automation</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
            Automate Your Customer Service 24/7
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl lg:max-w-none mx-auto">
            All your customer conversations in one place—SMS, Web Chat, WhatsApp, Email. Our AI handles everything from hello to handoff, delivering instant responses and ultra-high satisfaction rates.
          </p>
        </div>

        {/* Animated Chat Conversation (Right on large screens) */}
        <div className="lg:w-1/2 relative w-full h-[300px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/liya.png"
              alt="Chat background"
              fill
              className="object-cover"
            />
          </div>

          {/* Chat Messages Container */}
          <div className="absolute inset-0 pt-[2rem] sm:pt-[4rem] md:pt-[12rem] lg:pt-[16rem] pb-6 pl-6 pr-6 z-10 flex flex-col gap-3">

            
            {/* First: User Question (Top) */}
            {visibleMessages >= 1 && (
              <div className="flex items-start gap-2 w-full max-w-[60%] self-end animate-in slide-in-from-right duration-500">
                <div className="flex flex-col items-end flex-1">
                  <div>
                    <p className="text-sm font-bold text-white drop-shadow-lg">
                      How much time do I have for my order return?
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300">
                    <Image
                      src="/images/liya.png"
                      alt="Liya"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center">Liya</p>
                </div>
              </div>
            )}

            {/* Second: Bot Response (Middle) */}
            {visibleMessages >= 2 && (
              <div className="flex items-start gap-2 w-full max-w-[60%] self-start animate-in slide-in-from-left duration-500">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-500/50 flex items-center justify-center">
                    <Image
                      src="/images/boxlogo512x512.png"
                      alt="ChatBot"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center">ChatBot</p>
                </div>
                <div className="flex flex-col items-start flex-1">
                  <div>
                    <p className="text-sm text-yellow-400 font-bold drop-shadow-lg">
                      Hi Liya! You can return your purchase within 7 days.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Third: User Thanks (Bottom) */}
            {visibleMessages >= 3 && (
              <div className="flex items-end gap-2 w-full max-w-[60%] self-end animate-in slide-in-from-right duration-500">
                <div className="flex flex-col items-end flex-1">
                  <div>
                    <p className="text-sm font-bold text-white drop-shadow-lg">
                      That's what I needed! Thx
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300">
                    <Image
                      src="/images/liya.png"
                      alt="Liya"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center">Liya</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}