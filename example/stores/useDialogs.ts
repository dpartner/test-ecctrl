import { create } from "zustand";
import * as THREE from "three";
import { useGame } from "../../src/stores/useGame";
import { useLevelProgress } from "./useLevelProgress";
import { useUI } from "./useUI";

export enum DialogStep {
  NONE = "none",
  QUESTION = "question",
  FACT = "fact",
  MAP_UNLOCK_NOTIFICATION = "map_unlock_notification"
}

export type DialogState = {
  isOpen: boolean;
  npcId: string | null;
  npcName: string | null;
  step: DialogStep;
  factIndex: number;
  facts: string[];
  prompt: string;
  cameraTarget?: THREE.Vector3 | null;
  unlockedMapId?: string | null;
  unlockedMapName?: string | null;
};

export type DialogProgress = {
  step: DialogStep;
  factIndex: number;
  isCompleted: boolean;
};

export type OpenDialogParams = {
  npcId: string;
  mapId: string; // Add mapId for integration with new structure
  npcName?: string | null;
  facts?: string[];
  prompt?: string;
  cameraTarget?: THREE.Vector3 | null;
  onComplete?: () => void;
};

export const useDialogs = create<{
  dialog: DialogState;
  openDialog: (params: OpenDialogParams) => void;
  startFacts: () => void;
  nextFact: () => void;
  closeDialog: () => void;
  showMapUnlockNotification: (mapId: string, mapName: string) => void;
  acceptMapTransition: () => void;
  declineMapTransition: () => void;
  onCompleteCallback: (() => void) | null;
  currentMapId: string | null;
}>((set, get) => ({
  dialog: {
    isOpen: false,
    npcId: null,
    npcName: null,
    step: DialogStep.NONE,
    factIndex: 0,
    facts: [],
    prompt: "",
    cameraTarget: null,
    unlockedMapId: null,
    unlockedMapName: null,
  },

  onCompleteCallback: null,
  currentMapId: null,

  openDialog: (params: OpenDialogParams) => {
    // Load progress from centralized store
    const levelProgress = useLevelProgress.getState();
    const npcProgress = levelProgress.getNPCProgress(params.mapId, params.npcId);
    const step = npcProgress?.isCompleted ? DialogStep.QUESTION : npcProgress?.dialogStep || DialogStep.QUESTION;
    const factIndex = npcProgress?.isCompleted ? 0 : npcProgress?.factIndex || 0;

    set({
      dialog: {
        isOpen: true,
        npcId: params.npcId,
        npcName: params.npcName ?? null,
        step: step as DialogStep,
        factIndex: factIndex,
        facts: params.facts ?? [],
        prompt: params.prompt ?? "Would you like to learn an interesting fact?",
        cameraTarget: params.cameraTarget ?? null,
      },
      onCompleteCallback: params.onComplete ?? null,
      currentMapId: params.mapId,
    });
  },

  startFacts: () => {
    const dialog = get().dialog;
    const currentMapId = get().currentMapId;
    if (!dialog.isOpen || !currentMapId) return;

    // Update progress in existing NPC fields
    const levelProgress = useLevelProgress.getState();
    const currentProgress = levelProgress.getNPCProgress(currentMapId, dialog.npcId!);

    if (currentProgress) {
      // Update existing progress, preserve completion status
      levelProgress.updateNPCDialog(currentMapId, dialog.npcId!, DialogStep.FACT, 0);
    }

    set({
      dialog: { ...dialog, step: DialogStep.FACT, factIndex: 0 },
    });
  },

  nextFact: () => {
    const dialog = get().dialog;
    const currentMapId = get().currentMapId;
    if (!dialog.isOpen || !currentMapId) return;

    const nextIndex = dialog.factIndex + 1;
    if (nextIndex >= dialog.facts.length) {
      // Mark as completed
      const levelProgress = useLevelProgress.getState();
      levelProgress.updateNPCDialog(currentMapId, dialog.npcId!, DialogStep.FACT, dialog.facts.length - 1);

      // Check if this NPC unlocks a new map
      const unlockedMapId = levelProgress.checkIfNPCUnlocksNewMap(currentMapId, dialog.npcId!);

      if (unlockedMapId) {
        // Get map name
        const worldConfig = levelProgress.getWorldConfig();
        const unlockedMap = worldConfig?.maps.find(m => m.id === unlockedMapId);
        const unlockedMapName = unlockedMap?.name || `Map ${unlockedMapId}`;

        // Show map unlock notification
        set({
          dialog: {
            ...dialog,
            step: DialogStep.MAP_UNLOCK_NOTIFICATION,
            unlockedMapId,
            unlockedMapName,
          }
        });
        return;
      }

      // Call completion callback if available
      const state = get();
      if (state.onCompleteCallback) {
        state.onCompleteCallback();
      }

      // Clear camera positions for smooth transition back
      useGame.getState().setCameraPos(null);
      useGame.getState().setCameraTarget(null);

      set({
        dialog: {
          isOpen: false,
          npcId: null,
          npcName: null,
          step: DialogStep.NONE,
          factIndex: 0,
          facts: [],
          prompt: "",
          cameraTarget: null,
          unlockedMapId: null,
          unlockedMapName: null,
        },
        onCompleteCallback: null,
        currentMapId: null,
      });
      return;
    }

    // Update progress in existing NPC fields
    const levelProgress = useLevelProgress.getState();
    const currentProgress = levelProgress.getNPCProgress(currentMapId, dialog.npcId!);
    levelProgress.updateNPCDialog(currentMapId, dialog.npcId!, DialogStep.FACT, nextIndex);

    set({
      dialog: { ...dialog, factIndex: nextIndex },
    });
  },

  closeDialog: () => {
    const dialog = get().dialog;
    const currentMapId = get().currentMapId;
    if (!dialog.isOpen || !currentMapId) return;

    // Save current progress in existing NPC fields before closing
    if (dialog.step === DialogStep.QUESTION || dialog.step === DialogStep.FACT) {
      const levelProgress = useLevelProgress.getState();
      const currentProgress = levelProgress.getNPCProgress(currentMapId, dialog.npcId!);
      levelProgress.updateNPCDialog(currentMapId, dialog.npcId!, dialog.step, dialog.factIndex);
    }

    // Clear camera positions for smooth transition back
    useGame.getState().setCameraPos(null);
    useGame.getState().setCameraTarget(null);

    set({
      dialog: {
        isOpen: false,
        npcId: null,
        npcName: null,
        step: DialogStep.NONE,
        factIndex: 0,
        facts: [],
        prompt: "",
        cameraTarget: null,
      },
      onCompleteCallback: null,
      currentMapId: null,
    });
  },

  showMapUnlockNotification: (mapId: string, mapName: string) => {
    set((state) => ({
      dialog: {
        ...state.dialog,
        step: DialogStep.MAP_UNLOCK_NOTIFICATION,
        unlockedMapId: mapId,
        unlockedMapName: mapName,
      }
    }));
  },

  acceptMapTransition: () => {
    const dialog = get().dialog;
    const currentMapId = get().currentMapId;

    if (!dialog.unlockedMapId || !currentMapId) return;

    // Complete the NPC first
    const levelProgress = useLevelProgress.getState();
    levelProgress.completeNPC(currentMapId, dialog.npcId!);

    // Call completion callback if available
    const state = get();
    if (state.onCompleteCallback) {
      state.onCompleteCallback();
    }

    // Clear camera positions
    useGame.getState().setCameraPos(null);
    useGame.getState().setCameraTarget(null);

    // Close dialog
    set({
      dialog: {
        isOpen: false,
        npcId: null,
        npcName: null,
        step: DialogStep.NONE,
        factIndex: 0,
        facts: [],
        prompt: "",
        cameraTarget: null,
        unlockedMapId: null,
        unlockedMapName: null,
      },
      onCompleteCallback: null,
      currentMapId: null,
    });

    // Navigate to new map
    const uiStore = useUI.getState();
    uiStore.setCurrentMap(null);
    uiStore.setStartGame(false);
    uiStore.resetLoadingTracker();
    uiStore.initializeLoadingTracker();
    uiStore.setCurrentMap(dialog.unlockedMapId);
  },

  declineMapTransition: () => {
    const dialog = get().dialog;
    const currentMapId = get().currentMapId;

    if (!currentMapId) return;

    // Complete the NPC
    const levelProgress = useLevelProgress.getState();
    levelProgress.completeNPC(currentMapId, dialog.npcId!);

    // Call completion callback if available
    const state = get();
    if (state.onCompleteCallback) {
      state.onCompleteCallback();
    }

    // Clear camera positions
    useGame.getState().setCameraPos(null);
    useGame.getState().setCameraTarget(null);

    // Close dialog
    set({
      dialog: {
        isOpen: false,
        npcId: null,
        npcName: null,
        step: DialogStep.NONE,
        factIndex: 0,
        facts: [],
        prompt: "",
        cameraTarget: null,
        unlockedMapId: null,
        unlockedMapName: null,
      },
      onCompleteCallback: null,
      currentMapId: null,
    });
  },
}));