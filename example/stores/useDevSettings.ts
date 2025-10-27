import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum ConnectionLinesMode {
  ALL = 'all',
  HOVER = 'hover',
}

interface DevSettings {
  showGrid: boolean;
  showPersonRoute: boolean;
  connectionLinesMode: ConnectionLinesMode;
  allNpcIndependent: boolean;
  showConnectionName: boolean;
  toggleGrid: () => void;
  togglePersonRoute: () => void;
  toggleConnectionLinesMode: () => void;
  toggleAllNpcIndependent: () => void;
  toggleShowConnectionName: () => void;
}

export const useDevSettings = create<DevSettings>()(
  persist(
    (set) => ({
      showGrid: true,
      showPersonRoute: true,
      connectionLinesMode: ConnectionLinesMode.HOVER,
      allNpcIndependent: false,
      showConnectionName: true,
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      togglePersonRoute: () => set((state) => ({ showPersonRoute: !state.showPersonRoute })),
      toggleConnectionLinesMode: () => set((state) => ({
        connectionLinesMode: state.connectionLinesMode === ConnectionLinesMode.ALL ? ConnectionLinesMode.HOVER : ConnectionLinesMode.ALL
      })),
      toggleAllNpcIndependent: () => set((state) => ({ allNpcIndependent: !state.allNpcIndependent })),
      toggleShowConnectionName: () => set((state) => ({ showConnectionName: !state.showConnectionName })),
    }),
    {
      name: 'dev-settings',
    }
  )
);
