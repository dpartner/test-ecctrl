// Connection names mapping
let connectionNamesCache: { [key: string]: string } | null = null;

/**
 * Load connection names from JSON file
 */
const loadConnectionNames = async (): Promise<{ [key: string]: string }> => {
  if (connectionNamesCache) {
    return connectionNamesCache;
  }

  try {
    const response = await fetch('/data/connectionNames.json');
    if (!response.ok) {
      throw new Error(`Failed to load connection names: ${response.status}`);
    }

    connectionNamesCache = await response.json();
    return connectionNamesCache ?? {};
  } catch (error) {
    console.error('Error loading connection names:', error);
    return {};
  }
};

/**
 * Get display name for connection by connectionId
 * @param connectionId - The connection ID from NPC
 * @returns Display name for the connection line
 */
export const getConnectionDisplayName = async (connectionId: string): Promise<string> => {
  const connectionNames = await loadConnectionNames();
  return connectionNames[connectionId] || connectionId;
};

/**
 * Get display name for connection by connectionId (synchronous version)
 * Note: This requires connection names to be preloaded
 * @param connectionId - The connection ID from NPC
 * @returns Display name for the connection line
 */
export const getConnectionDisplayNameSync = (connectionId: string): string => {
  if (!connectionNamesCache) {
    console.warn('Connection names not loaded yet, using connectionId as fallback');
    return connectionId;
  }

  return connectionNamesCache[connectionId] || connectionId;
};

/**
 * Preload connection names for synchronous access
 */
export const preloadConnectionNames = async (): Promise<void> => {
  await loadConnectionNames();
};

/**
 * Get all connection names (for debugging or admin purposes)
 */
export const getAllConnectionNames = (): { [key: string]: string } | null => {
  return connectionNamesCache;
};
