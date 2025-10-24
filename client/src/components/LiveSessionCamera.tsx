import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedFace, setDetectedFace] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        
        // Initialize MediaPipe Face Detection
        const faceDetection = new FaceDetection({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          }
        });
        
        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5
        });

        faceDetection.onResults((results) => {
          if (!mounted || !canvasRef.current || !videoRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Set canvas size to match video
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;

          // Clear previous drawings
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.detections && results.detections.length > 0) {
            setDetectedFace(true);
            onFaceDetected?.(true);

            results.detections.forEach((detection) => {
              const box = detection.boundingBox;
              if (!box) return;

              // Draw face outline with rounded rectangle
              const x = box.xCenter * canvas.width - (box.width * canvas.width) / 2;
              const y = box.yCenter * canvas.height - (box.height * canvas.height) / 2;
              const width = box.width * canvas.width;
              const height = box.height * canvas.height;
              const radius = 20;

              ctx.strokeStyle = '#10b981'; // status-online green
              ctx.lineWidth = 3;
              ctx.shadowColor = '#10b981';
              ctx.shadowBlur = 10;

              // Draw rounded rectangle
              ctx.beginPath();
              ctx.moveTo(x + radius, y);
              ctx.lineTo(x + width - radius, y);
              ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
              ctx.lineTo(x + width, y + height - radius);
              ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
              ctx.lineTo(x + radius, y + height);
              ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
              ctx.lineTo(x, y + radius);
              ctx.quadraticCurveTo(x, y, x + radius, y);
              ctx.closePath();
              ctx.stroke();

              // Draw corner markers
              const markerSize = 12;
              ctx.fillStyle = '#10b981';
              
              // Top-left
              ctx.beginPath();
              ctx.arc(x + radius, y + radius, markerSize / 2, 0, 2 * Math.PI);
              ctx.fill();
              
              // Top-right
              ctx.beginPath();
              ctx.arc(x + width - radius, y + radius, markerSize / 2, 0, 2 * Math.PI);
              ctx.fill();
              
              // Bottom-left
              ctx.beginPath();
              ctx.arc(x + radius, y + height - radius, markerSize / 2, 0, 2 * Math.PI);
              ctx.fill();
              
              // Bottom-right
              ctx.beginPath();
              ctx.arc(x + width - radius, y + height - radius, markerSize / 2, 0, 2 * Math.PI);
              ctx.fill();

              ctx.shadowBlur = 0;
            });
          } else {
            setDetectedFace(false);
            onFaceDetected?.(false);
          }
        });

        faceDetectionRef.current = faceDetection;

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
            if (mounted && videoRef.current) {
              setCameraReady(true);
              
              // Start MediaPipe Camera
              const camera = new MediaPipeCamera(videoRef.current, {
                onFrame: async () => {
                  if (faceDetectionRef.current && videoRef.current) {
                    await faceDetectionRef.current.send({ image: videoRef.current });
                  }
                },
                width: 1280,
                height: 720
              });
              
              cameraRef.current = camera;
              camera.start();
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
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
        faceDetectionRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      
      setCameraReady(false);
      setDetectedFace(false);
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
  }, [isActive, onFaceDetected]);

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
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: cameraReady ? 1 : 0 }}
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
            
            {detectedFace && cameraReady && (
              <div className="absolute top-4 left-4 bg-status-online/90 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Face Detected
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
