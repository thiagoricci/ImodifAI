"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, AlertCircle, ImagePlus, FileImage, Check, Camera, CameraOff, Aperture, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  onImageUpload: (imageData: string) => void
  uploadedImage: string | null
}

export function PhotoUpload({ onImageUpload, uploadedImage }: PhotoUploadProps) {
  const [notification, setNotification] = useState<{ message: string; type: "error" | "info" } | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [uploadMode, setUploadMode] = useState<"upload" | "camera">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const showNotification = useCallback((message: string, type: "error" | "info" = "error") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000) // Auto-dismiss after 5 seconds
  }, [])

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", // Use back camera on mobile by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      setCameraStream(stream)
      setIsCameraOpen(true)
      
      // Wait for the component to render and then set up the video
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            // Explicitly play the video to ensure it starts
            await videoRef.current.play()
          } catch (playError) {
            console.error("Error playing video:", playError)
          }
        }
      }, 100)
    } catch (error) {
      console.error("Camera access error:", error)
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          showNotification("Camera access denied. Please allow camera permissions.")
        } else if (error.name === "NotFoundError") {
          showNotification("No camera found on this device.")
        } else {
          showNotification("Failed to access camera. Please try again.")
        }
      }
    }
  }, [showNotification])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsCameraOpen(false)
    setCapturedPhoto(null)
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Check if video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        showNotification("Camera is not ready. Please wait a moment and try again.")
        return
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw the video frame to canvas
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedPhoto(dataUrl)
      }
    }
  }, [showNotification])

  const confirmCapturedPhoto = useCallback(() => {
    if (capturedPhoto) {
      onImageUpload(capturedPhoto)
      stopCamera()
    }
  }, [capturedPhoto, onImageUpload, stopCamera])

  const retakePhoto = useCallback(async () => {
    setCapturedPhoto(null)
    
    // Ensure the video stream is playing again after clearing the captured photo
    setTimeout(() => {
      if (videoRef.current && cameraStream) {
        // Re-attach the stream if needed
        if (!videoRef.current.srcObject) {
          videoRef.current.srcObject = cameraStream
        }
        
        // Wait for video to be ready before playing
        const playVideo = async () => {
          try {
            // Check if video is ready
            if (videoRef.current && videoRef.current.readyState >= 2) {
              await videoRef.current.play()
            } else {
              // Wait for video to be ready
              videoRef.current?.addEventListener('loadedmetadata', async () => {
                try {
                  await videoRef.current?.play()
                } catch (err) {
                  // Silently handle interruption errors
                  if (err instanceof Error && !err.message.includes('interrupted')) {
                    console.error("Error playing video:", err)
                  }
                }
              }, { once: true })
            }
          } catch (err) {
            // Silently handle interruption errors
            if (err instanceof Error && !err.message.includes('interrupted')) {
              console.error("Error restarting video after retake:", err)
              showNotification("Camera needs to be restarted. Please try again.", "info")
            }
          }
        }
        
        playVideo()
      }
    }, 100) // Small delay to ensure DOM has updated
  }, [cameraStream, showNotification])

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const processFile = useCallback(async (file: File) => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification("File size must be less than 5MB")
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result as string

        // Check if base64 is too large (5MB * 1.37 for base64 overhead)
        if (result.length > 5 * 1024 * 1024 * 1.37) {
          showNotification("Image is too large after processing. Please use a smaller image.")
          return
        }

        // Check if it's a HEIC/HEIF file
        const isHeic = file.type === "image/heic" || 
                       file.type === "image/heif" || 
                       file.name.toLowerCase().endsWith(".heic") || 
                       file.name.toLowerCase().endsWith(".heif")

        if (isHeic) {
          // Show conversion progress
          setIsConverting(true)
          setConversionProgress(20)
          showNotification("Converting HEIC image to a compatible format...", "info")

          try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              setConversionProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            // Call conversion API
            const response = await fetch("/api/convert-heic", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: result,
              }),
            })

            clearInterval(progressInterval)
            setConversionProgress(100)

            if (!response.ok) {
              throw new Error("Failed to convert HEIC image")
            }

            const data = await response.json()
            
            if (data.success && data.converted_image) {
              onImageUpload(data.converted_image)
              showNotification("HEIC image converted successfully!", "info")
            } else {
              throw new Error(data.error || "Conversion failed")
            }
          } catch (error) {
            console.error("[photo-upload] HEIC conversion error:", error)
            showNotification(
              error instanceof Error ? error.message : "Failed to convert HEIC image. Please try a different format.",
              "error"
            )
            // Still upload the original if conversion fails
            onImageUpload(result)
          } finally {
            setIsConverting(false)
            setConversionProgress(0)
          }
        } else {
          // Regular image, upload directly
          onImageUpload(result)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      showNotification(error instanceof Error ? error.message : "Failed to process image. Please try a different file.")
    }
  }, [onImageUpload, showNotification])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        await processFile(file)
      }
    },
    [processFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic", ".heif"],
    },
    multiple: false,
    noClick: false,
    noKeyboard: false,
  })

  const handleRemoveImage = () => {
    onImageUpload("")
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (uploadedImage) {
    return (
      <div className="relative">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 p-1">
          <div className="relative rounded-lg overflow-hidden bg-card">
            <img 
              src={uploadedImage || "/placeholder.svg"} 
              alt="Uploaded photo" 
              className="w-full h-64 object-contain bg-muted/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Success overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <Check className="h-4 w-4" />
              Photo Uploaded
            </div>
            
            {/* Remove button */}
            <Button 
              onClick={handleRemoveImage} 
              variant="destructive" 
              size="sm" 
              className="absolute top-4 right-4 shadow-lg hover:scale-105 transition-transform"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-center text-foreground/80 font-medium">
            ✨ Ready for transformation! Add your modification prompt below.
          </p>
        </div>
      </div>
    )
  }

  // Camera modal component
  const CameraModal = () => {
    if (!isCameraOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6">
        <div className="relative w-full max-w-4xl">
          <div className="bg-card rounded-xl overflow-hidden shadow-2xl">
            {/* Camera header */}
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold">
                  {capturedPhoto ? "Review Photo" : "Take a Photo"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopCamera}
                className="hover:bg-destructive/20 hover:text-destructive h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Camera view */}
            <div className="relative aspect-[4/3] sm:aspect-video bg-black">
              {!capturedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      // Ensure video plays when metadata is loaded
                      if (videoRef.current) {
                        videoRef.current.play().catch(e => console.error("Play error:", e))
                      }
                    }}
                  />
                  {/* Loading indicator while camera initializes */}
                  {!cameraStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-white text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto mb-2" />
                        <p className="text-sm">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera controls */}
            <div className="p-3 sm:p-4 bg-muted/50 flex justify-center gap-2 sm:gap-3">
              {!capturedPhoto ? (
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="shadow-lg hover:scale-105 transition-transform h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
                >
                  <Aperture className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Capture Photo</span>
                  <span className="sm:hidden">Capture</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    size="lg"
                    className="h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={confirmCapturedPhoto}
                    size="lg"
                    className="shadow-lg hover:scale-105 transition-transform h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
                  >
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Use This Photo</span>
                    <span className="sm:hidden">Use Photo</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CameraModal />
      
      {/* Conversion Progress */}
      {isConverting && (
        <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Converting HEIC Image</p>
              <p className="text-xs text-muted-foreground">Please wait while we prepare your image...</p>
            </div>
          </div>
          <Progress value={conversionProgress} className="h-2" />
        </div>
      )}
      
      {notification && !isConverting && (
        <div className={cn(
          "border rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300",
          notification.type === "error" 
            ? "bg-destructive/10 border-destructive/30" 
            : "bg-primary/10 border-primary/30"
        )}>
          <div className={cn(
            "p-1 rounded-lg",
            notification.type === "error" ? "bg-destructive/20" : "bg-primary/20"
          )}>
            <AlertCircle className={cn(
              "h-5 w-5",
              notification.type === "error" ? "text-destructive" : "text-primary"
            )} />
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              notification.type === "error" ? "text-destructive" : "text-primary"
            )}>
              {notification.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotification(null)}
            className={cn(
              "h-6 w-6 p-0",
              notification.type === "error" 
                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                : "text-primary hover:text-primary hover:bg-primary/10"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Mode switch */}
      <div className="flex justify-center">
        <div className="flex bg-muted/50 p-1 rounded-lg gap-1">
          <button
            onClick={() => setUploadMode("upload")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              uploadMode === "upload"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <Upload className="h-4 w-4" />
            Upload Photo
          </button>
          <button
            onClick={() => setUploadMode("camera")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              uploadMode === "camera"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </button>
        </div>
      </div>

      {/* Conditional rendering based on mode */}
      {uploadMode === "upload" ? (
        /* Upload area */
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300",
            "hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
            isDragActive && "border-primary bg-primary/10 scale-[1.02]",
            !isDragActive && "border-border/50 bg-card/50"
          )}
        >
          <input {...getInputProps()} />
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
          </div>
          
          <div className="relative flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl backdrop-blur-sm">
                {isDragActive ? (
                  <ImagePlus className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-bounce" />
                ) : (
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 sm:p-2 bg-secondary/20 rounded-xl">
                <FileImage className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
            </div>
            
            <div>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                {isDragActive ? "Drop your photo here" : "Upload your photo"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                JPG • PNG • HEIC
              </div>
              <div className="px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                Max 5MB
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Camera capture area */
        <div
          onClick={startCamera}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300",
            "hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
            "border-border/50 bg-card/50"
          )}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
          </div>
          
          <div className="relative flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl backdrop-blur-sm">
                <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 sm:p-2 bg-secondary/20 rounded-xl">
                <Aperture className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
            </div>
            
            <div>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                Take a photo
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Click to open camera
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                Instant capture
              </div>
              <div className="px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                Live preview
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
