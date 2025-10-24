import { Text, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import type { WorldMapConfig } from "../../types/WorldCfg.types";
import { MapStatus, STATUS_COLORS } from "../../types/Status.types";
import { useUI } from "../../stores/useUI";

interface IslandProps {
  map: WorldMapConfig;
  position: [number, number, number];
  status: MapStatus;
  progress: number;
  onSelect: () => void;
  gltf?: any;
}

export default function Island({ map, position, status, progress, onSelect, gltf }: IslandProps) {
  const { setHoveredMapId } = useUI();
  
  // Clone the scene to avoid reusing the same instance
  const baseScene: THREE.Object3D | undefined = gltf?.scene;
  const clonedScene = useMemo(() => (baseScene ? baseScene.clone() : undefined), [baseScene]);
  
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const hoverProgress = useRef(0);
  const scale = map.model.scale;

  useFrame((state, delta) => {
    if (meshRef.current && groupRef.current) {
      const baseY = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.04;
      
      // Smooth hover animation
      const targetHover = hovered ? 1 : 0.1;
      hoverProgress.current += (targetHover - hoverProgress.current) * delta * 4; // Faster animation
      
      // More dramatic lift and effects
      const liftAmount = hoverProgress.current * 0.4; // Increased from 0.15
      const rotationAmount = hoverProgress.current * 0.1; // Slightly increased
      const scaleAmount = 1 + (hoverProgress.current * 0.1); // Scale up on hover
      const scaleTextAmount = 1 + hoverProgress.current * 0.5; // Scale up on hover
      
      // Gentle floating animation with smooth hover
      meshRef.current.position.y = baseY + liftAmount;
      groupRef.current.position.y = baseY + 0.25 + liftAmount;

      // Scale effect
      meshRef.current.scale.setScalar(scale * scaleAmount);

      // Hover effects
      if (hoverProgress.current > 0.01) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * rotationAmount;
        groupRef.current.scale.setScalar(scaleTextAmount);
      } else {
        meshRef.current.rotation.y = 0;
      }
    }
  });

  const getTextColor = () => STATUS_COLORS[status] || "#666666";
  const getMapStatusText = (status: MapStatus) => {
    return status === MapStatus.LOCKED ? "🔒" : status === MapStatus.COMPLETED ? "✅" : "🗺️";
  };
  const getMapProgressText = (progress: number) => {
    if (status === MapStatus.LOCKED) {
      return "";
    }
    return progress === 100 ? "Completed" : `${Math.round(progress)}%`;
  };
  const getMapText = (mapName: string, status: MapStatus, progress: number) => {
    // Розбиваємо ім'я на слова
    const words = mapName.split(' ');
    let mapNameText = '';
    
    // Групуємо по 2 слова на рядок
    for (let i = 0; i < words.length; i += 2) {
      if (i > 0) {
        mapNameText += '\n';
      }
      mapNameText += words[i];
      if (i + 1 < words.length) {
        mapNameText += ' ' + words[i + 1];
      }
    }
    
    return mapNameText + "\n" + getMapStatusText(status) + "\n" + getMapProgressText(progress);
  };

  return (
    <group position={position}>
        {clonedScene && (
        <primitive object={clonedScene}
        ref={meshRef}
        onClick={onSelect}
        onPointerOver={() => {
          setHovered(true);
          setHoveredMapId(map.id);
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredMapId(null);
        }}
        onPointerDown={() => setClicked(true)}
        onPointerUp={() => setClicked(false)}
        scale={scale}
        />)}
      <group position={[0, 0, 1]} ref={groupRef}>
        {/* Map name */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            position={[0, 1.2, 0.1]}
            fontSize={0.45}
            color={getTextColor()}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#ffffff"
            textAlign="center"
            >
            {getMapText(map.name, status, progress)}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}