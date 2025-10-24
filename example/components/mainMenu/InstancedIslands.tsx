import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import type { MapStatus } from "../../types/Status.types";
import { useUI } from "../../stores/useUI";

interface InstancedIslandsProps {
  maps: any[];
  progress: any;
  isPlanetDragging: boolean;
  getMapStatus: (mapId: string) => MapStatus;
  getMapProgress: (mapId: string) => number;
  onMapSelect: (mapId: string) => void;
  modelURL: string;
  gltf: any;
}

const InstancedIslands = ({
  maps,
  isPlanetDragging,
  getMapStatus,
  getMapProgress,
  onMapSelect,
  modelURL,
  gltf,
}: InstancedIslandsProps) => {
  // Ref for array of InstancedMesh (one for each mesh in the model)
  const instancedRefs = useRef<THREE.InstancedMesh[]>([]);
  const { hoveredMapId, setHoveredMapId } = useUI();
  
  // Ref for smooth hover animation for each island
  const hoverProgressRefs = useRef<{ [key: string]: number }>({});

  // Filter islands by modelURL
  const islandsForThisModel = useMemo(() => {
    return maps.filter((map) => map.model.url === modelURL);
  }, [maps, modelURL]);

  const instanceCount = islandsForThisModel.length;

  // Extract all Mesh from GLTF (geometry + material)
  const meshData = useMemo(() => {
    if (!gltf?.scene) return [];

    const data: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];

    gltf.scene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        const material = Array.isArray(child.material)
          ? child.material[0]
          : child.material;

        if (material) {
          data.push({
            geometry: child.geometry.clone(), // CLONE!
            material,
          });
        }
      }
    });

    return data;
  }, [gltf]);

  // Clear refs when mesh count changes
  useEffect(() => {
    instancedRefs.current = [];
  }, [meshData.length]);

  // Animation: update positions, rotations, scales with smooth animation
  useFrame((state, delta) => {
    if (instanceCount === 0 || meshData.length === 0 || instancedRefs.current.length === 0) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    islandsForThisModel.forEach((map, index) => {
      const status = getMapStatus(map.id);
      const prog = getMapProgress(map.id);
      const isHovered = hoveredMapId === map.id;

      // --- Smooth hover animation ---
      const mapId = map.id;
      if (!hoverProgressRefs.current[mapId]) {
        hoverProgressRefs.current[mapId] = 0;
      }
      
      const targetHover = isHovered ? 1 : 0.1;
      hoverProgressRefs.current[mapId] += (targetHover - hoverProgressRefs.current[mapId]) * delta * 4; // Animation speed

      // --- Position on sphere ---
      const sphereRadius = SPHERE_RADIUS + map.model.altitude * SPHERE_RADIUS;
      const theta = map.model.theta * Math.PI;
      const phi = map.model.phi * Math.PI;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.cos(phi);
      const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

      // Smooth floating + lift on hover
      const baseY = y + Math.sin(state.clock.elapsedTime + x) * 0.04;
      const liftAmount = hoverProgressRefs.current[mapId] * 0.4; // Smooth lift
      const finalY = baseY + liftAmount;

      // --- Orientation (surface normal) ---
      const surfaceNormal = new THREE.Vector3(x, y, z).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(up, surfaceNormal);

      // --- Smooth hover effects ---
      const baseScale = map.model.scale ?? 1;
      const scaleAmount = 1 + (hoverProgressRefs.current[mapId] * 0.1); // Smooth scaling
      const rotationAmount = hoverProgressRefs.current[mapId] * 0.1; // Smooth rotation
      
      // Add rotation on hover
      if (hoverProgressRefs.current[mapId] > 0.01) {
        const rotationY = Math.sin(state.clock.elapsedTime * 2) * rotationAmount;
        quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY));
      }

      scale.setScalar(baseScale * scaleAmount);

      // --- Position ---
      position.set(x, finalY, z);

      // --- Matrix composition ---
      matrix.compose(position, quaternion, scale);

      // Update ALL InstancedMesh
      instancedRefs.current.forEach((instancedMesh) => {
        if (instancedMesh) {
          instancedMesh.setMatrixAt(index, matrix);
        }
      });
    });

    // Mark that matrices have changed
    instancedRefs.current.forEach((instancedMesh) => {
      if (instancedMesh) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  // --- Event handlers ---
  const handlePointerOver = (event: any, meshIndex: number) => {
    event.stopPropagation();
    if (isPlanetDragging) return;
    const instanceId = event.instanceId;
    if (instanceId !== undefined && instanceId < instanceCount) {
      const map = islandsForThisModel[instanceId];
      setHoveredMapId(map.id);
    }
  };

  const handlePointerOut = () => {
    setHoveredMapId(null);
  };

  const handlePointerMove = (event: any) => {
    // Optional: can add highlighting or effects
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (isPlanetDragging) return;
    const instanceId = event.instanceId;
    if (instanceId !== undefined && instanceId < instanceCount) {
      const map = islandsForThisModel[instanceId];
      onMapSelect(map.id);
    }
  };

  // If no data - don't render anything
  if (instanceCount === 0 || meshData.length === 0) {
    return null;
  }

  return (
    <>
      {meshData.map((data, meshIndex) => (
        <instancedMesh
          key={meshIndex}
          ref={(el) => {
            if (el) {
              instancedRefs.current[meshIndex] = el;
            }
          }}
          args={[data.geometry, data.material, instanceCount]}
          onPointerOver={(e) => handlePointerOver(e, meshIndex)}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
          castShadow
          receiveShadow
          frustumCulled
        />
      ))}
    </>
  );
};

export default InstancedIslands;