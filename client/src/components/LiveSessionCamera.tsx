import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LiveSessionCameraProps {
  isActive?: boolean;
  faceDetected?: boolean;
  onFaceDetected?: (detected: boolean) => void;
}

export default function LiveSessionCamera({ 
  isActive = false, 
  faceDetected = false,
  onFaceDetected 
}: LiveSessionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              setCameraReady(true);
            }
          };
        }
      } catch (error) {
        if (mounted) {
          console.error("Camera access error:", error);
          if (error instanceof Error) {
            if (error.name === "NotAllowedError") {
              setCameraError("Camera access denied. Please allow camera permissions.");
            } else if (error.name === "NotFoundError") {
              setCameraError("No camera found on this device.");
            } else {
              setCameraError("Failed to access camera. Please check your browser settings.");
            }
          }
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
    };

    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isActive]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="aspect-video rounded-2xl overflow-hidden bg-muted relative">
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                cameraReady ? "opacity-100" : "opacity-0"
              }`}
              data-testid="video-camera-feed"
            />
            
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-16 h-16 mx-auto mb-2 opacity-50 animate-pulse" />
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              </div>
            )}
            
            {faceDetected && cameraReady && (
              <div className="absolute inset-8 border-2 border-status-online rounded-xl animate-pulse">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-status-online rounded-full" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-status-online rounded-full" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-status-online rounded-full" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-status-online rounded-full" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <CameraOff className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">Camera not active</p>
            <p className="text-xs mt-1">Press Start to begin session</p>
          </div>
        )}
      </div>
    </div>
  );
}
