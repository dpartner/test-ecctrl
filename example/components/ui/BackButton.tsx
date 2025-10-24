import React from "react";

type BackButtonProps = {
  handleBack: () => void;
}

const BackButton = ({ handleBack }: BackButtonProps) => {

  return (
    <button
      onClick={handleBack}
      style={{
        position: 'fixed',
        top: '60px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        border: '2px solid #fff',
        borderRadius: '25px',
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
      }}
    >
      ← Back to Menu
    </button>
  );
};

export default BackButton;