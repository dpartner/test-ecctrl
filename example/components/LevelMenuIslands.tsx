import React, { useEffect, useState } from "react";
import { useLevelProgress } from "../stores/useLevelProgress";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MenuSky from "./mainMenu/MenuSky";
import MapIslands from "./mainMenu/MapIslands";
import MainHeader from "./ui/MainHeader";
import MainFooter from "./ui/MainFooter";
import OceanSphere from "./mainMenu/OceanSphere";
import RotatablePlanet from "./mainMenu/RotatablePlanet";
import ConnectionLines from "./mainMenu/ConnectionLines";
import { MapStatus } from "../types/Status.types";
import { preloadConnectionNames } from "../utils/connectionNames";
import { LoginState, useAuth } from "../stores/useAuth";
import { useReownOpenWallet } from "../hooks/useReownOpenWallet";
import { Perf } from "r3f-perf";
import { IsProduction } from "../utils/client";

export const SPHERE_RADIUS = 50;

interface LevelMenuIslandsProps {
  onMapSelect: (mapId: string) => void;
}

export default function LevelMenuIslands({ onMapSelect }: LevelMenuIslandsProps) {
  const { 
    progress, 
    initializeGame, 
    isMapUnlocked,
    isNPCCompleted,
    getWorldConfig,
    getMapData,
    getMaps,
    isDataLoaded,
    isLoading
  } = useLevelProgress();

  const { loginState } = useAuth();
  const { openWallet } = useReownOpenWallet();
  // Get data from centralized store
  const worldConfig = getWorldConfig();
  const maps = getMaps();
  const mapData = getMapData();
  const [mapIdWaitLogin, setMapIdWaitLogin] = useState<string | undefined>(undefined);
  const [isPlanetDragging, setIsPlanetDragging] = useState(false);

  useEffect(() => {
    // Initialize game progress on component mount if not loaded and user is authenticated
    initializeGame();
    // Preload connection names for display
    preloadConnectionNames().catch(console.error);
  }, []);

  const handleMapSelect = (mapId: string) => {
    if (isMapUnlocked(mapId)) {
      if (loginState === LoginState.NoUser) {
        setMapIdWaitLogin(mapId);
        openWallet();
      } else if (loginState === LoginState.Authentificated) {
        onMapSelect(mapId);
      }
    }
  };

  useEffect(() => {
    if (mapIdWaitLogin && loginState === LoginState.Authentificated) {
      onMapSelect(mapIdWaitLogin);
      setMapIdWaitLogin(undefined);
    }
  }, [loginState]);

  const getMapStatus = (mapId: string): MapStatus => {
    if (!isMapUnlocked(mapId)) return MapStatus.LOCKED;
    
    // Check if map is completed (all NPCs completed)
    const mapNPCs = progress.filter(item => item.mapId === mapId);
    if (mapNPCs.length > 0) {
      const allCompleted = mapNPCs.every(npc => npc.isCompleted);
      if (allCompleted) return MapStatus.COMPLETED;
    }
    
    return MapStatus.UNLOCKED;
  };

  const getMapProgress = (mapId: string) => {
    const mapNPCs = progress.filter(item => item.mapId === mapId);
    if (mapNPCs.length === 0) return 0;
    
    const totalNPCs = mapNPCs.length;
    const completedNPCs = mapNPCs.filter(npc => npc.isCompleted).length;
    
    return (completedNPCs / totalNPCs) * 100;
  };

  // Show loading indicator while data is not loaded
  if (isLoading || !isDataLoaded()) {
    return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '40px',
          borderRadius: '20px',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          border: '3px solid #fff',
          minWidth: '300px',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          {isLoading ? "Loading world data..." : "Initializing..."}
        </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1000
    }}>
      <MainHeader worldName={worldConfig?.worldName} description={worldConfig?.description} />

      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: [0, 0, SPHERE_RADIUS * 1.02], 
          fov: 38,
          near: 0.1,
          far: 1000,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {!IsProduction && <Perf position="bottom-left" />}
        <MenuSky />
        
        
        {/* Camera controls - зум колесом миші */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          enableRotate={false}
          minDistance={SPHERE_RADIUS * 0.8}
          maxDistance={SPHERE_RADIUS * 12.5}
          autoRotate={false}
          zoomSpeed={0.5}
        />

        {/* Rotatable Planet */}
        <RotatablePlanet isDragging={isPlanetDragging} setIsDragging={setIsPlanetDragging}>
          {/* Planet sphere (ocean) - Fixed position centered */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[SPHERE_RADIUS, 36, 36]} />
            <meshStandardMaterial 
              color='#006994'
              roughness={0.1}
              metalness={0.1}
              opacity={0.9}
            />
          </mesh>
          
          {/* Ocean surface with animation */}
          <OceanSphere />

          {/* Connection lines between islands */}
          {Object.keys(mapData).length > 0 && (
            <ConnectionLines 
              maps={maps} 
              mapData={mapData}
              getMapStatus={getMapStatus}
              isNPCCompleted={isNPCCompleted}
              isMapUnlocked={isMapUnlocked}
            />
          )}

          <MapIslands 
            maps={maps}
            progress={progress}
            getMapStatus={getMapStatus}
            getMapProgress={getMapProgress}
            onMapSelect={handleMapSelect}
            isPlanetDragging={isPlanetDragging}
          />
        </RotatablePlanet>
      </Canvas>

      <MainFooter maps={maps} progress={progress} />
    </div>
  );
}
