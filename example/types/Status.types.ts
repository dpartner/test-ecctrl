// Map status enum
export enum MapStatus {
  LOCKED = "locked",
  UNLOCKED = "unlocked",
  COMPLETED = "completed"
}

// Connection status enum (for lines between islands)
export enum ConnectionStatus {
  LOCKED = "connection-locked",     // Red - NPC not completed
  MAP_UNLOCKED = "map-unlocked"     // Green - map is unlocked (any NPC completed)
}

// Colors for different statuses
export const STATUS_COLORS = {
  [MapStatus.LOCKED]: "#ff4444",     // Red
  [MapStatus.UNLOCKED]: "#009900",   // Green  
  [MapStatus.COMPLETED]: "#000000",  // Black

  [ConnectionStatus.LOCKED]: "#ff0000",        // Red
  [ConnectionStatus.MAP_UNLOCKED]: "#009900"   // Green
} as const;

// Connection line thickness based on status
export const CONNECTION_THICKNESS = {
  [ConnectionStatus.LOCKED]: 0.1,      // Збільшено з 0.5 до 1.0
  [ConnectionStatus.MAP_UNLOCKED]: 0.1 // Збільшено з 0.07 до 0.15
} as const;

// Emissive intensity for connections
export const CONNECTION_EMISSIVE_INTENSITY = {
  [ConnectionStatus.LOCKED]: 0,
  [ConnectionStatus.MAP_UNLOCKED]: 0.3
} as const;
