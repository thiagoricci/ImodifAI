"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { ImageIcon } from "lucide-react"

interface ImagePreviewProps {
  imageData: string | null
}

export function ImagePreview({ imageData }: ImagePreviewProps) {
  return (
    <Card className="aspect-square w-full h-full flex items-center justify-center overflow-hidden">
      {imageData ? (
        <Image
          src={imageData}
          alt="Uploaded preview"
          width={512}
          height={512}
          className="object-contain w-full h-full"
        />
      ) : (
        <div className="flex flex-col items-center text-muted-foreground">
          <ImageIcon className="h-16 w-16 mb-2" />
          <p>Your image will appear here</p>
        </div>
      )}
    </Card>
  )
}
