import React, { Suspense, useEffect, useRef, useState } from "react";
import { useUI } from "../stores/useUI";
import { useReownOpenWallet } from "../hooks/useReownOpenWallet";
import { useDialogs } from "../stores/useDialogs";
import { Leva } from "leva";
import { EcctrlJoystick } from "../../src/EcctrlJoystick";
import UI from "./UI";
import { Canvas } from "@react-three/fiber";
import { Bvh } from "@react-three/drei";
import Game from "./Game";
import { LoginState, useAuth } from "../stores/useAuth";

const EcctrlJoystickControls = () => {
  const [isTouchScreen, setIsTouchScreen] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)) {
      setIsTouchScreen(true);
    } else {
      setIsTouchScreen(false);
    }
  }, []);
  
  return (
    <>
      {isTouchScreen && <EcctrlJoystick buttonNumber={5} />}
    </>
  );
};

const RootComponent = () => {
  const dialog = useDialogs((state) => state.dialog);
  const currentMap = useUI((state) => state.currentMap);
  const { initializeAuthService } = useAuth();
  const isInitializedAuthService = useRef(false);

  useEffect(() => {
    if (!isInitializedAuthService.current) {
      initializeAuthService();
      isInitializedAuthService.current = true;
    }
  }, []);

  return (
    <>
      <Leva collapsed />
      <EcctrlJoystickControls />
      <UI />
      {currentMap && <Canvas
        shadows
        camera={{
          fov: 65,
          near: 0.1,
          far: 1000,
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && !dialog.isOpen) {
            (e.target as HTMLElement).requestPointerLock();
          }
        }}
      >
        <Suspense fallback={null}>
          <Bvh firstHitOnly>
            <Game />
          </Bvh>
        </Suspense>
      </Canvas>}
    </>
  );
};

export default RootComponent;