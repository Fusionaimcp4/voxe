"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface VideoModalProps {
  children: React.ReactNode
  videoSrc: string
}

export function VideoModal({ children, videoSrc }: VideoModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    // Pause and reset video when modal is closed
    if (!isOpen && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 border-0">
        <video ref={videoRef} width="100%" height="auto" controls autoPlay>
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </DialogContent>
    </Dialog>
  )
}
