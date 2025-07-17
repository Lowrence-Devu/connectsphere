import React, { useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-screen enhanced-bg">
      <div className="splash-logo-wrapper">
        <img
          src={process.env.PUBLIC_URL + '/connectsphere-logo.png'}
          alt="Connectsphere Logo"
          className="splash-logo enhanced-glow"
        />
        <div className="splash-tagline">Connect. Share. Inspire.</div>
      </div>
    </div>
  );
};

export default SplashScreen; 