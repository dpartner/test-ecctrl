export type WorldConfig = {
  worldName: string;
  version: string;
  description: string;
  maps: WorldMapConfig[];
}

export type WorldMapConfig = {
  id: string;
  name: string;
  description: string;
  model: WorldMapModelConfig;
}

export type WorldMapModelConfig = {
  url: string;
  scale: number;
  altitude: number;
  theta: number;
  phi: number;
}