"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";

interface Props {
  onPhoto: (base64: string) => void;
  disabled?: boolean;
}

export function PhotoUploader({ onPhoto, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setPreview(dataUrl);
      onPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const clear = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
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
          onClick={() => cameraInputRef.current?.click()}
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
    </div>
  );
}
