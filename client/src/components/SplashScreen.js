import React, { useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-100 dark:from-gray-900 dark:via-blue-950 dark:to-purple-900 transition-colors duration-700 animate-fade-in-out animate-bg-move">
      <div className="flex flex-col items-center justify-center">
        <img
          src="/connectsphere-logo.png"
          alt="ConnectSphere Logo"
          className="w-32 h-32 animate-logo-zoom-glow shadow-2xl mb-4 rounded-full"
        />
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight animate-fade-in">
          ConnectSphere
        </h1>
        <p className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-200 opacity-0 animate-tagline-fade-in">
          Connect. Share. Inspire.
        </p>
      </div>
      <style>{`
        @keyframes logo-zoom-glow {
          0% { opacity: 0; transform: scale(0.85); filter: drop-shadow(0 0 0px #7c3aed); }
          30% { opacity: 1; transform: scale(1.05); filter: drop-shadow(0 0 16px #7c3aed88); }
          70% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 8px #7c3aed55); }
          100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 0px #7c3aed22); }
        }
        .animate-logo-zoom-glow {
          animation: logo-zoom-glow 1.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes fade-in-out {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1.2s 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes tagline-fade-in {
          0% { opacity: 0; transform: translateY(16px); }
          60% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-tagline-fade-in {
          animation: tagline-fade-in 1.1s 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes bg-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-bg-move {
          background-size: 200% 200%;
          animation: bg-move 2.2s linear infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen; 