import React from "react";

interface MainHeaderProps {
  worldName?: string;
  description?: string;
}

export default function MainHeader({ worldName, description }: MainHeaderProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      zIndex: 1001,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '20px 40px',
      borderRadius: '15px',
      border: '2px solid #fff'
    }}>
      <h1 style={{
        fontSize: '36px',
        margin: '0 0 10px 0',
        color: '#00f2ff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        {worldName}
      </h1>
      <p style={{
        fontSize: '18px',
        margin: '0',
        color: '#ccc'
      }}>
        {description}
      </p>
    </div>
  );
}


