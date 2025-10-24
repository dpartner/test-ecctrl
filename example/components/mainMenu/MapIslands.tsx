import React, { useMemo } from "react";
import InstancedIslands from "./InstancedIslands";
import IslandLabels from "./IslandLabels";
import type { MapStatus } from "../../types/Status.types";
import LoadableObject from "../objects/LoadableObject";
import { MapLoadingTrackerItems } from "../../types/MapData.types";
import { SPHERE_RADIUS } from "../LevelMenuIslands";
import * as THREE from "three";
import Island from "./Island";

interface MapIslandsProps {
  maps: any[];
  progress: any;
  isPlanetDragging: boolean;
  getMapStatus: (mapId: string) => MapStatus;
  getMapProgress: (mapId: string) => number;
  onMapSelect: (mapId: string) => void;
}

// export default function MapIslands({ maps, progress, getMapStatus, getMapProgress, onMapSelect }: MapIslandsProps) {
//   return (
//     <>
//       {maps.map((map) => {
//         const status = getMapStatus(map.id);
//         const prog = getMapProgress(map.id);

//         const sphereRadius = SPHERE_RADIUS + (map.model.altitude * SPHERE_RADIUS);
//         const sphereCenter = [0, 0, 0];
//         const theta = map.model.theta * Math.PI;
//         const phi = map.model.phi * Math.PI;

//         const x = sphereCenter[0] + sphereRadius * Math.sin(phi) * Math.cos(theta);
//         const y = sphereCenter[1] + sphereRadius * Math.cos(phi);
//         const z = sphereCenter[2] + sphereRadius * Math.sin(phi) * Math.sin(theta);

//         const surfaceNormal = new THREE.Vector3(x - sphereCenter[0], y - sphereCenter[1], z - sphereCenter[2]).normalize();
//         const up = new THREE.Vector3(0, 1, 0);
//         const quaternion = new THREE.Quaternion().setFromUnitVectors(up, surfaceNormal);
//         const euler = new THREE.Euler().setFromQuaternion(quaternion);

//         return (
//           <group key={map.id} position={[x, y, z]} rotation={[euler.x, euler.y, euler.z]}>
//             <LoadableObject 
//               modelURL={map.model.url}
//               mapId={map.id}
//               itemId={map.id}
//               itemType={MapLoadingTrackerItems.ISLAND}
//             >
//               {(gltf: any) => (
//                 <Island
//                   map={map}
//                   position={[0, 0, 0]}
//                   status={status}
//                   progress={prog}
//                   onSelect={() => onMapSelect(map.id)}
//                   gltf={gltf}
//                 />
//               )}
//             </LoadableObject>
//           </group>
//         );
//       })}
//     </>
//   )
// }

export default function MapIslands({ maps, progress, getMapStatus, getMapProgress, onMapSelect, isPlanetDragging }: MapIslandsProps) {
  // Group islands by model URL for optimization
  const islandsByModel = useMemo(() => {
    const groups: { [modelURL: string]: any[] } = {};
    
    maps.forEach(map => {
      const modelURL = map.model.url;
      if (!groups[modelURL]) {
        groups[modelURL] = [];
      }
      groups[modelURL].push(map);
    });
    
    return groups;
  }, [maps]);

  return (
    <>
      {Object.entries(islandsByModel).map(([modelURL, islands]) => (
        <LoadableObject 
          key={modelURL}
          modelURL={modelURL}
          mapId={islands[0].id}
          itemId={modelURL}
          itemType={MapLoadingTrackerItems.ISLAND}
        >
          {(gltf: any) => (
            <InstancedIslands
              maps={islands}
              progress={progress}
              getMapStatus={getMapStatus}
              getMapProgress={getMapProgress}
              onMapSelect={onMapSelect}
              modelURL={modelURL}
              gltf={gltf}
              isPlanetDragging={isPlanetDragging}
            />
          )}
        </LoadableObject>
      ))}
      
      <IslandLabels
        maps={maps}
        progress={progress}
        getMapStatus={getMapStatus}
        getMapProgress={getMapProgress}
      />
    </>
  );
}


