import React, { useRef, useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

// Define available filters
const FILTERS = [
  { name: 'None', value: 'none', css: 'none' },
  { name: 'Grayscale', value: 'grayscale', css: 'grayscale(1)' },
  { name: 'Sepia', value: 'sepia', css: 'sepia(1)' },
  { name: 'Bright', value: 'bright', css: 'brightness(1.3)' },
  { name: 'Contrast', value: 'contrast', css: 'contrast(1.5)' },
  { name: 'Blur', value: 'blur', css: 'blur(2px)' },
];

const SAMPLE_IMAGE = '/connectsphere-logo.png';

const CreateRealtimePage = ({ onSwipeLeft, onSwipeDown, visible }) => {
  const videoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [stream, setStream] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [cameraLoading, setCameraLoading] = useState(false);

  // Enhanced swipe handlers: more forgiving, require deliberate swipe
  const handlers = useSwipeable({
    onSwipedLeft: (e) => {
      if (e.absX > 60 && Math.abs(e.deltaY) < 100) onSwipeLeft && onSwipeLeft();
    },
    onSwipedDown: (e) => {
      if (e.absY > 60) onSwipeDown && onSwipeDown();
    },
    onSwipedUp: () => {
      document.getElementById('gallery-input')?.click();
    },
    delta: 60, // require a more deliberate swipe
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Camera setup: only mount when visible
  useEffect(() => {
    let localStream;
    if (visible) {
      setCameraLoading(true);
      setCameraError(null);
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then(s => {
          localStream = s;
          setStream(s);
          setCameraLoading(false);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          setCameraError('Camera not available or permission denied.');
          setCameraLoading(false);
        });
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setCameraLoading(false);
    };
  }, [visible]);

  // Handle gallery file selection
  const handleGalleryChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Show preview and allow filter selection
      alert('Gallery file selected: ' + file.name);
    }
  };

  // Get CSS filter string for selected filter
  const filterCss = FILTERS.find(f => f.value === selectedFilter)?.css || 'none';

  // Animation classes for slide-in/out
  const animationClass = visible
    ? 'translate-x-0 opacity-100 pointer-events-auto'
    : '-translate-x-full opacity-0 pointer-events-none';

  return (
    <div
      {...handlers}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${animationClass}`}
      style={{ touchAction: 'none', backdropFilter: 'blur(16px)', background: 'rgba(20,20,30,0.55)' }}
    >
      {/* Main camera/gallery card with glassmorphism and shadow */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[9/16] bg-black/60 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center relative backdrop-blur-xl transition-all duration-500">
        {/* Camera loading spinner */}
        {cameraLoading && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {/* Camera error message */}
        {cameraError && (
          <div className="text-white text-center p-8 z-10">{cameraError}</div>
        )}
        {/* Live Camera Preview */}
        {!cameraLoading && !cameraError && visible && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-all duration-300"
            style={{ background: '#222', filter: filterCss }}
          />
        )}
        {/* Hidden file input for gallery */}
        <input
          id="gallery-input"
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleGalleryChange}
        />
        {/* TODO: When gallery image is selected, apply filterCss to image preview here */}
      </div>
      {/* Filter Selection Bar with Thumbnails */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mt-3 flex flex-row items-center justify-center gap-2 overflow-x-auto px-2 py-1 bg-black/40 rounded-lg shadow-lg backdrop-blur-md">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setSelectedFilter(f.value)}
            className={`flex flex-col items-center px-2 py-1 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none border-2 ${selectedFilter === f.value ? 'border-blue-400 bg-blue-500/20' : 'border-transparent hover:border-blue-300'}`}
            style={{ minWidth: 60 }}
          >
            {/* Filter preview thumbnail */}
            <div className={`w-8 h-8 rounded-full overflow-hidden mb-1 border-2 ${selectedFilter === f.value ? 'border-blue-400 shadow-lg' : 'border-gray-300'}`}
                 style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}>
              {/* TODO: For live camera frame preview, use a canvas or video snapshot here */}
              <img
                src={SAMPLE_IMAGE}
                alt={f.name + ' preview'}
                className="w-full h-full object-cover"
                style={{ filter: f.css, transition: 'filter 0.3s' }}
              />
            </div>
            <span className="text-white drop-shadow-sm" style={{ textShadow: '0 1px 2px #0008' }}>{f.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-white text-sm opacity-70 select-none">
        <div>Swipe up for gallery • Swipe left to return</div>
        <div className="mt-1">(Filters: try them live!)</div>
      </div>
    </div>
  );
};

export default CreateRealtimePage; 