import React, { useState, useEffect } from "react";
import { Physics } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import { Grid, KeyboardControls } from "@react-three/drei";
import Ecctrl from "../../src/Ecctrl";
import MapRenderer from "./MapRenderer";
import { useLevelProgress } from "../stores/useLevelProgress";
import { useControls } from "leva";
import { useDialogs } from "../stores/useDialogs";
import { useUI } from "../stores/useUI";
import { useDevSettings } from "../stores/useDevSettings";
import CharacterModel from "./CharacterModel";
import { IsProduction } from "../utils/client";

export default function Game() {
  const { currentMap, setBackButton, initializeLoadingTracker, resetLoadingTracker, startGame } = useUI();
  const { initializeGame } = useLevelProgress();
  const dialog = useDialogs((state) => state.dialog);
  const { showGrid } = useDevSettings();
  const [pausedPhysics, setPausedPhysics] = useState(true);

  useEffect(() => {
    initializeGame();
    // Initialize loading tracker
    initializeLoadingTracker();
    return () => {
      resetLoadingTracker();
    };
  }, [initializeGame]);

  useEffect(() => {
    if (startGame) {
      console.log('Start game');
      setPausedPhysics(false);
      setBackButton(true);
    }
  }, [startGame]);

  const handleMapComplete = () => {
    // This will be called when all NPCs in a map are completed
    // The progress is automatically updated in the store
  };

  // Debug settings
  const { physics, disableControl, disableFollowCam } = useControls("World Settings", {
    physics: false,
    disableControl: false,
    disableFollowCam: false,
  });

  // Keyboard control preset
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
    { name: "action1", keys: ["1"] },
    { name: "action2", keys: ["2"] },
    { name: "action3", keys: ["3"] },
    { name: "action4", keys: ["KeyF"] },
  ];

  if (!currentMap) {
    return null;
  }

  return (
    <>
        {!IsProduction && <Perf position="bottom-left" />}
        {/* Grid */}
        {showGrid && (
          <Grid
            args={[300, 300]}
            sectionColor={"lightgray"}
            cellColor={"gray"}
            position={[0, -0.99, 0]}
            userData={{ camExcludeCollision: true }}
          />
        )}

        {/* Physics World */}
        <Physics debug={physics} timeStep="vary" paused={pausedPhysics}>
          {/* Keyboard Controls */}
          <KeyboardControls map={keyboardMap}>
            {/* Character Control */}
            <Ecctrl
              debug
              animated={true}
              followLight
              springK={2}
              dampingC={0.2}
              autoBalanceSpringK={1.2}
              autoBalanceDampingC={0.04}
              autoBalanceSpringOnY={0.7}
              autoBalanceDampingOnY={0.05}
              camLowLimit={-0.1}
              camUpLimit={1.5}
              camCollision={true}
              disableControl={dialog.isOpen ? true : disableControl}
              disableFollowCam={dialog.isOpen ? true : disableFollowCam}
              position={[0, 0, 0]} //disabled fall animation
            >
              <CharacterModel />
            </Ecctrl>
          </KeyboardControls>

          {/* Map Renderer */}
          <MapRenderer 
            mapId={currentMap}
            onComplete={handleMapComplete}
          />
        </Physics>
    </>
  );
}
