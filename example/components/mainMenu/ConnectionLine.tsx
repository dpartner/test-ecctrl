import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import { ConnectionStatus, STATUS_COLORS } from "../../types/Status.types";
import MovingCones from "./MovingCones";

interface ConnectionLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  status: ConnectionStatus;
  npcName: string;
  sourceMapId: string;
  targetMapId: string;
}

const ConnectionLine = ({ start, end, status, npcName, sourceMapId, targetMapId }: ConnectionLineProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const fadeProgress = useRef(0);

  // Calculate text position above the curve
  const textPosition = useMemo(() => {
    const distance = start.distanceTo(end);
    const liftHeight = SPHERE_RADIUS + Math.max(3, distance * 0.1);
    
    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .divideScalar(2)
      .normalize()
      .multiplyScalar(liftHeight);
    
    // Lift text above the curve
    const liftedPosition = midPoint.clone().add(
      midPoint.clone().normalize().multiplyScalar(0.5)
    );
    
    return liftedPosition;
  }, [start, end]);

  // Get line color based on status
  const getLineColor = () => STATUS_COLORS[status] || "#666666";

  // Плавна анімація появи лінії
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Плавне з'явлення лінії
      fadeProgress.current += (1 - fadeProgress.current) * delta * 0.5;
      
      // Застосовуємо прозорість до групи
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.Material) {
            child.material.transparent = true;
            child.material.opacity = fadeProgress.current;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      <MovingCones start={start} end={end} status={status} sourceMapId={sourceMapId} targetMapId={targetMapId} />
      
      <Billboard position={textPosition}>
        <Text
          fontSize={0.3}
          color={getLineColor()}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {npcName}
        </Text>
      </Billboard>
    </group>
  );
};

export default ConnectionLine;
