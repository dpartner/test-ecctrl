import { create } from "zustand";
import type { MapData } from "../types/MapData.types";
import { MapLoadingTrackerItems } from "../types/MapData.types";
import getMapItemKey from "../utils/mapItemsKeys";

type LoadingItem = {
  id: string;
  loaded: boolean;
  error?: string;
};

type LoadingTracker = {
  items: Map<string, LoadingItem>;
  allLoaded: boolean;
  loadingProgress: number;
  loadedItems: number;
  totalItems: number;
};

export const useUI = create<{
  currentMap: string | null;
  setCurrentMap: (map: string | null) => void;
  backButton: boolean;
  setBackButton: (back: boolean) => void;
  loadingTracker: LoadingTracker | null;
  initializeLoadingTracker: () => void;
  registerMapDataItems: (mapData: MapData) => void;
  resetLoadingTracker: () => void;
  registerItem: (id: string) => void;
  markItemLoaded: (id: string, error?: string) => void;
  markItemFailed: (id: string, error: string) => void;
  startGame: boolean;
  setStartGame: (start: boolean) => void;
  hoveredMapId: string | null;
  setHoveredMapId: (mapId: string | null) => void;
}>((set, get) => ({
  currentMap: null,
  setCurrentMap: (map: string | null) => set({ currentMap: map }),
  backButton: false,
  setBackButton: (back: boolean) => set({ backButton: back }),
  loadingTracker: null,
  startGame: false,
  setStartGame: (start: boolean) => set({ startGame: start }),
  hoveredMapId: null,
  setHoveredMapId: (mapId: string | null) => set({ hoveredMapId: mapId }),
  initializeLoadingTracker: () =>
    set({
      loadingTracker: {
        items: new Map(),
        allLoaded: false,
        loadingProgress: 0,
        loadedItems: 0,
        totalItems: 0,
      },
      startGame: false,
    }),
  resetLoadingTracker: () => set({ loadingTracker: null }),
  registerMapDataItems: (mapData: MapData) => {
    mapData.npcs.forEach((npc) => {
      get().registerItem(getMapItemKey(MapLoadingTrackerItems.NPC, mapData.mapId, npc.id));
    });
    mapData.terrain.objects.forEach((object) => {
      get().registerItem(getMapItemKey(MapLoadingTrackerItems.OBJECT, mapData.mapId, object.id));
    });
    mapData.terrain.platforms.forEach((platform) => {
      get().registerItem(getMapItemKey(MapLoadingTrackerItems.PLATFORM, mapData.mapId, platform.id));
    });
    mapData.terrain.obstacles.forEach((obstacle) => {
      get().registerItem(getMapItemKey(MapLoadingTrackerItems.OBSTACLE, mapData.mapId, obstacle.id));
    });
    get().registerItem(getMapItemKey(MapLoadingTrackerItems.GROUND, mapData.mapId, mapData.mapId));
    console.log(`✅ Registered ${mapData.npcs.length} NPCs, ${mapData.terrain.objects.length} objects, ${mapData.terrain.platforms.length} platforms, ${mapData.terrain.obstacles.length} obstacles`);
  },
  registerItem: (id: string) => {
    const tracker = get().loadingTracker;
    if (!tracker) return;
    const items = new Map(tracker.items);
    if (items.has(id)) return;
    items.set(id, { id, loaded: false });
    const totalItems = items.size;
    const loadedItems = Array.from(items.values()).filter((item) => item.loaded).length;
    const loadingProgress = totalItems > 0 ? loadedItems / totalItems : 0;
    const allLoaded = totalItems > 0 && loadedItems === totalItems;
    set({
      loadingTracker: {
        ...tracker,
        items,
        totalItems,
        loadedItems,
        loadingProgress,
        allLoaded,
      },
    });
  },
  markItemLoaded: (id: string, error?: string) => {
    const tracker = get().loadingTracker;
    if (!tracker) return;
    const items = new Map(tracker.items);
    const item = items.get(id);

    if (item) {
      items.set(id, { ...item, loaded: true, error });
    }
    const totalItems = items.size;
    const loadedItems = Array.from(items.values()).filter((item) => item.loaded).length;
    const loadingProgress = totalItems > 0 ? loadedItems / totalItems : 0;
    const allLoaded = totalItems > 0 && loadedItems === totalItems;

    console.log(`📦 Loading Progress: ${loadedItems}/${totalItems} (${Math.round(loadingProgress * 100)}%)`);

    if (allLoaded) {
      console.log('🎉 All items loaded!');
      setTimeout(() => {
        set({ startGame: true });
      }, 500);
    }
    set({
      loadingTracker: {
        ...tracker,
        items,
        totalItems,
        loadedItems,
        loadingProgress,
        allLoaded,
      },
    });
  },
  markItemFailed: (id: string, error: string) => {
    const tracker = get().loadingTracker;
    if (!tracker) return;
    const items = new Map(tracker.items);
    const item = items.get(id);
    if (item) {
      items.set(id, { ...item, loaded: true, error });
    }
    const totalItems = items.size;
    const loadedItems = Array.from(items.values()).filter((item) => item.loaded).length;
    const loadingProgress = totalItems > 0 ? loadedItems / totalItems : 0;
    const allLoaded = totalItems > 0 && loadedItems === totalItems;
    set({
      loadingTracker: {
        ...tracker,
        items,
        totalItems,
        loadedItems,
        loadingProgress,
        allLoaded,
      },
    });
  },
  getItemStatus: (id: string) => get().loadingTracker?.items.get(id),
  isItemLoaded: (id: string) => get().loadingTracker?.items.get(id)?.loaded || false,

}));