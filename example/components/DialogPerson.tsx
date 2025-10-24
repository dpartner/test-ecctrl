import React from "react";
import { Html } from "@react-three/drei";
import { DialogStep, useDialogs } from "../stores/useDialogs";
import { useCameraControl } from "../hooks/useCameraControl";

interface DialogPersonProps {
  npcId: string;
}

export default function DialogPerson({ npcId }: DialogPersonProps) {
  const dialog = useDialogs((state) => state.dialog);
  const closeDialog = useDialogs((state) => state.closeDialog);
  const startFacts = useDialogs((state) => state.startFacts);
  const nextFact = useDialogs((state) => state.nextFact);
  const acceptMapTransition = useDialogs((state) => state.acceptMapTransition);
  const declineMapTransition = useDialogs((state) => state.declineMapTransition);
  const { isTransitioning } = useCameraControl();


  // Only show dialog if it's open and for this specific NPC
  if (!dialog.isOpen || dialog.npcId !== npcId) return null;

  return (
    <Html position={[0, 1.3, 0]} center>
      <div style={{
        minWidth: 320,
        maxWidth: 520,
        background: '#111',
        color: '#fff',
        borderRadius: 12,
        border: '1px solid #444',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #333' }}>
          <strong>{dialog.npcName || 'Character'}</strong>
          <button onClick={() => closeDialog()} style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          {dialog.step === DialogStep.QUESTION && (
            <>
              <p style={{ margin: '0 0 12px' }}>{dialog.prompt}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startFacts()} style={{ padding: '8px 12px', background: '#2e7d32', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Yes</button>
                <button onClick={() => closeDialog()} style={{ padding: '8px 12px', background: '#555', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close</button>
              </div>
            </>
          )}
          {dialog.step === DialogStep.FACT && (
            <>
              <p style={{ margin: '0 0 12px' }}>{dialog.facts[dialog.factIndex]}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => nextFact()} style={{ padding: '8px 12px', background: '#1976d2', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Continue</button>
                <button onClick={() => closeDialog()} style={{ padding: '8px 12px', background: '#555', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close</button>
              </div>
            </>
          )}
          {dialog.step === DialogStep.MAP_UNLOCK_NOTIFICATION && (
            <>
              <div style={{ textAlign: 'center', margin: '0 0 16px' }}>
                <div style={{ fontSize: '24px', margin: '0 0 8px' }}>🎉</div>
                <h3 style={{ margin: '0 0 8px', color: '#4caf50' }}>New Map Unlocked!</h3>
                <p style={{ margin: '0 0 16px' }}>
                  You have unlocked <strong>{dialog.unlockedMapName}</strong>!
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#ccc' }}>
                  Would you like to travel to the new map now?
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button 
                  onClick={() => acceptMapTransition()} 
                  style={{ 
                    padding: '10px 20px', 
                    background: '#4caf50', 
                    border: 'none', 
                    color: '#fff', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Yes, let's go!
                </button>
                <button 
                  onClick={() => declineMapTransition()} 
                  style={{ 
                    padding: '10px 20px', 
                    background: '#757575', 
                    border: 'none', 
                    color: '#fff', 
                    borderRadius: 6, 
                    cursor: 'pointer' 
                  }}
                >
                  Stay here
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Html>
  );
}
