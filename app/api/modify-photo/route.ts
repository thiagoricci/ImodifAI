import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
const convert = require('heic-convert')

interface ModifyPhotoRequest {
  image: string
  prompt: string
  format: string
}

interface ModifyPhotoResponse {
  result?: string
  success?: boolean
  modified_image?: string
  processing_time?: string
  error?: string
}

interface ImgBBResponse {
  data?: {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    width: string
    height: string
    size: string
    time: string
    expiration: string
    image: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    thumb?: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    medium?: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    delete_url: string
  }
  success: boolean
  status: number
  error?: {
    message: string
    code: number
  }
}

async function convertHeicToJpeg(base64Image: string): Promise<string> {
  try {
    console.log("[v0] Converting HEIC/HEIF to JPEG using heic-convert...")
    
    // Remove data URL prefix
    const base64Data = base64Image.replace(/^data:[^;]+;base64,/, "")
    
    // Convert base64 to Buffer
    const inputBuffer = Buffer.from(base64Data, 'base64')
    
    // Convert HEIC to JPEG using heic-convert
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    })
    
    // Convert back to base64 with JPEG data URL prefix
    const jpegBase64 = `data:image/jpeg;base64,${Buffer.from(outputBuffer).toString('base64')}`
    
    console.log("[v0] Successfully converted HEIC to JPEG using heic-convert")
    return jpegBase64
  } catch (error) {
    console.error("[v0] Error converting HEIC to JPEG with heic-convert:", error)
    throw error
  }
}

async function uploadToImgBB(base64Image: string): Promise<string | null> {
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    console.error("[v0] ImgBB API key not found in environment variables")
    return null
  }

  try {
    console.log("[v0] Uploading image to ImgBB...")
    
    // Log the data URL prefix to debug uploads
    const dataUrlMatch = base64Image.match(/^data:([^;]+);base64,/)
    let mimeType = ""
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1]
      console.log("[v0] Detected MIME type:", mimeType)
    }
    
    // Check if it's HEIC/HEIF and convert to JPEG
    let imageToUpload = base64Image
    if (mimeType.includes('heic') || mimeType.includes('heif') || mimeType === 'image/heic' || mimeType === 'image/heif') {
      console.log("[v0] HEIC/HEIF detected, converting to JPEG before upload...")
      try {
        imageToUpload = await convertHeicToJpeg(base64Image)
      } catch (conversionError) {
        console.error("[v0] Failed to convert HEIC to JPEG:", conversionError)
        return null
      }
    }
    
    // Remove data URL prefix if present
    const imageData = imageToUpload.replace(/^data:[^;]+;base64,/, "")
    
    console.log("[v0] Base64 data length after stripping prefix:", imageData.length)
    
    // Create form data with only the image
    const formData = new FormData()
    formData.append("image", imageData)

    // API key and expiration should be URL parameters, not form data
    const url = `https://api.imgbb.com/1/upload?key=${apiKey}&expiration=600`
    console.log("[v0] Uploading to imgBB API...")

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      console.error("[v0] ImgBB upload failed with status:", response.status)
      const errorText = await response.text()
      console.error("[v0] ImgBB error response:", errorText.substring(0, 500))
      return null
    }

    const data: ImgBBResponse = await response.json()
    
    if (data.success && data.data) {
      console.log("[v0] Image uploaded successfully to ImgBB:", data.data.url)
      console.log("[v0] Image format uploaded:", data.data.image.extension)
      return data.data.url
    } else {
      console.error("[v0] ImgBB upload failed:", data.error)
      return null
    }
  } catch (error) {
    console.error("[v0] Error uploading to ImgBB:", error)
    return null
  }
}


function compressBase64Image(base64: string, maxSizeMB = 5): string {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "")

    // Calculate current size in MB
    const currentSizeMB = (base64Data.length * 3) / 4 / (1024 * 1024)

    if (currentSizeMB <= maxSizeMB) {
      return base64Data
    }

    // Calculate compression ratio needed
    const compressionRatio = Math.sqrt(maxSizeMB / currentSizeMB)

    // Simple compression by reducing quality (remove every nth character in a pattern)
    // This is a basic approach - in production you'd use proper image processing
    const step = Math.max(1, Math.floor(1 / compressionRatio))
    let compressed = ""

    for (let i = 0; i < base64Data.length; i += step) {
      compressed += base64Data[i]
    }

    console.log(
      `[v0] Compressed image from ${currentSizeMB.toFixed(1)}MB to ~${((compressed.length * 3) / 4 / (1024 * 1024)).toFixed(1)}MB`,
    )

    return compressed
  } catch (error) {
    console.log("[v0] Compression failed, using original:", error)
    return base64.replace(/^data:image\/[a-z]+;base64,/, "")
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route called - parsing request body")
    const { image, prompt, format }: ModifyPhotoRequest = await request.json()

    // Validate input
    if (!image || !prompt) {
      console.log("[v0] Validation failed - missing image or prompt")
      return NextResponse.json(
        {
          success: false,
          error: "Image and prompt are required",
        },
        { status: 400 },
      )
    }

    const originalSizeInMB = (image.length * 3) / 4 / (1024 * 1024)
    console.log(
      "[v0] Request validated - prompt:",
      prompt,
      "original image size:",
      image.length,
      "chars (~" + originalSizeInMB.toFixed(1) + "MB)",
    )

    if (originalSizeInMB > 5) {
      console.log("[v0] Image too large - rejecting:", originalSizeInMB.toFixed(1) + "MB")
      return NextResponse.json(
        {
          success: false,
          error: "Image is too large. Please use an image under 5MB for best results.",
        },
        { status: 413 },
      )
    }

    // Check if image is HEIC and convert it for preview
    let convertedImageForPreview: string | undefined
    const dataUrlMatch = image.match(/^data:([^;]+);base64,/)
    if (dataUrlMatch) {
      const mimeType = dataUrlMatch[1]
      if (mimeType.includes('heic') || mimeType.includes('heif') || mimeType === 'image/heic' || mimeType === 'image/heif') {
        console.log("[v0] Converting HEIC for preview...")
        try {
          convertedImageForPreview = await convertHeicToJpeg(image)
          console.log("[v0] HEIC converted for preview")
        } catch (error) {
          console.error("[v0] Failed to convert HEIC for preview:", error)
        }
      }
    }

    // Upload original image to ImgBB first (REQUIRED)
    const originalImageUrl = await uploadToImgBB(image)
    if (!originalImageUrl) {
      console.log("[v0] ImgBB upload failed - cannot proceed without image URL")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload image. Please try again or use a different image format.",
        },
        { status: 422 },
      )
    }
    
    console.log("[v0] Original image uploaded to ImgBB:", originalImageUrl)

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (!n8nWebhookUrl) {
      console.log("[v0] N8N webhook URL not found in environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "N8N webhook URL not configured. Please check environment variables.",
        },
        { status: 500 },
      )
    }

    // Make request to n8n webhook for image modification
    const startTime = Date.now()
    console.log("[v0] Sending request to n8n webhook at:", n8nWebhookUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 180000) // 3-minute timeout

    let n8nResponse
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: originalImageUrl, // Always use ImgBB URL, never base64
          prompt,
          format,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const webhookTime = Date.now() - startTime
    console.log("[v0] Webhook response received after", webhookTime, "ms, status:", n8nResponse.status)

    if (!n8nResponse.ok) {
      console.log("[v0] Webhook returned error status:", n8nResponse.status)
      throw new Error(`N8N webhook responded with status: ${n8nResponse.status}`)
    }

    console.log("[v0] Parsing webhook response JSON")
    let response: ModifyPhotoResponse

    const responseText = await n8nResponse.text()

    try {
      response = JSON.parse(responseText)
    } catch (jsonError) {
      console.log("[v0] Failed to parse JSON response. Raw response:", responseText.substring(0, 200))

      // Check if it's a common HTML error response
      if (responseText.includes("Request Entity Too Large") || responseText.includes("413")) {
        return NextResponse.json(
          {
            success: false,
            error: "Image is too large for processing. Please use an image under 5MB.",
          },
          { status: 413 },
        )
      }

      if (responseText.includes("Bad Request") || responseText.includes("400")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request format. Please try again with a different image.",
          },
          { status: 400 },
        )
      }

      // Generic non-JSON response error
      return NextResponse.json(
        {
          success: false,
          error: "Received invalid response from AI service. Please try again.",
        },
        { status: 502 },
      )
    }

    console.log("[v0] Webhook response parsed:", {
      hasResult: !!response.result,
      hasModifiedImage: !!response.modified_image,
      success: response.success,
      error: response.error,
      resultLength: response.result ? response.result.length : 0,
      modifiedImageLength: response.modified_image ? response.modified_image.length : 0,
    })

    const modifiedImage = response.result || response.modified_image

    if (!modifiedImage && !response.error) {
      console.log("[v0] Webhook returned no image and no error - likely processing failed")
      return NextResponse.json(
        {
          success: false,
          error:
            "AI processing completed but no modified image was returned. Please try a different prompt or check if your image is compatible.",
        },
        { status: 422 },
      )
    }

    if (response.error) {
      console.log("[v0] Webhook returned error:", response.error)
      return NextResponse.json(
        {
          success: false,
          error: `AI processing failed: ${response.error}`,
        },
        { status: 422 },
      )
    }

    if (!modifiedImage) {
      console.log("[v0] Webhook returned success but no modified image")
      return NextResponse.json(
        {
          success: false,
          error: "Processing completed but no modified image was generated. Please try a different prompt.",
        },
        { status: 422 },
      )
    }

    // Calculate processing time if not provided
    if (!response.processing_time) {
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
      response.processing_time = `${processingTime}s`
    }

    console.log("[v0] Returning successful response with processing time:", response.processing_time)
    return NextResponse.json({
      success: true,
      modified_image: modifiedImage,
      processing_time: response.processing_time,
      converted_original: convertedImageForPreview, // Include converted image for preview if HEIC
    })
  } catch (error) {
    console.error("[v0] Photo modification error:", error)

    // Handle timeout errors
    if (error instanceof Error && error.name === "TimeoutError") {
      console.log("[v0] Request timed out after 180 seconds")
      return NextResponse.json(
        {
          success: false,
          error: "Processing timeout after 3 minutes. Please try with a smaller image or simpler prompt.",
        },
        { status: 408 },
      )
    }

    if (error instanceof Error && error.message.includes("Unexpected token")) {
      console.log("[v0] JSON parsing error - webhook returned non-JSON response")
      return NextResponse.json(
        {
          success: false,
          error: "AI service returned an invalid response. Please try with an image under 5MB.",
        },
        { status: 502 },
      )
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes("fetch")) {
      console.log("[v0] Network error occurred:", error.message)
      return NextResponse.json(
        {
          success: false,
          error: "Unable to connect to AI service. Please try again later.",
        },
        { status: 503 },
      )
    }

    console.log("[v0] Unexpected error occurred:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your image.",
      },
      { status: 500 },
    )
  }
}
