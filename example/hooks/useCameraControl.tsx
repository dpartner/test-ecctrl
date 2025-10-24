import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useGame } from "../../src/stores/useGame";

export const useCameraControl = () => {
  const { camera } = useThree();
  const cameraPos = useGame((state) => state.cameraPos);
  const cameraTarget = useGame((state) => state.cameraTarget);
  
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isTransitioning = useRef(false);
  
  // Smooth transition settings
  const transitionSpeed = 0.05;
  const lookAtSpeed = 0.08;
  
  useEffect(() => {
    if (cameraPos && cameraTarget) {
      // Start transition to new position
      targetPosition.current.set(cameraPos.x, cameraPos.y, cameraPos.z);
      targetLookAt.current.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      isTransitioning.current = true;
    } else {
      // Clear transition - return to normal follow mode
      isTransitioning.current = false;
    }
  }, [cameraPos, cameraTarget]);
  
  useFrame(() => {
    if (isTransitioning.current && cameraPos && cameraTarget) {
      // Smoothly move camera position
      camera.position.lerp(targetPosition.current, transitionSpeed);
      
      // Smoothly look at target
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.add(camera.position);
      
      const targetDirection = targetLookAt.current.clone().sub(camera.position);
      const currentDirection = currentLookAt.clone().sub(camera.position);
      
      const lerpedDirection = currentDirection.lerp(targetDirection, lookAtSpeed);
      const newLookAt = camera.position.clone().add(lerpedDirection);
      
      camera.lookAt(newLookAt);
    }
  });
  
  return {
    isTransitioning: isTransitioning.current,
    targetPosition: targetPosition.current,
    targetLookAt: targetLookAt.current,
  };
};
