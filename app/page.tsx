"use client"

import { useState, useCallback } from "react"
import { PhotoUpload } from "@/components/photo-upload"
import { PromptInput } from "@/components/prompt-input"
import { ProcessingLoader } from "@/components/processing-loader"
import { ResultDisplay } from "@/components/result-display"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ImageIcon, Wand2, ArrowRight, Zap, Shield, Clock } from "lucide-react"

interface ModificationResult {
  success: boolean
  modified_image?: string
  processing_time?: string
  error?: string
  converted_original?: string  // Add converted image for HEIC files
}

export default function PhotoModifierApp() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [displayImage, setDisplayImage] = useState<string | null>(null)  // Image to display in preview
  const [prompt, setPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ModificationResult | null>(null)

  const handleImageUpload = useCallback((imageData: string) => {
    setUploadedImage(imageData)
    setDisplayImage(imageData)  // Initially display the original
    setResult(null) // Clear previous results
  }, [])

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt)
  }, [])

  const handleModifyPhoto = async () => {
    if (!uploadedImage || !prompt.trim()) return

    console.log("[v0] Starting photo modification process")
    setIsProcessing(true)
    setResult(null)

    try {
      console.log("[v0] Sending request to API with prompt:", prompt.trim())
      const startTime = Date.now()

      const response = await fetch("/api/modify-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: prompt.trim(),
          format: "jpg",
        }),
      })

      const requestTime = Date.now() - startTime
      console.log("[v0] API response received after", requestTime, "ms, status:", response.status)

      // Check if the response is OK before parsing
      if (!response.ok) {
        console.error("[v0] API returned error status:", response.status)
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
        
        // Try to parse as JSON for structured error, otherwise use text
          let errorMessage = "Failed to process image. Please try again."
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorMessage
          } catch {
            // If not JSON, use a generic message
            if (response.status === 413) {
              errorMessage = "Image file is too large. Please use a smaller image."
            } else if (response.status === 429) {
              errorMessage = "Too many requests. Please wait a moment and try again."
            } else if (response.status === 500) {
              errorMessage = "Server error occurred. Please try again later."
            } else if (response.status === 408) {
              errorMessage = "Processing is taking longer than expected. The image may still be processing, please try again in a few moments."
            }
          }
        
        setResult({
          success: false,
          error: errorMessage,
        })
        return
      }

      const data: ModificationResult = await response.json()
      console.log("[v0] API response data:", data)
      
      // If we got a converted image (for HEIC files), update the display
      if (data.converted_original) {
        console.log("[v0] Using converted HEIC image for preview")
        setDisplayImage(data.converted_original)
      }
      
      setResult(data)
    } catch (error) {
      console.error("[v0] Network error during photo modification:", error)
      setResult({
        success: false,
        error: "Network error occurred. Please try again.",
      })
    } finally {
      console.log("[v0] Photo modification process completed")
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setDisplayImage(null)
    setPrompt("")
    setResult(null)
    setIsProcessing(false)
  }

  const canModify = uploadedImage && prompt.trim() && !isProcessing

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-2 sm:p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
            <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Imodif<span className="text-primary">AI</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Transform your photos with the power of AI. Simply upload an image and describe your vision - our advanced AI will bring it to life in seconds.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center mt-4 sm:mt-6">
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-foreground/80">Lightning Fast</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-foreground/80">Secure Processing</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-foreground/80">Real-time Results</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Upload Section */}
          <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Step 1: Upload Your Photo</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Choose an image you want to transform</p>
              </div>
            </div>
            <PhotoUpload onImageUpload={handleImageUpload} uploadedImage={displayImage} />
          </Card>

          {/* Prompt Section with smooth animation */}
          <div className={`transition-all duration-500 ${uploadedImage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Step 2: Describe Your Vision</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tell AI how to modify your photo</p>
                </div>
              </div>
              <PromptInput value={prompt} onChange={handlePromptChange} disabled={isProcessing} />

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button 
                  onClick={handleModifyPhoto} 
                  disabled={!canModify} 
                  className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Transform Photo</span>
                      <span className="sm:hidden">Transform</span>
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  disabled={isProcessing} 
                  size="lg"
                  className="h-11 sm:h-12 px-4 sm:px-6 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                >
                  Reset
                </Button>
              </div>
            </Card>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ProcessingLoader />
            </div>
          )}

          {/* Results */}
          {result && !isProcessing && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ResultDisplay result={result} originalImage={displayImage || uploadedImage} onReset={handleReset} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 md:mt-16 pb-6 sm:pb-8">
          <p className="text-xs sm:text-sm text-muted-foreground px-4">
            Powered by advanced AI technology • Your photos are deleted after a few minutes
          </p>
        </div>
      </div>
    </div>
  )
}
