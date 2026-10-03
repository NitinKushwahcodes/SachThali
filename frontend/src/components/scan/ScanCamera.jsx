import React, { useRef, useState } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { useScreenSize } from '../../hooks/useMediaQuery';

export function ScanCamera({ onImageSelected, isScanning }) {
  const { isDesktop } = useScreenSize();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Opens device native camera directly
  const handleTakeFoodPhotoClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Opens photo gallery / file browser
  const handleUploadGalleryClick = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  // Handles image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  // Starts HTML5 WebRTC live camera stream
  const startLiveWebRTCCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Live camera stream denied or unavailable', err);
      setCameraActive(false);
      handleTakeFoodPhotoClick();
    }
  };

  // Captures frame from live WebRTC video element
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
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
        onImageSelected(file);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Native Camera Direct Capture Input */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Gallery File Selection Input */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {cameraActive ? (
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
        <div className="w-full max-w-md space-y-3">
          {/* Visual Camera Dropzone Container */}
          <div
            onClick={handleTakeFoodPhotoClick}
            className="w-full bg-white border-2 border-dashed border-[#3F8F5F] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-sm text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#3F8F5F] flex items-center justify-center mb-3">
              <Camera size={32} />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">
              Snap Your Food Plate 📸
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mb-4">
              Position your thali in clear light and tap below to capture!
            </p>

            {/* Prominent Primary Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTakeFoodPhotoClick();
              }}
              disabled={isScanning}
              className="w-full py-3.5 bg-[#3F8F5F] text-white font-extrabold rounded-2xl hover:bg-[#34774E] active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Camera size={20} />
              <span>Take Food Photo 📷</span>
            </button>
          </div>

          {/* Secondary Action Button: Upload from Gallery */}
          <button
            type="button"
            onClick={handleUploadGalleryClick}
            disabled={isScanning}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2 text-xs text-center disabled:opacity-50"
          >
            <ImageIcon size={16} className="text-[#3F8F5F]" />
            <span>Upload from Gallery 🖼️</span>
          </button>

          {/* WebRTC Live Stream Toggle Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={startLiveWebRTCCamera}
              className="text-[11px] font-semibold text-[#3F8F5F] hover:underline inline-flex items-center gap-1"
            >
              <Camera size={12} />
              <span>Open Browser Live Camera Stream</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
