"use client"

import { PhotoUpload } from "@/components/photo-upload"
import { PromptInput } from "@/components/prompt-input"
import { ProcessingLoader } from "@/components/processing-loader"
import { ResultDisplay } from "@/components/result-display"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ImageIcon } from "lucide-react"

interface ModificationResult {
  success: boolean
  modified_image?: string
  processing_time?: string
  error?: string
}

interface ControlPanelProps {
  uploadedImage: string | null
  prompt: string
  isProcessing: boolean
  result: ModificationResult | null
  onImageUpload: (imageData: string) => void
  onPromptChange: (newPrompt: string) => void
  onModify: () => void
  onReset: () => void
  canModify: boolean
}

export function ControlPanel({
  uploadedImage,
  prompt,
  isProcessing,
  result,
  onImageUpload,
  onPromptChange,
  onModify,
  onReset,
  canModify,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">1. Upload Photo</h2>
        </div>
        <PhotoUpload onImageUpload={onImageUpload} uploadedImage={uploadedImage} />
      </Card>

      {uploadedImage && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">2. Describe Modification</h2>
          </div>
          <PromptInput value={prompt} onChange={onPromptChange} disabled={isProcessing} />

          <div className="flex gap-2 mt-3">
            <Button 
              onClick={onModify} 
              disabled={!canModify} 
              className="flex-1 md:h-10 md:px-6" 
              size="default"
            >
              {isProcessing ? "Processing..." : "Modify Photo"}
            </Button>
            <Button 
              onClick={onReset} 
              variant="outline" 
              disabled={isProcessing} 
              className="md:h-10 md:px-6" 
              size="default"
            >
              Reset
            </Button>
          </div>
        </Card>
      )}

      {isProcessing && <ProcessingLoader />}

      {result && !isProcessing && (
        <ResultDisplay result={result} originalImage={uploadedImage} onReset={onReset} />
      )}
    </div>
  )
}
