import { RigidBody } from "@react-three/rapier";
import React from "react";

// Separate component that renders preloaded GLTF scene
const SceneObject = ({ object }: { object: any }) => {
  if (!object.gltf || !object.gltf.scene) {
    console.warn(`Object ${object.id} has no GLTF scene loaded`);
    return null;
  }

  return (
    <RigidBody type="fixed" position={object.position}>
      <primitive object={object.gltf.scene.clone()} scale={object.scale} rotation={object.rotation} />
    </RigidBody>
  );
}

export default SceneObject;
