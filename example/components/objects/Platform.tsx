import React, { useEffect, useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import { MapLoadingTrackerItems, type Material } from "../../types/MapData.types";
import { useUI } from "../../stores/useUI";
import getMapItemKey from "../../utils/mapItemsKeys";

interface PlatformProps {
  mapId: string;
  id: string;
  type: string;
  position: [number, number, number];
  size: [number, number, number];
  material: Material;
}

export default function Platform({ mapId, id, type, position, size, material }: PlatformProps) {
  const { markItemLoaded, loadingTracker } = useUI();
  const markedAsLoaded = useRef(false);
  const loadingItems = loadingTracker?.totalItems;

  //Mark platform as loaded when platform is ready
  useEffect(() => {
    const platformId = getMapItemKey(MapLoadingTrackerItems.PLATFORM, mapId, id);
    if (loadingTracker && id && !markedAsLoaded.current) {
      markItemLoaded(platformId);
      markedAsLoaded.current = true;
    }
  }, [id, loadingItems]);
  
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={material.color}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>
    </RigidBody>
  );
}
