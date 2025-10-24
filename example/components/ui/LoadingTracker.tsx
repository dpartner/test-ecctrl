import React, { useEffect } from 'react';
import { useUI } from "../../stores/useUI";

const LoadingTracker = () => {
  const {loadingTracker } = useUI();

  if (!loadingTracker) {
    return null;
  }

  const progress = loadingTracker.loadingProgress;
  const loadedItems = loadingTracker.loadedItems;
  const totalItems = loadingTracker.totalItems;
  const allLoaded = loadingTracker.allLoaded;
  const progressPercentage = progress * 100;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
        `,
        animation: 'float 6s ease-in-out infinite',
      }} />
      
      {/* Main Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        minWidth: '400px',
        maxWidth: '600px',
      }}>
        {/* Game Title */}
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          letterSpacing: '2px',
        }}>
          BEARD GRAPH SURFER
        </div>
        
        {/* Loading Text */}
        <div style={{
          fontSize: '18px',
          color: '#e0e0e0',
          marginBottom: '30px',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        }}>
          Loading Game Assets...
        </div>
        
        {/* Progress Bar Container */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Progress Fill */}
          <div style={{
            width: `${allLoaded ? 100 : progressPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ff88 0%, #00ccff 50%, #8844ff 100%)',
            borderRadius: '10px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated Shine Effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              animation: 'shine 2s infinite',
            }} />
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#00ff88',
          marginBottom: '10px',
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
        }}>
          {allLoaded ? 100 : progressPercentage.toFixed(1)}%
        </div>
        
        {/* Items Counter */}
        <div style={{
          fontSize: '16px',
          color: '#b0b0b0',
          marginBottom: '20px',
        }}>
          {allLoaded ? totalItems : loadedItems} / {totalItems} Assets Loaded
        </div>
        
        {/* Loading Animation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#00ff88',
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`,
                boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
              }}
            />
          ))}
        </div>
        
        {/* Loading Tips */}
        <div style={{
          fontSize: '14px',
          color: '#888',
          marginTop: '20px',
          fontStyle: 'italic',
        }}>
          {allLoaded ? "Ready to play!" : progressPercentage < 25 && "Initializing game world..."}
          {progressPercentage >= 25 && progressPercentage < 50 && "Loading character models..."}
          {progressPercentage >= 50 && progressPercentage < 75 && "Preparing NPCs..."}
          {progressPercentage >= 75 && progressPercentage < 100 && "Finalizing assets..."}
          {allLoaded && "Ready to play!"}
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingTracker;