// Scan page view coordinating food photo capture, barcode scanning, and meal logging.
// Supports photo scan (POST /scan), barcode scan (POST /barcode), and quick-log text routing.
// Displays ResultCard breakdown, WelcomeModal, Returning Visitor Upfront Prompt (Part D5), and submits confirmed meals.

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanCamera } from '../components/scan/ScanCamera';
import { BarcodeScanner } from '../components/scan/BarcodeScanner';
import { ResultCard } from '../components/scan/ResultCard';
import { WelcomeModal } from '../components/modals/WelcomeModal';
import { apiUpload, apiFetch, formatUserFriendlyError } from '../lib/apiClient';
import { Barcode, MessageSquare, Camera, Sparkles, X } from 'lucide-react';

export default function Scan() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [hint, setHint] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showReturningVisitorPrompt, setShowReturningVisitorPrompt] = useState(false);
  const navigate = useNavigate();

  // Fetches current session context to check visitCount & profile status
  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await apiFetch('/auth/me');
        setUser(u);

        // Part D5: Returning-visitor upfront prompt (visit 2+ if no profile)
        const dismissed = sessionStorage.getItem('dismissedUpfrontPrompt');
        if (!u?.hasProfile && (u?.visitCount >= 2) && !dismissed) {
          setShowReturningVisitorPrompt(true);
        }
      } catch (e) {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  // Receives image file selection and executes POST /scan request.
  const handleImageSelected = async (file) => {
    setSelectedFile(file);
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
    setIsScanning(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', file);
    if (hint) formData.append('hint', hint);

    try {
      const result = await apiUpload('/scan', formData);
      setScanResult(result);
    } catch (err) {
      setError(formatUserFriendlyError(err));
    } finally {
      setIsScanning(false);
    }
  };

  // Receives decoded barcode text string and executes POST /barcode lookup.
  const handleBarcodeScanned = async (code) => {
    setShowBarcodeScanner(false);
    setIsScanning(true);
    setError('');

    try {
      const result = await apiFetch('/barcode', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      if (result.needsClarification && (!result.items || result.items.length === 0)) {
        setError('Barcode not found in OpenFoodFacts database. Please type your meal in Quick-Log!');
      } else {
        setScanResult(result);
      }
    } catch (err) {
      setError(formatUserFriendlyError(err));
    } finally {
      setIsScanning(false);
    }
  };

  // Submits confirmed meal items to POST /log/entry backend API.
  const handleConfirmMeal = async (confirmedItems, photo) => {
    try {
      await apiFetch('/log/entry', {
        method: 'POST',
        body: JSON.stringify({ items: confirmedItems, photoUrl: photo || photoUrl }),
      });

      // Request push notification permission after logging at least 1 meal
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted' && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const vapidData = await apiFetch('/push/vapid-key').catch(() => null);
            if (vapidData?.publicKey) {
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidData.publicKey,
              });
              await apiFetch('/push/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                  endpoint: sub.endpoint,
                  keys: sub.toJSON().keys,
                }),
              });
            }
          }
        } catch (e) {
          console.warn('Push subscription failed', e);
        }
      }

      navigate('/log');
    } catch (err) {
      setError(formatUserFriendlyError(err));
    }
  };

  // Resets scan state to capture a new photo.
  const handleRescan = () => {
    setScanResult(null);
    setSelectedFile(null);
    setPhotoUrl(null);
    setError('');
  };

  const handleDismissUpfrontPrompt = () => {
    sessionStorage.setItem('dismissedUpfrontPrompt', 'true');
    setShowReturningVisitorPrompt(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto relative">
      {/* Part B1: First-visit Welcome Modal */}
      <WelcomeModal />

      {/* Part D5: Returning-visitor upfront prompt modal (visit 2+) */}
      {showReturningVisitorPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={handleDismissUpfrontPrompt}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-[#3F8F5F] rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Welcome Back! 💚</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Create a quick profile to get custom calorie targets & tailored nutrition advice on every scan!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleDismissUpfrontPrompt();
                  navigate('/profile');
                }}
                className="w-full py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] text-xs shadow-md"
              >
                Create Profile Now
              </button>
              <button
                onClick={handleDismissUpfrontPrompt}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 text-xs"
              >
                Maybe later, let me scan first
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan Meal Photo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Snap a photo of your food, scan a barcode, or type in Quick-Log
        </p>
      </div>

      <div className="flex bg-white border border-gray-200 rounded-2xl p-1 w-full justify-around shadow-sm text-xs font-semibold">
        <button
          onClick={() => setShowBarcodeScanner(false)}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            !showBarcodeScanner ? 'bg-[#3F8F5F] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Camera size={16} /> Photo Scan
        </button>
        <button
          onClick={() => setShowBarcodeScanner(true)}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            showBarcodeScanner ? 'bg-[#3F8F5F] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Barcode size={16} /> Barcode Scan
        </button>
        <Link
          to="/quick-log"
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <MessageSquare size={16} /> Quick-Log
        </Link>
      </div>

      {error && (
        <div className="w-full text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl flex flex-col gap-2">
          <span>{error}</span>
          {error.includes('Quick-Log') && (
            <Link
              to="/quick-log"
              className="inline-block px-3 py-1.5 bg-[#3F8F5F] text-white rounded-lg text-center font-bold text-xs"
            >
              Go to Quick-Log
            </Link>
          )}
        </div>
      )}

      {isScanning ? (
        <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center w-full shadow-md space-y-4 text-center">
          <div className="w-14 h-14 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-lg">Analyzing your thali with care... 🥗✨</h3>
            <p className="text-xs text-gray-600 font-semibold">Hum aapke khane ko dhyaan se examine kar rahe hain... Bas 2 seconds! 😊</p>
          </div>
        </div>
      ) : scanResult ? (
        <ResultCard
          scanResult={scanResult}
          photoUrl={photoUrl}
          user={user}
          onConfirm={handleConfirmMeal}
          onRescan={handleRescan}
        />
      ) : showBarcodeScanner ? (
        <BarcodeScanner onScanSuccess={handleBarcodeScanned} onClose={() => setShowBarcodeScanner(false)} />
      ) : (
        <div className="w-full space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-xs text-[#3F8F5F] font-semibold flex items-center gap-2 shadow-sm">
            <span className="text-base">💡</span>
            <span>Shoot your dish from above in clear lighting for best accuracy!</span>
          </div>

          <ScanCamera onImageSelected={handleImageSelected} isScanning={isScanning} />

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Add More Detail
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. 2 Roti, Paneer Butter Masala, less oil, Dahi Puri"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
