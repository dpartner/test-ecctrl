import { SPHERE_RADIUS } from "../LevelMenuIslands";
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";

import vertexShader from '../../shaders/vertex.glsl?raw';
import fragmentShader from '../../shaders/fragment.glsl?raw';

const COLOR_BASE_NEAR = new THREE.Color(0x00fccd);
const COLOR_BASE_FAR = new THREE.Color(0x1ceeff);
const WAVE_SPEED = 1.2; // min: 0.5, max: 2
const WAVE_AMPLITUDE = 0.15; // min: 0.05, max: 0.5
const TEXTURE_SIZE = 10; // min: 1 , max: 80

// Stylized Ocean Sphere Component with custom shader
export default function OceanSphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Memoize uniforms to prevent material recreation on every render
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorFar: { value: COLOR_BASE_FAR },
    uWaveSpeed: { value: WAVE_SPEED },
    uWaveAmplitude: { value: WAVE_AMPLITUDE },
    uTextureSize: { value: TEXTURE_SIZE },
  }), []);
  
  // Update shader time
  useFrame(({ clock }) => {
    if (!materialRef.current) return
    // CustomShaderMaterial зберігає uniforms в material.uniforms
    if (materialRef.current.uniforms) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry 
        args={[
          SPHERE_RADIUS + 0.5, // Slightly larger than planet
          36, // High detail for smooth waves
          36
        ]} 
      />
      <CustomShaderMaterial
        ref={materialRef as any}
        baseMaterial={THREE.MeshStandardMaterial}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        color={COLOR_BASE_NEAR}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}