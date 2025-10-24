import { create } from "zustand";
import { DialogStep } from "./useDialogs";
import { MapNPCUnlockMode, type MapData, type NPC } from "../types/MapData.types";
import type { WorldConfig, WorldMapConfig } from "../types/WorldCfg.types";
import { useDevSettings } from "./useDevSettings";
import { api } from "../utils/api";
import type { GameProgress } from "../types/UserDto";
import { LoginState, useAuth } from "./useAuth";
import {
  findNPCProgress,
  updateNPCProgress,
  loadGameData,
  createInitialProgress,
  syncProgressWithMapConfigs,
  unlockNextNPC,
  checkMapUnlock,
  addDependencyFreeMaps,
} from "../utils/levelProgressHelpers";

export interface NPCProgress {
  isUnlocked: boolean;
  isCompleted: boolean;
  dialogStep: DialogStep;
  factIndex: number;
}

interface GameData {
  worldConfig: WorldConfig;
  mapsData: { [mapId: string]: MapData };
}

interface LevelProgressStore {
  // State
  progress: GameProgress[];
  unlockedMaps: Set<string>;
  gameData: GameData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isProgressLoaded: boolean;

  // Actions
  initializeGame: () => Promise<void>;
  completeNPC: (mapId: string, npcId: string) => Promise<void>;
  updateNPCDialog: (mapId: string, npcId: string, step: DialogStep, factIndex: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  syncProgress: () => Promise<void>;
  loadProgressFromServer: () => Promise<void>;
  saveProgressToServer: () => Promise<void>;

  // Selectors
  isMapUnlocked: (mapId: string) => boolean;
  isNPCUnlocked: (mapId: string, npcId: string) => boolean;
  isNPCCompleted: (mapId: string, npcId: string) => boolean;
  getNPCProgress: (mapId: string, npcId: string) => GameProgress | null;
  getWorldConfig: () => WorldConfig | null;
  getMapData: () => { [mapId: string]: MapData };
  getMaps: () => WorldMapConfig[];
  isDataLoaded: () => boolean;
  checkIfNPCUnlocksNewMap: (mapId: string, npcId: string) => string | null;
}


// (helpers moved to LevelProgressService)

// Helper function to check if user is authenticated
const isUserAuthenticated = (): boolean => {
  const authState = useAuth.getState();
  return authState.loginState === LoginState.Authentificated;
};

export const useLevelProgress = create<LevelProgressStore>()((set, get) => ({
  // Initial state
  progress: [],
  unlockedMaps: new Set<string>(["1"]),
  gameData: null,
  isLoading: false,
  isSaving: false,
  error: null,
  isProgressLoaded: false,

  // Game initialization
  initializeGame: async () => {
    const state = get();
    const allNpcIndependent = useDevSettings.getState().allNpcIndependent;
    set({ isLoading: true, error: null });
    console.log("🔄 Initializing game", 'isUserAuthenticated:', isUserAuthenticated());
    try {
      const gameData = await loadGameData();

      let newProgress = state.progress;
      let newUnlockedMaps = state.unlockedMaps;

      // Try to load progress from server if user is authenticated
      if (isUserAuthenticated()) {
        try {
          const serverProgress = await api.getProgress();
          newProgress = serverProgress.gameProgress;
          newUnlockedMaps = new Set(serverProgress.unlockedMaps);
          console.log("✅ Loaded progress from server");
          set({ isProgressLoaded: true });
        } catch (error) {
          console.warn("⚠️ Failed to load progress from server, using local state:", error);
        }
      }

      // Auto-unlock maps that have no NPC dependencies (no NPC unlocks them)
      newUnlockedMaps = addDependencyFreeMaps(newUnlockedMaps, gameData);

      if (newProgress.length === 0) {
        console.log("🆕 Creating initial progress");
        newProgress = createInitialProgress(gameData, allNpcIndependent);
      } else {
        console.log("🔄 Syncing existing progress with current map configs");
        newProgress = syncProgressWithMapConfigs(newProgress, gameData, newUnlockedMaps, allNpcIndependent);
      }

      set({
        gameData,
        progress: newProgress,
        unlockedMaps: newUnlockedMaps,
        isLoading: false,
      });

      // Save initial progress to server if user is authenticated
      if (isUserAuthenticated()) {
        await get().saveProgressToServer();
      }

      console.log("✅ Game initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize game:", error);
      set({ isLoading: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  // NPC completion
  completeNPC: async (mapId: string, npcId: string) => {
    const state = get();
    if (!state.gameData) return;

    console.log(`✅ Completing NPC ${npcId} on map ${mapId}`);

    // 1. Mark NPC as completed
    let newProgress = updateNPCProgress(state.progress, mapId, npcId, { isCompleted: true });

    // 2. Unlock next NPC on current map (only in sequential mode)
    const mapData = state.gameData.mapsData[mapId];

    if (mapData.npcUnlockMode === MapNPCUnlockMode.SEQUENTIAL) {
      newProgress = unlockNextNPC(newProgress, mapId, npcId, mapData);
    }
    // In independent mode, all NPCs are already unlocked when map is unlocked

    // 3. Check if new maps can be unlocked
    const result = checkMapUnlock(newProgress, state.unlockedMaps, state.gameData, mapId, npcId);

    set({
      progress: result.progress,
      unlockedMaps: result.unlockedMaps,
    });

    // 4. Save to server if user is authenticated
    if (isUserAuthenticated()) {
      await get().saveProgressToServer();
    }
  },

  // NPC dialog update
  updateNPCDialog: async (mapId: string, npcId: string, step: DialogStep, factIndex: number) => {
    set((state) => ({
      progress: updateNPCProgress(state.progress, mapId, npcId, {
        dialogStep: step,
        factIndex,
      }),
    }));

    // Save to server if user is authenticated
    if (isUserAuthenticated()) {
      await get().saveProgressToServer();
    }
  },

  // Reset progress
  resetProgress: async () => {
    console.log("🔄 Resetting progress");

    const currentGameData = get().gameData;
    const initialProgress = currentGameData ?
      createInitialProgress(currentGameData, useDevSettings.getState().allNpcIndependent) : [];

    // Start with first map unlocked; if we have game data, also add dependency-free maps
    const baseUnlocked = new Set<string>(["1"]);
    const updatedUnlocked = currentGameData ? addDependencyFreeMaps(baseUnlocked, currentGameData) : baseUnlocked;

    set({
      progress: initialProgress,
      unlockedMaps: updatedUnlocked,
      error: null,
    });

    // Save to server if user is authenticated
    if (isUserAuthenticated()) {
      await get().saveProgressToServer();
    }
  },

  // Sync progress with current dev settings
  syncProgress: async () => {
    const state = get();
    if (!state.gameData) return;

    const allNpcIndependent = useDevSettings.getState().allNpcIndependent;
    console.log("🔄 Syncing progress with allNpcIndependent:", allNpcIndependent);

    const newProgress = syncProgressWithMapConfigs(
      state.progress,
      state.gameData,
      state.unlockedMaps,
      allNpcIndependent
    );

    set({ progress: newProgress });

    // Save to server if user is authenticated
    if (isUserAuthenticated()) {
      await get().saveProgressToServer();
    }
  },

  // Load progress from server
  loadProgressFromServer: async () => {
    if (!isUserAuthenticated()) {
      console.warn("⚠️ User not authenticated, cannot load progress from server");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const serverProgress = await api.getProgress();
      const currentGameData = get().gameData;
      const serverUnlocked = new Set(serverProgress.unlockedMaps);
      const augmentedUnlocked = currentGameData ? addDependencyFreeMaps(serverUnlocked, currentGameData) : serverUnlocked;
      set({
        progress: serverProgress.gameProgress,
        unlockedMaps: augmentedUnlocked,
        isLoading: false,
      });
      console.log("✅ Progress loaded from server");
    } catch (error) {
      console.error("❌ Failed to load progress from server:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load progress"
      });
    }
  },

  // Save progress to server
  saveProgressToServer: async () => {
    if (!isUserAuthenticated()) {
      console.warn("⚠️ User not authenticated, cannot save progress to server");
      return;
    }

    const state = get();
    set({ isSaving: true, error: null });

    try {
      await api.saveProgress({
        gameProgress: state.progress,
        unlockedMaps: Array.from(state.unlockedMaps),
      });
      set({ isSaving: false });
      console.log("✅ Progress saved to server");
    } catch (error) {
      console.error("❌ Failed to save progress to server:", error);
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : "Failed to save progress"
      });
    }
  },

  // Selectors
  isMapUnlocked: (mapId: string) => {
    if (mapId === "1") return true;
    return get().unlockedMaps.has(mapId);
  },

  isNPCUnlocked: (mapId: string, npcId: string) => {
    const npcProgress = findNPCProgress(get().progress, mapId, npcId);
    return npcProgress?.isUnlocked || false;
  },

  isNPCCompleted: (mapId: string, npcId: string) => {
    const npcProgress = findNPCProgress(get().progress, mapId, npcId);
    return npcProgress?.isCompleted || false;
  },

  getNPCProgress: (mapId: string, npcId: string) => {
    return findNPCProgress(get().progress, mapId, npcId);
  },

  getWorldConfig: () => get().gameData?.worldConfig || null,
  getMapData: () => get().gameData?.mapsData || {},
  getMaps: () => get().gameData?.worldConfig?.maps || [],
  isDataLoaded: () => !!get().gameData,

  // Check if completing this NPC will unlock a new map
  checkIfNPCUnlocksNewMap: (mapId: string, npcId: string) => {
    const state = get();
    if (!state.gameData) return null;

    // Find the NPC
    const mapData = state.gameData.mapsData[mapId];
    const npc = mapData?.npcs.find(n => n.id === npcId);

    if (!npc || !npc.unlocksMapId) return null;

    const targetMapId = npc.unlocksMapId;

    // Check if target map is already unlocked
    if (state.unlockedMaps.has(targetMapId)) return null;

    // Find all NPCs that unlock this target map
    const unlockingNPCs: Array<{ npcId: string, sourceMapId: string }> = [];

    Object.entries(state.gameData.mapsData).forEach(([sourceMapId, sourceMapInfo]) => {
      sourceMapInfo.npcs.forEach((sourceNpc: NPC) => {
        if (sourceNpc.unlocksMapId === targetMapId) {
          unlockingNPCs.push({ npcId: sourceNpc.id, sourceMapId });
        }
      });
    });

    // With new logic, any single NPC completion unlocks the map
    // So if this NPC unlocks a map, it will definitely unlock it
    return targetMapId;
  },
}));