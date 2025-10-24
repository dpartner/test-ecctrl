import React from "react";
import { useLevelProgress } from "../../stores/useLevelProgress";
import type { GameProgress } from "../../types/UserDto";

interface MainFooterProps {
  maps: any[];
  progress: GameProgress[];
}

export default function MainFooter({ maps, progress }: MainFooterProps) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      zIndex: 1001,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '15px 30px',
      borderRadius: '15px',
      border: '2px solid #fff'
    }}>
      <p style={{
        fontSize: '16px',
        margin: '0 0 15px 0',
        color: '#ccc'
      }}>
        Completed maps: {maps.filter(map => {
          const mapNPCs = progress.filter(item => item.mapId === map.id);
          if (mapNPCs.length === 0) return false;
          const allCompleted = mapNPCs.every(npc => npc.isCompleted);
          return allCompleted;
        }).length}/{maps.length} | Total NPCs: {progress.filter(npc => npc.isCompleted).length} completed
      </p>

      <button
        onClick={() => {
          if (confirm('Are you sure you want to reset all progress?')) {
            const { resetProgress } = useLevelProgress.getState();
            resetProgress();
            window.location.reload();
          }
        }}
        style={{
          background: 'transparent',
          color: '#ff6b6b',
          border: '2px solid #ff6b6b',
          borderRadius: '25px',
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ff6b6b';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#ff6b6b';
        }}
      >
        Reset Progress
      </button>
    </div>
  );
}


