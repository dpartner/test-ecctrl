import React, { useEffect, useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import { MapLoadingTrackerItems, type Material } from "../../types/MapData.types";
import { useUI } from "../../stores/useUI";
import getMapItemKey from "../../utils/mapItemsKeys";

interface ObstacleProps {
  mapId: string;
  id: string;
  type: string;
  position: [number, number, number];
  size?: number | [number, number, number];
  radius?: number;
  height?: number;
  tube?: number;
  material: Material;
}

export default function Obstacle({ mapId, id, type, position, size, radius, height, tube, material }: ObstacleProps) {
  const { markItemLoaded, markItemFailed, loadingTracker } = useUI();
  const markedAsLoaded = useRef(false);
  const loadingItems = loadingTracker?.totalItems;

  const toCubeArgs = (s?: number | [number, number, number]): [number, number, number] => {
    if (Array.isArray(s)) {
      const [x = 1, y = 1, z = 1] = s;
      return [Number(x) || 1, Number(y) || 1, Number(z) || 1];
    }
    const v = Number(s) || 1;
    return [v, v, v];
  };

  const toScalar = (v: unknown, def: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };

  const renderGeometry = () => {
    switch (type) {
      case "cube": {
        const args = toCubeArgs(size);
        return <boxGeometry args={args} />;
      }
      case "sphere":
        return <sphereGeometry args={[toScalar(radius, 1), 16, 16]} />;
      case "cylinder": {
        const r = toScalar(radius, 1);
        const h = toScalar(height, 2);
        return <cylinderGeometry args={[r, r, h, 16]} />;
      }
      case "torus":
        return <torusGeometry args={[toScalar(radius, 1), toScalar(tube, 0.3), 16, 32]} />;
      case "octahedron":
        return <octahedronGeometry args={[toScalar(size, 1)]} />;
      case "dodecahedron":
        return <dodecahedronGeometry args={[toScalar(size, 1)]} />;
      case "icosahedron":
        return <icosahedronGeometry args={[toScalar(size, 1)]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };
  //Mark obstacle as loaded when obstacle is ready
  useEffect(() => {
    const obstacleId = getMapItemKey(MapLoadingTrackerItems.OBSTACLE, mapId, id);
    if (loadingTracker && id && !markedAsLoaded.current) {
      markItemLoaded(obstacleId);
      markedAsLoaded.current = true;
    }
  }, [id, loadingItems]);

  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial
          color={material?.color || "#888"}
          roughness={toScalar(material?.roughness, 0.6)}
          metalness={toScalar(material?.metalness, 0.1)}
        />
      </mesh>
    </RigidBody>
  );
}
