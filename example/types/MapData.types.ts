export enum MapLoadingTrackerItems {
  NPC = "npc",
  OBJECT = "object",
  PLATFORM = "platform",
  OBSTACLE = "obstacle",
  GROUND = "ground",
  ISLAND = "island",
}

export enum MapNPCUnlockMode {
  SEQUENTIAL = "sequential",
  INDEPENDENT = "independent",
}

export type MapEnvironment = {
  skybox?: any;
  lighting: {
    ambient: {
      intensity: number;
      color: string;
    };
    directional: {
      intensity: number;
      color: string;
      position: [number, number, number];
      castShadow: boolean;
    };
  };
  fog: {
    enabled: boolean;
    color: string;
    near: number;
    far: number;
  };
}

export type Material = {
  type: string;
  color: string;
  roughness?: number;
  metalness?: number;
}

export type Ground = {
  type: string;
  size: [number, number, number];
  position: [number, number, number];
  material: Material;
  textureUrl: string;
}

export type Obstacle = {
  id: string;
  type: string;
  position: [number, number, number];
  size: [number, number, number];
  radius?: number;
  height?: number;
  tube?: number;
  material: Material;
}

export type Platform = {
  id: string;
  type: string;
  position: [number, number, number];
  size: [number, number, number];
  material: Material;
}

export type Object = {
  gltf: any;
  id: string;
  type: string;
  position: [number, number, number];
  scale: number;
  modelURL: string;
  rotation: [number, number, number];
}

export type MapTerrain = {
  ground: Ground;
  obstacles: Obstacle[];
  platforms: Platform[];
  objects: Object[];
}

export type NPC = {
  gltf?: any;
  id: string;
  name: string;
  connectionId?: string;
  dialogId: string;
  position: [number, number, number];
  route: [number, number, number][];
  text: string;
  color: string;
  modelURL: string;
  map: number;
  prerequisiteNpcId: string | null;
  unlocksMapId: string | null;
}

export type MapData = {
  mapId: string;
  npcUnlockMode: MapNPCUnlockMode;
  environment: MapEnvironment;
  terrain: MapTerrain;
  npcs: NPC[];
  playerStartPosition: [number, number, number];
  cameraStartPosition: [number, number, number];
  cameraStartTarget: [number, number, number];
}
