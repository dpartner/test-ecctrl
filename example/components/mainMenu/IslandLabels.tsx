import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import { STATUS_COLORS, MapStatus } from "../../types/Status.types";
import { useUI } from "../../stores/useUI";

interface IslandLabelsProps {
  maps: any[];
  progress: any;
  getMapStatus: (mapId: string) => MapStatus;
  getMapProgress: (mapId: string) => number;
}

const IslandLabels = ({ maps, progress, getMapStatus, getMapProgress }: IslandLabelsProps) => {
  const { hoveredMapId } = useUI();
  
  const getTextColor = (status: MapStatus) => STATUS_COLORS[status] || "#666666";
  
  const getMapStatusText = (status: MapStatus) => {
    return status === MapStatus.LOCKED ? "🔒" : status === MapStatus.COMPLETED ? "✅" : "🗺️";
  };
  
  const getMapProgressText = (progress: number) => {
    return progress === 100 ? "Completed" : `${Math.round(progress)}%`;
  };
  
  const getMapText = (mapName: string, status: MapStatus, progress: number) => {
    // Розбиваємо ім'я на слова
    const words = mapName.split(' ');
    let mapNameText = '';
    
    // Групуємо по 2 слова на рядок
    for (let i = 0; i < words.length; i += 2) {
      if (i > 0) {
        mapNameText += '\n';
      }
      mapNameText += words[i];
      if (i + 1 < words.length) {
        mapNameText += ' ' + words[i + 1];
      }
    }
    
    return mapNameText + "\n" + getMapStatusText(status) + "\n" + getMapProgressText(progress);
  };

  return (
    <>
      {maps.map((map) => {
        const status = getMapStatus(map.id);
        const prog = getMapProgress(map.id);
        const isHovered = hoveredMapId === map.id;

        const sphereRadius = SPHERE_RADIUS + (map.model.altitude * SPHERE_RADIUS);
        const sphereCenter = [0, 0, 0];
        const theta = map.model.theta * Math.PI;
        const phi = map.model.phi * Math.PI;

        const x = sphereCenter[0] + sphereRadius * Math.sin(phi) * Math.cos(theta);
        const y = sphereCenter[1] + sphereRadius * Math.cos(phi);
        const z = sphereCenter[2] + sphereRadius * Math.sin(phi) * Math.sin(theta);

        return (
          <Billboard
            key={map.id}
            position={[x, y + 2.4, z]}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <Text
              fontSize={0.45}
              color={getTextColor(status)}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
              textAlign="center"
            >
              {getMapText(map.name, status, prog)}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
};

export default IslandLabels;
