"use client"

import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lightbulb, Palette, Camera } from "lucide-react"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const SUGGESTION_PROMPTS = [
  { text: "Make the sky more vibrant", icon: Palette },
  { text: "Remove the background", icon: Camera },
  { text: "Add a vintage filter", icon: Sparkles },
]

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  const characterCount = value.length
  const maxCharacters = 500

  const handleSuggestionClick = (suggestion: string) => {
    if (disabled) return
    onChange(suggestion)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl blur-xl"></div>
        <div className="relative">
          <Textarea
            placeholder="Describe your vision... (e.g., 'Transform this into a stunning sunset scene with warm golden tones and dramatic clouds')"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            maxLength={maxCharacters}
            className="min-h-[120px] resize-none text-base border-border/50 bg-card/80 backdrop-blur-sm focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className={`text-xs font-medium transition-colors ${
              characterCount > maxCharacters * 0.9 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {characterCount}/{maxCharacters}
            </div>
            {characterCount > 0 && (
              <div className="h-4 w-px bg-border"></div>
            )}
            {characterCount > 0 && (
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-primary">Popular transformations:</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_PROMPTS.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
                disabled={disabled}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Badge
                  variant="secondary"
                  className="relative cursor-pointer border border-border/50 bg-card/80 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Icon className="h-3 w-3" />
                  {suggestion.text}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tips section */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">Pro tip:</span> Be specific about colors, lighting, style, and mood for best results
        </p>
      </div>
    </div>
  )
}
