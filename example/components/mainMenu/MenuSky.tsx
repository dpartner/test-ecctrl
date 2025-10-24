import React from "react";
import { Sky } from "@react-three/drei";
import { SPHERE_RADIUS } from "../LevelMenuIslands";

export default function MenuSky() {
  const sunPosition: [number, number, number] = [SPHERE_RADIUS * 2, SPHERE_RADIUS * 0.03, -SPHERE_RADIUS * 1.5];
  return (
    <>
      <group>
        <Sky
          distance={1500}
          sunPosition={sunPosition}
          turbidity={2}
          rayleigh={2}
          mieCoefficient={0.028}
          mieDirectionalG={0.7}
          inclination={0.5}
          azimuth={0.25}
        />
        <mesh position={sunPosition}>
          <sphereGeometry args={[10, 20, 20]} />
          <meshBasicMaterial color="#fff4b0" />
          <meshStandardMaterial emissive="#fff4b0" emissiveIntensity={5} color="#fff4b0" transparent opacity={0.98} />
        </mesh>
      </group>
      {/* Lighting for planet - aligned to the sun */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[SPHERE_RADIUS * 4, SPHERE_RADIUS * 4, SPHERE_RADIUS * 4]} intensity={1.8} color="#fff4b0" castShadow />
      <pointLight position={[SPHERE_RADIUS * 3.2, SPHERE_RADIUS * 3.8, SPHERE_RADIUS * 3]} intensity={0.6} color="#ffe9a6" />
      <spotLight position={[0, 8, 8]} angle={0.3} penumbra={1} intensity={0.4} color="#ffffff" />
    </>
  );
}


