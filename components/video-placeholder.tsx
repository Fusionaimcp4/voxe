"use client"

import { Play } from "lucide-react"
import { useState } from "react"

interface VideoPlaceholderProps {
  title: string
  description?: string
  videoPath?: string
  className?: string
}

export function VideoPlaceholder({ title, description, videoPath, className = "" }: VideoPlaceholderProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 ${className}`}>
      {!isPlaying && videoPath ? (
        <video
          src={videoPath}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
        />
      ) : (
        <div className="relative aspect-video w-full flex flex-col items-center justify-center p-12">
          {/* Placeholder gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
          
          {/* Animated grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Play button icon */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

