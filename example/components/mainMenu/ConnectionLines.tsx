import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import { ConnectionStatus } from "../../types/Status.types";
import { preloadConnectionNames, getConnectionDisplayNameSync } from "../../utils/connectionNames";
import { ConnectionLinesMode, useDevSettings } from "../../stores/useDevSettings";
import { useUI } from "../../stores/useUI";
import ConnectionLine from "./ConnectionLine";
import { clearConeCache } from "./MovingCones";

interface ConnectionLinesProps {
  maps: any[];
  mapData: { [mapId: string]: any };
  getMapStatus: (mapId: string) => string;
  isNPCCompleted: (mapId: string, npcId: string) => boolean;
  isMapUnlocked: (mapId: string) => boolean;
}


export default function ConnectionLines({ maps, mapData, getMapStatus, isNPCCompleted, isMapUnlocked }: ConnectionLinesProps) {
  const { connectionLinesMode, showConnectionName } = useDevSettings();
  const { hoveredMapId } = useUI();
  
  // Preload connection names on component mount
  useEffect(() => {
    preloadConnectionNames().catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      clearConeCache();
    };
  }, [maps]);
  // Calculate positions for each map using the same logic as islands
  const mapPositions = useMemo(() => {
    const positions: { [key: string]: THREE.Vector3 } = {};
    
    maps.forEach((map, index) => {
      const sphereRadius = SPHERE_RADIUS + (map.model.altitude * SPHERE_RADIUS);
      const sphereCenter = [0, 0, 0];
      const theta = map.model.theta * Math.PI;
      const phi = map.model.phi * Math.PI;
      
      
      const x = sphereCenter[0] + sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereCenter[1] + sphereRadius * Math.cos(phi);
      const z = sphereCenter[2] + sphereRadius * Math.sin(phi) * Math.sin(theta);
      
      positions[map.id] = new THREE.Vector3(x, y, z);
    });
    
    return positions;
  }, [maps]);

  // Generate connection lines based on NPC unlocks
  const connections = useMemo(() => {
    const lines: Array<{ 
      start: THREE.Vector3; 
      end: THREE.Vector3; 
      status: ConnectionStatus; 
      key: string; 
      npcName: string;
      sourceMapId: string;
      targetMapId: string;
    }> = [];
    
    // Iterate through all maps and their NPCs
    Object.entries(mapData).forEach(([sourceMapId, sourceMap]) => {
      if (sourceMap && sourceMap.npcs) {
        sourceMap.npcs.forEach((npc: any) => {
          // If NPC unlocks a map
          if (npc.unlocksMapId) {
            const targetMapId = npc.unlocksMapId;
            const startPos = mapPositions[sourceMapId];
            const endPos = mapPositions[targetMapId];
            
            if (startPos && endPos) {
              // Simplified connection status logic - only 2 states
              let connectionStatus = ConnectionStatus.LOCKED; // Red - NPC not completed
              
              // Check if this specific NPC is completed
              const isThisNPCCompleted = isNPCCompleted(sourceMapId, npc.id);
              
              if (isThisNPCCompleted) {
                // NPC is completed, so connection is green (map unlocked)
                connectionStatus = ConnectionStatus.MAP_UNLOCKED; // Green - NPC completed, map unlocked
              }
              
              const displayName = showConnectionName 
                ? (npc.connectionId ? getConnectionDisplayNameSync(npc.connectionId) : npc.name)
                : (npc.name);
              
              lines.push({
                start: startPos,
                end: endPos,
                status: connectionStatus,
                key: `${sourceMapId}-${targetMapId}-${npc.id}`,
                npcName: displayName,
                sourceMapId,
                targetMapId,
              });
            }
          }
        });
      }
    });
    
    return lines;
  }, [maps, mapPositions, mapData, getMapStatus, showConnectionName]);

  // Filter connections based on mode and hovered map
  const visibleConnections = useMemo(() => {
    if (connectionLinesMode === ConnectionLinesMode.ALL) {
      return connections;
    }
    
    // In 'hover' mode, only show connections for the hovered map
    if (!hoveredMapId) {
      return [];
    }
    
    return connections.filter(
      conn => conn.sourceMapId === hoveredMapId || conn.targetMapId === hoveredMapId
    );
  }, [connections, connectionLinesMode, hoveredMapId]);

  return (
    <group>
      {visibleConnections.map((connection) => (
        <ConnectionLine
          key={connection.key}
          start={connection.start}
          end={connection.end}
          status={connection.status}
          npcName={connection.npcName}
          sourceMapId={connection.sourceMapId}
          targetMapId={connection.targetMapId}
        />
      ))}
    </group>
  );
}
