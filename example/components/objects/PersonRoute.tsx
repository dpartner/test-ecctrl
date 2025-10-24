import { useMemo } from "react";
import * as THREE from "three";
import React from "react";

type PersonRouteProps = {
  npc: {
    position: [number, number, number];
    route: [number, number, number][];
    color: string;
  }
}

export default function PersonRoute({ npc }: PersonRouteProps) {
  const { position, route, color } = npc;
  
  // Waypoints for Person movement (same as in Person.jsx)
  const waypoints = useMemo(() => {
    const basePos = new THREE.Vector3(position[0], position[1], position[2]);
    const routePoints = route.map(point => new THREE.Vector3(point[0], point[1], point[2]));
    return [
      basePos.clone(),
      ...routePoints,
    ];
  }, [position, route]);

  // Create geometry for the route line
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    
    // Create line segments between consecutive waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const currentPoint = waypoints[i];
      const nextPoint = waypoints[(i + 1) % waypoints.length]; // Loop back to first point
      
      // Add current point
      positions.push(currentPoint.x, currentPoint.y, currentPoint.z);
      // Add next point
      positions.push(nextPoint.x, nextPoint.y, nextPoint.z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [waypoints]);

  return (
    <group>
      {/* Route line using LineSegments */}
      <lineSegments userData={{ camExcludeCollision: true }}>
        <primitive object={lineGeometry} />
        <lineBasicMaterial color={color} />
      </lineSegments>
      
      {/* Waypoint markers */}
      {waypoints.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]} userData={{ camExcludeCollision: true }}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial 
            color={color} 
            transparent={index === 0 ? false : true} 
            opacity={index === 0 ? 1 : 0.5} 
          />
        </mesh>
      ))}
    </group>
  );
}
