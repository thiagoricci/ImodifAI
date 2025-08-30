"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { Sparkles, Wand2, Palette, Zap, Brain, Camera } from "lucide-react"

const loadingMessages = [
  { text: "Analyzing your image...", icon: Camera },
  { text: "Understanding your vision...", icon: Brain },
  { text: "Applying AI magic...", icon: Wand2 },
  { text: "Enhancing details...", icon: Sparkles },
  { text: "Fine-tuning colors...", icon: Palette },
  { text: "Finalizing transformation...", icon: Zap },
]

export function ProcessingLoader() {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95
        return prev + Math.random() * 15
      })
    }, 500)

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [])

  const currentMessage = loadingMessages[messageIndex]
  const Icon = currentMessage.icon

  return (
    <Card className="p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full">
              <Icon className="h-12 w-12 text-primary animate-spin" />
            </div>
            
            {/* Orbiting particles */}
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
            </div>
            <div className="absolute inset-0 animate-spin-slow animation-delay-200">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rounded-full"></div>
            </div>
            <div className="absolute inset-0 animate-spin-slow animation-delay-400">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-primary/60 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Processing Your Image
          </h3>
          <p className="text-sm text-muted-foreground animate-in fade-in duration-500" key={messageIndex}>
            {currentMessage.text}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2 bg-muted" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>AI Processing</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Did you know?</span> Our AI analyzes millions of pixels and applies complex transformations in real-time to create your perfect image.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
