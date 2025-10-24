import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useEffect } from "react";


interface RotatablePlanetProps {
  children: React.ReactNode;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}
// Rotatable Planet Component
export default function RotatablePlanet({ children, isDragging, setIsDragging }: RotatablePlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  
  const handlePointerDown = (event: any) => {
    setIsDragging(true);
    setPreviousMousePosition({ x: event.clientX, y: event.clientY });
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
  };
  
  const handlePointerMove = (event: any) => {
    if (!isDragging || !groupRef.current) return;
    
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    
    // Rotate planet based on mouse movement
    groupRef.current.rotation.y += deltaX * 0.001;
    groupRef.current.rotation.x += deltaY * 0.001;
    
    // Limit rotation on X axis to prevent flipping
    groupRef.current.rotation.x = Math.max(
      Math.min(groupRef.current.rotation.x, Math.PI / 4),
      -Math.PI / 4
    );
    
    setPreviousMousePosition({ x: event.clientX, y: event.clientY });
  };
  
  useEffect(() => {
    const handleGlobalPointerMove = (event: MouseEvent) => handlePointerMove(event);
    const handleGlobalPointerUp = () => handlePointerUp();
    
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalPointerMove);
      document.addEventListener('mouseup', handleGlobalPointerUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalPointerMove);
      document.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [isDragging, previousMousePosition]);
  
  return (
    <group 
      ref={groupRef} 
      onPointerDown={handlePointerDown}
      position={[0, -42, 0]}
    >
      {children}
    </group>
  );
}