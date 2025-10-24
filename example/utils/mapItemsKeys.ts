import { MapLoadingTrackerItems } from "../types/MapData.types";

export default function getMapItemKey(item: MapLoadingTrackerItems, mapId: string, itemId: string) {
  return `${item}-${mapId}-${itemId}`;
}