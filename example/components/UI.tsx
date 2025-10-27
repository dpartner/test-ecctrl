import React from "react";
import { useUI } from "../stores/useUI";
import BackButton from "./ui/BackButton";
import DevMenu from "./ui/DevMenu";
import LevelMenuIslands from "./LevelMenuIslands";  
import LoadingTracker from "./ui/LoadingTracker";
import { IsProduction } from "../utils/client";

const UI = () => {
  const { currentMap, setCurrentMap, backButton, loadingTracker, resetLoadingTracker, startGame, setStartGame } = useUI();

  const handleBackToMenu = () => {
    setCurrentMap(null);
    setStartGame(false);
    resetLoadingTracker();
  };
  const handleMapSelect = (mapId: string) => {
    setCurrentMap(mapId);
  };

  if (loadingTracker && !startGame) {
    return (
      <>
        <LoadingTracker />
      </>
    );
  }

  if (!currentMap) {
    return (
      <>
        <LevelMenuIslands onMapSelect={handleMapSelect} />
        {!IsProduction && <DevMenu top={true} />}
      </>
    );
  }
  if (backButton) {
    return (
      <>
        <BackButton handleBack={handleBackToMenu} />
        {!IsProduction && <DevMenu top={false} />}
      </>
    );
  }

  return (
    <>
    </>
  );
};

export default UI;