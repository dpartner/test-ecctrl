import { DialogStep } from "../stores/useDialogs";
import { MapNPCUnlockMode, type MapData, type NPC } from "../types/MapData.types";
import type { WorldConfig, WorldMapConfig } from "../types/WorldCfg.types";
import type { GameProgress } from "../types/UserDto";

// Helper functions for working with GameProgress array
export const findNPCProgress = (progress: GameProgress[], mapId: string, npcId: string): GameProgress | null => {
  return progress.find(item => item.mapId === mapId && item.npcId === npcId) || null;
};

export const updateNPCProgress = (progress: GameProgress[], mapId: string, npcId: string, updates: Partial<GameProgress>): GameProgress[] => {
  return progress.map(item =>
    item.mapId === mapId && item.npcId === npcId
      ? { ...item, ...updates }
      : item
  );
};

export const addNPCProgress = (progress: GameProgress[], mapId: string, npcId: string, npcProgress: Omit<GameProgress, 'mapId' | 'npcId'>): GameProgress[] => {
  const existingIndex = progress.findIndex(item => item.mapId === mapId && item.npcId === npcId);

  if (existingIndex >= 0) {
    // Update existing
    return progress.map((item, index) =>
      index === existingIndex
        ? { mapId, npcId, ...npcProgress }
        : item
    );
  } else {
    // Add new
    return [...progress, { mapId, npcId, ...npcProgress }];
  }
};

export const loadGameData = async (): Promise<{ worldConfig: WorldConfig; mapsData: { [mapId: string]: MapData } }> => {
  // Load worldConfig
  const worldResponse = await fetch("/data/worldConfig.json");
  const worldConfig = await worldResponse.json() as WorldConfig;

  // Load all maps in parallel
  const mapPromises = worldConfig.maps.map(async (map: WorldMapConfig) => {
    const response = await fetch(`/data/maps/map${map.id}.json`);
    const mapsData = await response.json() as MapData;
    return { [map.id]: mapsData } as { [mapId: string]: MapData };
  });

  const mapResults = await Promise.all(mapPromises);
  const mapsData = mapResults.reduce((acc, curr) => ({ ...acc, ...curr }), {} as { [mapId: string]: MapData });

  return { worldConfig, mapsData };
};

export const createInitialProgress = (gameData: { worldConfig: WorldConfig; mapsData: { [mapId: string]: MapData } }, allNpcIndependent: boolean = false): GameProgress[] => {
  const progress: GameProgress[] = [];

  Object.entries(gameData.mapsData).forEach(([mapId, mapInfo]) => {
    const isMapUnlocked = mapId === "1"; // Only first map is unlocked

    mapInfo.npcs.forEach((npc: NPC) => {
      let isNPCUnlocked = false;

      if (isMapUnlocked) {
        if (allNpcIndependent || mapInfo.npcUnlockMode === MapNPCUnlockMode.INDEPENDENT) {
          // Independent mode (global or per-map): all NPCs are unlocked when map is unlocked
          isNPCUnlocked = true;
        } else {
          // Sequential mode: only first NPC is unlocked
          isNPCUnlocked = npc.prerequisiteNpcId === null;
        }
      }

      progress.push({
        mapId,
        npcId: npc.id,
        isUnlocked: isNPCUnlocked,
        isCompleted: false,
        dialogStep: DialogStep.QUESTION,
        factIndex: 0,
      });
    });
  });

  return progress;
};

export const syncProgressWithMapConfigs = (
  existingProgress: GameProgress[],
  gameData: { worldConfig: WorldConfig; mapsData: { [mapId: string]: MapData } },
  unlockedMaps: Set<string>,
  allNpcIndependent: boolean = false
): GameProgress[] => {
  let updatedProgress: GameProgress[] = [...existingProgress];

  Object.entries(gameData.mapsData).forEach(([mapId, mapInfo]) => {
    const isMapUnlocked = unlockedMaps.has(mapId);

    mapInfo.npcs.forEach((npc: NPC) => {
      // Find or create NPC progress
      let npcProgress = findNPCProgress(updatedProgress, mapId, npc.id);

      if (!npcProgress) {
        // Initialize NPC progress if it doesn't exist
        updatedProgress = addNPCProgress(updatedProgress, mapId, npc.id, {
          isUnlocked: false,
          isCompleted: false,
          dialogStep: DialogStep.QUESTION,
          factIndex: 0,
        });
        npcProgress = findNPCProgress(updatedProgress, mapId, npc.id)!;
      }

      // Only update unlock status if map is unlocked and NPC is not completed
      if (isMapUnlocked && !npcProgress.isCompleted) {
        let shouldUnlock = false;

        if (allNpcIndependent || mapInfo.npcUnlockMode === MapNPCUnlockMode.INDEPENDENT) {
          // Independent mode (global or per-map): unlock all NPCs on unlocked maps
          shouldUnlock = true;
        } else {
          // Sequential mode: check prerequisites
          if (npc.prerequisiteNpcId === null) {
            // First NPC is always unlocked
            shouldUnlock = true;
          } else {
            // Check if prerequisite NPC is completed
            const prerequisiteNPC = findNPCProgress(updatedProgress, mapId, npc.prerequisiteNpcId);
            shouldUnlock = prerequisiteNPC?.isCompleted || false;
          }
        }

        if (shouldUnlock) {
          updatedProgress = updateNPCProgress(updatedProgress, mapId, npc.id, { isUnlocked: true });
        }
      }
    });
  });

  return updatedProgress;
};

export const unlockNextNPC = (progress: GameProgress[], mapId: string, completedNpcId: string, mapData: MapData): GameProgress[] => {
  const nextNPC = mapData.npcs.find((npc: NPC) => npc.prerequisiteNpcId === completedNpcId);

  if (nextNPC && findNPCProgress(progress, mapId, nextNPC.id)) {
    return updateNPCProgress(progress, mapId, nextNPC.id, { isUnlocked: true });
  }

  return progress;
};

export const checkMapUnlock = (
  progress: GameProgress[],
  unlockedMaps: Set<string>,
  gameData: { worldConfig: WorldConfig; mapsData: { [mapId: string]: MapData } },
  completedMapId: string,
  completedNpcId: string
): { progress: GameProgress[]; unlockedMaps: Set<string> } => {
  let newProgress = [...progress];
  let newUnlockedMaps = new Set(unlockedMaps);

  // Find the completed NPC and check if it unlocks any map
  const mapData = gameData.mapsData[completedMapId];
  const completedNPC = mapData?.npcs.find(npc => npc.id === completedNpcId);

  if (completedNPC?.unlocksMapId && !newUnlockedMaps.has(completedNPC.unlocksMapId)) {
    const targetMapId = completedNPC.unlocksMapId;
    newUnlockedMaps.add(targetMapId);

    // Unlock NPCs on the newly unlocked map based on its unlock mode
    const targetMapData = gameData.mapsData[targetMapId];
    if (targetMapData) {
      if (targetMapData.npcUnlockMode === MapNPCUnlockMode.INDEPENDENT) {
        // Independent mode: unlock all NPCs at once
        targetMapData.npcs.forEach((npc: NPC) => {
          const npcProgress = findNPCProgress(newProgress, targetMapId, npc.id);
          if (npcProgress) {
            newProgress = updateNPCProgress(newProgress, targetMapId, npc.id, { isUnlocked: true });
          }
        });
      } else {
        // Sequential mode: unlock only first NPC
        const firstNPC = targetMapData.npcs.find((npc: NPC) => npc.prerequisiteNpcId === null);
        if (firstNPC && findNPCProgress(newProgress, targetMapId, firstNPC.id)) {
          newProgress = updateNPCProgress(newProgress, targetMapId, firstNPC.id, { isUnlocked: true });
        }
      }
    }
  }

  return { progress: newProgress, unlockedMaps: newUnlockedMaps };
};

// Add all maps that have no NPC dependencies (no NPC unlocks them) to unlockedMaps
export const addDependencyFreeMaps = (unlockedMaps: Set<string>, gameData: { worldConfig: WorldConfig; mapsData: { [mapId: string]: MapData } }): Set<string> => {
  try {
    const augmented = new Set(unlockedMaps);
    const mapIds = Object.keys(gameData.mapsData);
    const mapsWithDependencies = new Set<string>();

    Object.values(gameData.mapsData).forEach((map: MapData) => {
      map.npcs.forEach((npc: NPC) => {
        if (npc.unlocksMapId) mapsWithDependencies.add(npc.unlocksMapId);
      });
    });

    mapIds.forEach((mapId: string) => {
      if (mapId !== "1" && !mapsWithDependencies.has(mapId)) {
        augmented.add(mapId);
      }
    });

    return augmented;
  } catch (e) {
    console.warn("⚠️ Failed to auto-unlock dependency-free maps:", e);
    return unlockedMaps;
  }
};


