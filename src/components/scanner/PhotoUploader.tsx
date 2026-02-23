"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Upload, X } from "lucide-react";

interface Props {
  onPhoto: (base64: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export function PhotoUploader({ onPhoto, onClear, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    setCameraReady(false);
    void videoRef.current.play();
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const closeCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraOpen(false);
    setCameraReady(false);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image is too large. Use a file up to 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setError("");
      setPreview(dataUrl);
      onPhoto(base64);
    };
    reader.onerror = () => {
      setError("Could not read this image. Try another one.");
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    if (disabled) return;
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      setStream(mediaStream);
      setCameraOpen(true);
    } catch (err) {
      console.error("Camera access error", err);
      setCameraError("Could not access camera. You can upload a photo instead.");
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Could not capture image from camera.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    setPreview(dataUrl);
    setError("");
    onPhoto(base64);
    closeCamera();
  };

  const clear = () => {
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-sm aspect-square bg-[#2C3E2F] rounded-[32px] overflow-hidden flex items-center justify-center relative">
        {preview ? (
          <>
            <img src={preview} alt="Selected" className="w-full h-full object-cover" />
            <button
              onClick={clear}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <span className="text-6xl select-none opacity-40">📷</span>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={disabled}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={disabled}
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-[16px] gap-2 border-brand-card"
          onClick={openCamera}
          disabled={disabled}
        >
          <Camera size={18} /> Camera
        </Button>
        <Button
          variant="outline"
          className="rounded-[16px] gap-2 border-brand-card"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload size={18} /> Upload
        </Button>
      </div>

      {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
      {cameraError && <p className="text-sm text-rose-500 text-center">{cameraError}</p>}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[24px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-brand-carbon">Take a Photo</p>
              <button
                className="text-brand-carbon/50 hover:text-brand-carbon"
                onClick={closeCamera}
                aria-label="Close camera"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative w-full aspect-[4/3] bg-black rounded-[16px] overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onCanPlay={() => setCameraReady(true)}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                  Starting camera...
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-[14px]"
                onClick={closeCamera}
              >
                <CameraOff size={16} /> Cancel
              </Button>
              <Button
                className="flex-1 rounded-[14px] bg-brand-green hover:bg-brand-green/90 text-white"
                onClick={captureFromCamera}
                disabled={!cameraReady}
              >
                <Camera size={16} /> Capture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
