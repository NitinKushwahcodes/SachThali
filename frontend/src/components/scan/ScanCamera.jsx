// Scan camera component providing file upload dropzone and live camera capture.
// Adapts UI for desktop (file dropzone primary) vs mobile (camera view primary).
// Converts captured photos into file objects for multipart submission to POST /scan.

import React, { useRef, useState } from 'react';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import { useScreenSize } from '../../hooks/useMediaQuery';

// Component managing image input selection via webcam or file browser.
export function ScanCamera({ onImageSelected, isScanning }) {
  const { isDesktop } = useScreenSize();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [useCamera, setUseCamera] = useState(!isDesktop);
  const [cameraActive, setCameraActive] = useState(false);

  // Triggers file input click for manual photo selection.
  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handles input file selection event.
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  // Starts HTML5 camera video stream for live capture.
  const startCamera = async () => {
    try {
      setUseCamera(true);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable', err);
      setCameraActive(false);
      setUseCamera(false);
    }
  };

  // Captures frame from live video element into image file.
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'food_scan.jpg', { type: 'image/jpeg' });
        // Stop stream
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
        onImageSelected(file);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {useCamera && cameraActive ? (
        <div className="w-full max-w-md relative bg-black rounded-3xl overflow-hidden shadow-xl aspect-square flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-6 flex gap-4 items-center">
            <button
              onClick={captureFrame}
              disabled={isScanning}
              className="w-16 h-16 bg-white rounded-full border-4 border-[#3F8F5F] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-[#3F8F5F] rounded-full"></div>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleFileClick}
          className={`w-full max-w-md bg-white border-2 border-dashed border-[#3F8F5F] rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-sm ${
            isDesktop ? 'aspect-[4/3]' : 'aspect-square'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#3F8F5F] flex items-center justify-center mb-4">
            {isDesktop ? <Upload size={32} /> : <Camera size={32} />}
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">
            {isDesktop ? 'Upload Food Photo' : 'Take a Food Photo'}
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            {isDesktop
              ? 'Click to select or drag and drop your meal photo'
              : 'Tap to capture your plate or upload an image'}
          </p>

          <button
            type="button"
            className="px-6 py-2.5 bg-[#3F8F5F] text-white font-semibold rounded-xl hover:bg-[#34774E] transition-colors shadow-sm"
          >
            Select Photo
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-4 text-xs font-medium text-[#3F8F5F]">
        {!useCamera ? (
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-1.5 hover:underline"
          >
            <Camera size={14} /> Switch to Camera View
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFileClick}
            className="flex items-center gap-1.5 hover:underline"
          >
            <Upload size={14} /> Upload from Gallery
          </button>
        )}
      </div>
    </div>
  );
}
