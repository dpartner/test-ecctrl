import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import { ConnectionStatus, STATUS_COLORS, CONNECTION_THICKNESS } from "../../types/Status.types";

const coneGeometryCache = new Map<ConnectionStatus, THREE.ConeGeometry>();
const coneMaterialCache = new Map<ConnectionStatus, THREE.MeshStandardMaterial>();

export const clearConeCache = () => {
  coneGeometryCache.forEach(geometry => {
    geometry.dispose();
  });
  coneGeometryCache.clear();
  
  coneMaterialCache.forEach(material => {
    material.dispose();
  });
  coneMaterialCache.clear();
};

const MovingCones = ({ start, end, status, sourceMapId, targetMapId }: { 
  start: THREE.Vector3, 
  end: THREE.Vector3, 
  status: ConnectionStatus,
  sourceMapId: string,
  targetMapId: string
}) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  const coneGeometry = useMemo(() => {
    if (coneGeometryCache.has(status)) {
      return coneGeometryCache.get(status)!;
    }
    
    const baseRadius = CONNECTION_THICKNESS[status];
    const geometry = new THREE.ConeGeometry(baseRadius, 0.3, 6);
    coneGeometryCache.set(status, geometry);
    return geometry;
  }, [status]);

  const coneMaterial = useMemo(() => {
    if (coneMaterialCache.has(status)) {
      return coneMaterialCache.get(status)!;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: STATUS_COLORS[status],
      emissive: STATUS_COLORS[status],
      emissiveIntensity: 0.5,
    });
    coneMaterialCache.set(status, material);
    return material;
  }, [status]);

  const coneSpacing = 0.15;
  const distance = start.distanceTo(end);
  
  // Determine if this is an incoming or outgoing connection
  // For now, we'll use a simple heuristic: if sourceMapId < targetMapId, it's outgoing
  const isOutgoing = sourceMapId < targetMapId;
  const liftCoefficient = isOutgoing ? 0.5 : 0.15;
  
  const liftHeight = SPHERE_RADIUS + Math.max(3, distance * liftCoefficient);
  const coneCount = Math.max(1, Math.floor(distance / coneSpacing));

  useFrame((state) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;
    const speed = 0.1;

    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .divideScalar(2)
      .normalize()
      .multiplyScalar(liftHeight);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < coneCount; i++) {
      const t = (time * speed + i * coneSpacing) % 1.0;
      curve.getPoint(t, position);
      const tangent = curve.getTangent(t);
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[coneGeometry, coneMaterial, coneCount]} />
  );
};

export default MovingCones;
