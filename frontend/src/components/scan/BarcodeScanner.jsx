// Barcode scanner component capturing UPC/EAN packaged food barcodes using HTML5 camera.
// Invokes Html5QrcodeScanner library to decode barcodes from device camera video feed.
// Emits decoded barcode string to POST /barcode API endpoint for OpenFoodFacts lookup.

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Barcode, X } from 'lucide-react';

// Renders live barcode scanner video frame and handles code decoding events.
export function BarcodeScanner({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode('barcode-reader');

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          html5Qrcode.stop().catch(console.error);
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore transient frame decode errors
        }
      )
      .catch((err) => {
        setError('Camera permission denied or barcode scanner unavailable.');
      });

    return () => {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative bg-black rounded-3xl overflow-hidden max-w-md w-full p-4 text-white">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Barcode size={20} className="text-[#3F8F5F]" />
          <span>Point Camera at Barcode</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-full bg-gray-800 hover:bg-gray-700">
          <X size={18} />
        </button>
      </div>

      {error ? (
        <div className="p-6 text-center text-xs text-red-400">{error}</div>
      ) : (
        <div id="barcode-reader" className="w-full rounded-2xl overflow-hidden aspect-video"></div>
      )}
    </div>
  );
}
