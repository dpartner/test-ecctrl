import React, { useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import { MapLoadingTrackerItems, type Material } from "../../types/MapData.types";
import { useUI } from "../../stores/useUI";
import getMapItemKey from "../../utils/mapItemsKeys";
import { TextureLoader } from "three";
import * as THREE from "three";

interface FloorProps {
  size: [number, number, number];
  position: [number, number, number];
  material: Material;
  mapId: string;
  textureUrl: string;
}

export default function Floor({ size, position, material, mapId, textureUrl }: FloorProps) {
  const textureLoader = new TextureLoader();
  const { markItemLoaded } = useUI();
  const markedAsLoaded = useRef(false);

  const isTextureLoaded = useRef<boolean>(false);
  
  const texture = textureLoader.load(textureUrl, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(size[0], size[2]);
    isTextureLoaded.current = true;
    markTextureLoaded();
  }, undefined, (texture) => {
    texture = null;
    isTextureLoaded.current = false;
    markTextureLoaded();
  });

  const markTextureLoaded = () => {
    if (markedAsLoaded.current) return;
    markItemLoaded(getMapItemKey(MapLoadingTrackerItems.GROUND, mapId, mapId));
    markedAsLoaded.current = true;
    
  }

  return (
    <group>
      <RigidBody type="fixed">
        <mesh receiveShadow position={position}>
          <boxGeometry args={size} />
          {isTextureLoaded.current ? <meshBasicMaterial map={texture} /> : <meshStandardMaterial color={material.color} />}
        </mesh>
      </RigidBody>
    </group>
  );
}
