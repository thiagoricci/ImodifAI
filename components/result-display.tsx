"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, RotateCcw, CheckCircle, XCircle, Maximize2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

interface ModificationResult {
  success: boolean
  modified_image?: string
  processing_time?: string
  error?: string
}

interface ResultDisplayProps {
  result: ModificationResult
  originalImage: string | null
  onReset: () => void
}

export function ResultDisplay({ result, originalImage, onReset }: ResultDisplayProps) {
  const [showComparison, setShowComparison] = useState(false) // Default to single view on mobile
  const [comparisonMode, setComparisonMode] = useState<"side-by-side" | "slider">("side-by-side")

  const getImageDataUrl = (base64Data: string) => {
    if (base64Data.startsWith("data:")) {
      return base64Data
    }
    // Default to JPEG for better compatibility with converted images
    return `data:image/jpeg;base64,${base64Data}`
  }

  const handleDownload = () => {
    if (!result.modified_image) return

    const link = document.createElement("a")
    link.href = getImageDataUrl(result.modified_image)
    link.download = `photodifai-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!result.success) {
    return (
      <Card className="p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-destructive/10 rounded-2xl">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Processing Failed</h3>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              {result.error || "An unexpected error occurred while processing your image. Please try again with a different image or prompt."}
            </p>
          </div>

          <Button onClick={onReset} variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-all">
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header Card */}
      <Card className="p-4 sm:p-6 shadow-xl border-border/50 bg-gradient-to-r from-primary/10 via-card/80 to-secondary/10 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <span className="block sm:inline">Transformation Complete!</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse hidden sm:inline" />
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Your image has been successfully modified</p>
            </div>
          </div>
          {result.processing_time && (
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5">
              ⚡ {result.processing_time}
            </Badge>
          )}
        </div>
      </Card>

      {/* Comparison Controls */}
      <div className="flex items-center justify-center">
        <Button
          variant={showComparison ? "default" : "outline"}
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
          className="shadow-md h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          {showComparison ? "Hide Original" : "Show Comparison"}
        </Button>
      </div>

      {/* Images Display */}
      <Card className="p-4 sm:p-6 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
        {showComparison ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Original Image */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-center">
                <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
                  Original
                </Badge>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 p-1">
                <div className="relative rounded-lg overflow-hidden bg-card">
                  {originalImage && (
                    <img
                      src={getImageDataUrl(originalImage)}
                      alt="Original photo"
                      className="w-full h-auto object-contain max-h-[300px] sm:max-h-[400px]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Modified Image */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-center">
                <Badge className="text-xs px-2 sm:px-3 py-1 bg-primary">
                  AI Enhanced
                </Badge>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 p-1">
                <div className="relative rounded-lg overflow-hidden bg-card">
                  {result.modified_image && (
                    <img
                      src={getImageDataUrl(result.modified_image) || "/placeholder.svg"}
                      alt="Modified photo"
                      className="w-full h-auto object-contain max-h-[300px] sm:max-h-[400px]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="text-center">
              <Badge className="text-xs px-2 sm:px-3 py-1 bg-primary">
                AI Enhanced Result
              </Badge>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 p-1">
              <div className="relative rounded-lg overflow-hidden bg-card">
                {result.modified_image && (
                  <img
                    src={getImageDataUrl(result.modified_image) || "/placeholder.svg"}
                    alt="Modified photo"
                    className="w-full h-auto object-contain max-h-[400px] sm:max-h-[500px] md:max-h-[600px] mx-auto"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <Button 
          onClick={handleDownload} 
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
          size="lg"
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:animate-bounce" />
          Download Enhanced Photo
        </Button>
        <Button 
          onClick={onReset} 
          variant="outline" 
          size="lg"
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200"
        >
          <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Transform Another
        </Button>
      </div>

      {/* Success Message */}
      <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="text-primary font-semibold">✨ Tip:</span> Try different prompts to explore various creative transformations of your image
        </p>
      </div>
    </div>
  )
}
