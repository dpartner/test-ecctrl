import React from "react";

interface LightingProps {
  ambient: {
    intensity: number;
    color: string;
  };
  directional: {
    intensity: number;
    color: string;
    position: [number, number, number];
    castShadow: boolean;
  };
  point?: {
    intensity: number;
    color: string;
    position: [number, number, number];
    distance: number;
  };
}

export default function Lighting({ ambient, directional, point }: LightingProps) {
  return (
    <>
      <ambientLight
        intensity={ambient.intensity}
        color={ambient.color}
      />
      <directionalLight
        intensity={directional.intensity}
        color={directional.color}
        position={directional.position}
        castShadow={directional.castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      {point && (
        <pointLight
          intensity={point.intensity}
          color={point.color}
          position={point.position}
          distance={point.distance}
        />
      )}
    </>
  );
}
