import { NextRequest, NextResponse } from "next/server"
import heicConvert from "heic-convert"
import sharp from "sharp"

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      )
    }

    console.log("[convert-heic] Starting HEIC conversion")

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const inputBuffer = Buffer.from(base64Data, "base64")

    let convertedBuffer: Buffer

    try {
      // First, try to convert using heic-convert
      console.log("[convert-heic] Converting HEIC to JPEG using heic-convert")
      
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.95
      })

      convertedBuffer = Buffer.from(outputBuffer)
      console.log("[convert-heic] HEIC conversion with heic-convert successful")
    } catch (heicError) {
      // If heic-convert fails, try with sharp directly (for non-HEIC images)
      console.log("[convert-heic] heic-convert failed, trying sharp:", heicError)
      
      try {
        convertedBuffer = await sharp(inputBuffer)
          .jpeg({ quality: 95 })
          .toBuffer()
        console.log("[convert-heic] Conversion with sharp successful")
      } catch (sharpError) {
        console.error("[convert-heic] Both converters failed:", { heicError, sharpError })
        throw new Error("Unable to convert image format")
      }
    }

    // Optional: Use sharp for any additional processing (resize, optimize, etc.)
    // For now, we'll just ensure it's a proper JPEG
    const finalBuffer = await sharp(convertedBuffer)
      .jpeg({ quality: 95, progressive: true })
      .toBuffer()

    const convertedBase64 = finalBuffer.toString("base64")
    const dataUrl = `data:image/jpeg;base64,${convertedBase64}`

    console.log("[convert-heic] Image conversion successful")

    return NextResponse.json({
      success: true,
      converted_image: dataUrl,
    })
  } catch (error) {
    console.error("[convert-heic] Error converting image:", error)
    
    let errorMessage = "Failed to convert image. Please try a different image."
    if (error instanceof Error) {
      if (error.message.includes("HEIC")) {
        errorMessage = "Failed to convert HEIC image. The file may be corrupted or in an unsupported format."
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
