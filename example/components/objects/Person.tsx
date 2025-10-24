import { Html } from "@react-three/drei";
import { useRef, useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../../src/stores/useGame";
import { useDialogs } from "../../stores/useDialogs";
import DialogPerson from "../../components/DialogPerson";
import React from "react";
import { RigidBody } from "@react-three/rapier";

type PersonProps = {
  npc: {
    id?: string;
    position: [number, number, number];
    text: string;
    route: [number, number, number][];
    color: string;
    modelURL: string;
    name?: string;
    dialogId?: string;
    isUnlocked?: boolean;
    isCompleted?: boolean;
    onComplete?: () => void;
    gltf?: any;
    map?: number;
    prerequisiteNpcId?: string | null;
  };
  mapId: string;
}

export default function Person({ npc, mapId }: PersonProps) {
  const { id, position, text, route, color, name, dialogId, isUnlocked = true, isCompleted = false, onComplete, gltf } = npc;
  const nodes = gltf?.nodes || {};
  const animations = gltf?.animations || [];
  const rigidBodyRef = useRef<any>(null);
  const animationRef = useRef<THREE.Group>(null);

  // useEffect(() => {
  //   console.log(id, 'animations' ,animations);
  // }, [animations]);
  
  const [showText, setShowText] = useState(false);
  const [isFetchingDialog, setIsFetchingDialog] = useState(false);
  const setNearNPC = useGame((state) => state.setNearNPC);
  // Animation mixer for GLTF animations
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Movement state
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [isStopped, setIsStopped] = useState(false);
  const [stopTimer, setStopTimer] = useState(0);
  const [isLookingAtPlayer, setIsLookingAtPlayer] = useState(false);
  const currentRotationRef = useRef(0);
  const targetRotationRef = useRef(0);

  // Get player position from store
  const playerPosition = useGame((state) => state.playerPosition);
  const openDialog = useDialogs((state) => state.openDialog);
  const dialog = useDialogs((state) => state.dialog);
  const setCameraTarget = useGame((state) => state.setCameraTarget);
  const setCameraPos = useGame((state) => state.setCameraPos);
  
  // Use the numeric NPC ID for progress tracking
  const npcId = id || "unknown";
  
  // Use dialogId for loading dialog data
  const dialogIdToLoad = dialogId || npcId;
  
  // Distance for showing text
  const interactionDistance = 3;
  
  // Movement settings
  const moveSpeed = 1.5; // units per second
  const stopDuration = 3; // seconds
  
  // Waypoints for Person movement (relative to initial position)
  const waypoints = useMemo(() => {
    const basePos = new THREE.Vector3(position[0], position[1], position[2]);
    const routePoints = route.map(point => new THREE.Vector3(point[0], point[1], point[2]));
    return [
      basePos.clone(),
      ...routePoints,
    ];
  }, [position, route]);

  const changeAnimation = useCallback((animationIndex: number) => {
    if (mixerRef.current && animations && animations.length > animationIndex) {
      try {
        mixerRef.current.stopAllAction();
        const actionCurrent = mixerRef.current.clipAction(animations[animationIndex]);
        actionCurrent.play();
      } catch (error) {
        console.log(error);
      }
    }
  }, [animations]);

  const lookAtPlayer = useCallback(() => {
    if (playerPosition && rigidBodyRef.current) {
      const personPos = getPersonPosition();
      
      // Calculate direction to player
      if (personPos) {
      const directionToPlayer = playerPosition.clone().sub(personPos);
      directionToPlayer.y = 0; // Keep rotation only on horizontal plane
      
      if (directionToPlayer.length() > 0.1) {
        directionToPlayer.normalize();
        const targetAngle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
          targetRotationRef.current = targetAngle;
        }
      }
    }
  }, [playerPosition]);

  useEffect(() => {
    if (isStopped || showText) {
      changeAnimation(2);
    } else {
      changeAnimation(15);
    }
  }, [isStopped, showText]);

  // When near the NPC, unlock the pointer cursor
  useEffect(() => {
    if (showText) {
      setNearNPC(true);
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } else {
      setNearNPC(false);
    }
  }, [showText]);

  // Initialize animations
  useEffect(() => {
    if (animations && animations.length > 0 && animationRef.current) {
      mixerRef.current = new THREE.AnimationMixer(animationRef.current);
      
      // Play the first animation
      changeAnimation(1);
    }
  }, [animations]);

  // Initialize rotation
  useEffect(() => {
    if (rigidBodyRef.current) {
      const currentPos = rigidBodyRef.current.translation();
      const targetWaypoint = waypoints[0];
      const direction = targetWaypoint.clone().sub(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z));
      const angle = Math.atan2(direction.x, direction.z);
      currentRotationRef.current = angle;
      targetRotationRef.current = angle;
    }
  }, [waypoints]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;
    
    // Update animations if mixer exists
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Smooth rotation towards target
    if (isLookingAtPlayer) {
      const rotationSpeed = 3; // radians per second
      const angleDiff = targetRotationRef.current - currentRotationRef.current;
      
      // Normalize angle difference to shortest path
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
      while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
      
      if (Math.abs(normalizedDiff) > 0.01) {
        const rotationStep = Math.sign(normalizedDiff) * rotationSpeed * delta;
        const actualStep = Math.abs(rotationStep) > Math.abs(normalizedDiff) ? normalizedDiff : rotationStep;
        currentRotationRef.current += actualStep;
        
        // Apply rotation
        rigidBodyRef.current.setRotation(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentRotationRef.current), 
          true
        );
      }
    }
    
    const personPos = getPersonPosition();
    const targetWaypoint = waypoints[currentWaypoint];
    
    // Check if player is nearby (pause movement during interaction)
    if (playerPosition && personPos) {
      const distance = personPos.distanceTo(playerPosition);
      
      if (distance < interactionDistance) {
        if (!showText) {
          setShowText(true);
          setIsLookingAtPlayer(true);
        }
        
        // Stop movement and look at player
        rigidBodyRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true);
        lookAtPlayer();
        
        // Pause movement during interaction
        return;
      } else {
        if (showText) {
          setShowText(false);
          setIsLookingAtPlayer(false);
        }
      }
    }
    
    // Handle movement
    if (isMoving && !isStopped && !isLookingAtPlayer && personPos) {
      const direction = targetWaypoint.clone().sub(personPos);
      const distance = direction.length();
      
      if (distance > 0.1) {
        // Move towards waypoint using physics
        direction.normalize();
        const velocity = direction.multiplyScalar(moveSpeed);
        rigidBodyRef.current.setLinvel(velocity, true);
        
        // Rotate towards movement direction
        const angle = Math.atan2(direction.x, direction.z);
        currentRotationRef.current = angle;
        targetRotationRef.current = angle;
        rigidBodyRef.current.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), true);
      } else {
        // Reached waypoint, stop for a while
        rigidBodyRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true);
        setIsMoving(false);
        setIsStopped(true);
        setStopTimer(stopDuration);
      }
    }
    
    // Handle stop timer
    if (isStopped && !showText && !isLookingAtPlayer) {
      setStopTimer(prev => {
        const newTimer = prev - delta;
        if (newTimer <= 0) {
          // Move to next waypoint
          setCurrentWaypoint(prev => (prev + 1) % waypoints.length);
          setIsMoving(true);
          setIsStopped(false);
          return 0;
        }
        return newTimer;
      });
    }
  });

  const getPersonPosition = () => {
    if (!rigidBodyRef.current) return null;
    const currentPos = rigidBodyRef.current.translation();
    return new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
  }

  const getCameraPositions = () => {
    if (!rigidBodyRef.current || !playerPosition) return { pos: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };
    const currentPos = rigidBodyRef.current.translation();
    
    // Calculate direction from player to NPC
    const direction = {
      x: currentPos.x - playerPosition.x,
      y: 0, // Keep horizontal only
      z: currentPos.z - playerPosition.z
    };
    
    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length === 0) return { pos: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };
    
    const normalizedDirection = {
      x: direction.x / length,
      z: direction.z / length
    };
    
    // Camera position: 1 unit away from Person in the direction from player to Person
    const cameraPos = {
      x: currentPos.x - normalizedDirection.x * 1.5, // 1 unit away from Person
      y: currentPos.y + 1, // Camera height above Person
      z: currentPos.z - normalizedDirection.z * 1.5
    };
    
    // Camera target: Person position
    const cameraTarget = {
      x: currentPos.x,
      y: currentPos.y + 1, // Look at Person's head level
      z: currentPos.z
    };
    
    return { pos: cameraPos, target: cameraTarget };
  };

  const handleStartInteraction = async () => {
    if (isFetchingDialog || !isUnlocked) return;
    
    // Check if dialog is already open
    if (dialog.isOpen) return;
    try {
      setIsFetchingDialog(true);
      
      const res = await fetch(`/data/dialogs/${dialogIdToLoad}.json`);
      const data = await res.json();

      // Set camera positions for dialog
      const { pos, target } = getCameraPositions();
      setCameraPos(pos);
      setCameraTarget(target);
      
      openDialog({
        npcId,
        mapId,
        npcName: name || "Character",
        facts: Array.isArray(data?.facts) ? data.facts : [],
        prompt: data?.prompt || "Would you like to learn an interesting fact?",
        onComplete: onComplete,
      });
    } catch (e) {
      // Set camera positions for dialog
      const { pos, target } = getCameraPositions();
      setCameraPos(pos);
      setCameraTarget(target);
      
      openDialog({
        npcId,
        mapId,
        npcName: name || "Character",
        facts: [
          "Fact 1: This NPC doesn't have a description yet.",
          "Fact 2: Add a JSON file in src/data/dialogs.",
          "Fact 3: See format in john.json",
        ],
        onComplete: onComplete,
      });
    } finally {
      setIsFetchingDialog(false);
    }
  };

  return (
    <RigidBody 
      ref={rigidBodyRef} 
      position={position}
      colliders="hull"
      mass={2}
      friction={0.7}
      restitution={1}
      linearDamping={0.5}
      angularDamping={0.8}
      enabledRotations={[false, true, false]} // Only allow Y rotation
      lockRotations={true} // Lock X and Z rotations
    >
      {/* GLTF Model */}
      <Suspense fallback={
        <mesh castShadow position={[0, 0.7, 0]}>
          <capsuleGeometry args={[0.3, 0.7]} />
          <meshStandardMaterial color={color} />
        </mesh>
      }>
        {nodes && Object.keys(nodes).length > 0 ? (
          <group ref={animationRef} position={[0, -0.99, 0]} onClick={handleStartInteraction}>
              <primitive 
                object={nodes[Object.keys(nodes)[0]]} 
                scale={[0.6, 0.6, 0.6]} // Scale down the model
                receiveShadow
                castShadow
              />
            </group>
        ) : (
          <group ref={animationRef} onClick={handleStartInteraction}>
            <mesh castShadow>
              <capsuleGeometry args={[0.3, 0.7]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        )}
      </Suspense>
      
      {/* Movement indicator */}
      {isMoving && (
        <mesh position={[0, 2.2, 0]} castShadow userData={{ camExcludeCollision: true }}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      )}
      
      {/* Stop indicator */}
      {isStopped && !isLookingAtPlayer && (
        <mesh position={[0, 2.2, 0]} castShadow userData={{ camExcludeCollision: true }}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}
      
      {/* Looking at player indicator */}
      {isLookingAtPlayer && (
        <mesh position={[0, 2.2, 0]} castShadow userData={{ camExcludeCollision: true }}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="yellow" />
        </mesh>
      )}
      
      {/* Status indicator above Person */}
      {showText && !dialog.isOpen && (
        <Html position={[0, 2, 0]} center >
          {isUnlocked ? (
            <div
              onClick={handleStartInteraction}
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '999px',
                border: '2px solid #fff',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                pointerEvents: 'auto',
                userSelect: 'none',
                position: 'relative',
              }}
            >
              Hi, I'm {name}...
            </div>
          ) : (
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '999px',
              border: '2px solid #666',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              position: 'relative',
            }}>
              🔒 Locked
            </div>
          )}
        </Html>
      )}

      {/* Completed indicator (always visible if completed) */}
      {isCompleted && isLookingAtPlayer && (
        <Html position={[0, 2.4, 0]} center >
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '999px',
            border: '2px solid #4CAF50',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            position: 'relative',
          }}>
            ✅ Completed
          </div>
        </Html>
      )}
      
      {/* Dialog UI */}
      <DialogPerson npcId={npcId} />
    </RigidBody>
  );
}
