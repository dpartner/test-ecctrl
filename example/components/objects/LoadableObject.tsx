import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useUI } from "../../stores/useUI";
import getMapItemKey from "../../utils/mapItemsKeys";
import { MapLoadingTrackerItems } from "../../types/MapData.types";

interface LoadableObjectProps {
  modelURL: string;
  mapId: string;
  itemId: string;
  itemType: MapLoadingTrackerItems;
  children: (gltf: any) => React.ReactNode;
}

export default function LoadableObject({ 
  modelURL, 
  mapId, 
  itemId, 
  itemType, 
  children 
}: LoadableObjectProps) {
  const { markItemLoaded } = useUI();
  
  const gltf = useGLTF(modelURL);
  
  useEffect(() => {
    useGLTF.preload(modelURL);
  }, [modelURL]);
  
  useEffect(() => {
    if (gltf) {
      const itemKey = getMapItemKey(itemType, mapId, itemId);
      markItemLoaded(itemKey);
      console.log(`✅ Loaded ${itemType}: ${itemId}`);
    }
  }, [gltf, mapId, itemId, itemType, markItemLoaded]);
  
  return <>{children(gltf)}</>;
}
