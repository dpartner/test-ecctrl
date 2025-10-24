import React, { useEffect, useState, Suspense, useCallback } from "react";
import { Html } from "@react-three/drei";
import { useLevelProgress } from "../stores/useLevelProgress";
import { Floor, Obstacle, Platform, NPC, Lighting, LoadableObject } from "./objects";
import { useUI } from "../stores/useUI";
import SceneObject from "./objects/SceneObject";
import type { MapData } from "../types/MapData.types";
import { MapLoadingTrackerItems } from "../types/MapData.types";

interface MapRendererProps {
  mapId: string;
  onComplete?: () => void;
}

export default function MapRenderer({ mapId, onComplete }: MapRendererProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const { progress, completeNPC } = useLevelProgress();
  const { registerMapDataItems, markItemLoaded } = useUI();

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/data/maps/map${mapId}.json`);
        const data = await response.json();
        registerMapDataItems(data);
        
        setMapData(data);
        
      } catch (error) {
        console.error(`Failed to load map ${mapId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [mapId]);

  const renderGround = () => {
    const { ground } = mapData?.terrain || {};
    
    if (ground?.type === "plane") {
      return (
        <Floor
          size={ground.size}
          position={ground.position}
          material={ground.material}
          mapId={mapId}
          textureUrl={ground.textureUrl}
        />
      );
    }
    
    return null;
  };

  const renderObstacles = () => {
    return mapData?.terrain.obstacles.map((obstacle) => {
      const key = obstacle.id;
      
      return (
        <Obstacle
          key={key}
          mapId={mapId}
          id={obstacle.id}
          type={obstacle.type}
          position={obstacle.position}
          size={obstacle.size}
          radius={obstacle.radius}
          height={obstacle.height}
          tube={obstacle?.tube}
          material={obstacle.material}
        />
      );
    });
  };

  const renderPlatforms = () => {
    return mapData?.terrain.platforms.map((platform) => {
      const key = platform.id;
      
      return (
        <Platform
          key={key}
          mapId={mapId}
          id={platform.id}
          type={platform.type}
          position={platform.position}
          size={platform.size}
          material={platform.material}
        />
      );
    });
  };
  const renderObjects = () => {
    return mapData?.terrain.objects.map((object) => (
      <LoadableObject
        key={object.id}
        modelURL={object.modelURL}
        mapId={mapId}
        itemId={object.id}
        itemType={MapLoadingTrackerItems.OBJECT}
      >
        {(gltf) => (
          <SceneObject 
            object={{ ...object, gltf }} 
          />
        )}
      </LoadableObject>
    ));
  };


  const renderNPCs = useCallback(() => {
    
    return mapData?.npcs.map((npc) => {
      const npcProgress = progress.find(item => item.mapId === mapId && item.npcId === npc.id);
      const isUnlocked = npcProgress?.isUnlocked || false;
      const isCompleted = npcProgress?.isCompleted || false;
      
      // NPC unlocking is now handled automatically in completeNPC
      
      // Always render all NPCs, but pass their locked status
      return (
        <LoadableObject
          key={npc.id}
          modelURL={npc.modelURL}
          mapId={mapId}
          itemId={npc.id}
          itemType={MapLoadingTrackerItems.NPC}
        >
          {(gltf) => (
            <NPC
              npc={{
                ...npc,
                gltf,
                isUnlocked,
                isCompleted
              } as any}
              mapId={mapId}
              onComplete={() => {
                completeNPC(mapId, npc.id);
                if (onComplete) onComplete();
              }}
            />
          )}
        </LoadableObject>
      );
    });
  }, [mapData, mapId, progress, onComplete, completeNPC]);

  if (loading || !mapData) {
    return (
      <Html center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '10px',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          border: '2px solid #fff',
        }}>
          Loading map: {mapId}...
        </div>
      </Html>
    );
  }

  return (
    <>
      {/* Environment */}
      {mapData?.environment.fog.enabled && (
        <fog
          attach="fog"
          args={[
            mapData.environment.fog.color,
            mapData.environment.fog.near,
            mapData.environment.fog.far
          ]}
        />
      )}
      
      {/* Lighting */}
      <Lighting
        ambient={mapData.environment.lighting.ambient}
        directional={mapData.environment.lighting.directional}
      />
      
      {/* Terrain */}
      {renderGround()}
      {renderObstacles()}
      {renderPlatforms()}
      {renderObjects()}
      
      {/* NPCs */}
      <Suspense fallback={null}>
        {renderNPCs()}
      </Suspense>
    </>
  );
}
